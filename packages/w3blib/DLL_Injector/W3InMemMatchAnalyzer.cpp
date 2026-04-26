#pragma once
#include <list>
#include "W3InMemMatchAnalyzer.h"
#include <string>
#include "json.h"
#include <time.h>
#include "DataPipeWriter.h"
#include <set>
#include "W3List.h"
#include "W3Research.h"
#include "RecorderStateMachine.h"
#include <regex>
#include "W3ListIterator.h"
#include "W3Item.h"
#include "W3ItemManager.h"
#include "W3Player.h"
#include <Shlobj.h>
#include "W3Settings.h"
#include "W3StateTracker.h"
#include "W3ResourceListIterator.h"


static const int OBSERVER_TEAM = 24;

CW3InMemMatchAnalyzer::CW3InMemMatchAnalyzer(ptr _pListsStartAddress, const std::string& _rRealm, const bool _IsReplay)
	: m_MatchJson(), m_IsReplay(_IsReplay), m_LastUnitScan(0),m_LastGameTimeScan(0), m_Heroes(), m_Researches(), m_ResourcesPerPlayer(), m_WorkerSupplyPerPlayer(), m_IngameTeams(), m_pCurrentPlayer(nullptr), m_CurrentGameTime(-1), m_ColorMode(-1), m_ChatbarState(0), m_HudScale(128), m_IsWon(false)
{//
	Sleep(500);
	//Sleep(10000);
	std::vector<W3Player*> Players;
	CW3ListManager::Initialize(_pListsStartAddress);

	do {
		Sleep(100);

#ifndef W3BDBG
		while (!CW3Process::GetInstance().IsInForeground()) {
			Sleep(200);
		}
#endif // W3BDBG
		ptr DBG_playerAddr = 0;
		int CurrentPlayerId = GetCurrentPlayerId();
		ptr listStart = CW3ListManager::GetInstance().GetList(W3List::EType::LIST_PLAYERS).refresh().GetFirstElementAddress();
		if (listStart != 0) {
			{
				int CircuitBreaker = 0;
				W3ListIterator<W3Player> PlayerIterator(listStart);
				do {
					W3Player& rPlayer = PlayerIterator.GetValue();
					if (rPlayer.IsPlaying()) {
						if (rPlayer.GetSlotId() == CurrentPlayerId && rPlayer.IsLocalPlayer()) {
							m_pCurrentPlayer = new W3Player(rPlayer);
							DBG_playerAddr = PlayerIterator.GetListItemAddress();
						}
					}
#ifdef W3BDBG
					static bool dbgPlayerPrinted = false;
					if (rPlayer.IsPlaying() && !dbgPlayerPrinted) {
						DbgPrintPlayerDetails(rPlayer);
						dbgPlayerPrinted = true;
					}
#endif // W3BDBG
				} while (PlayerIterator.next() && CircuitBreaker++ < 30);

				if (CircuitBreaker >= 30) {
					delete m_pCurrentPlayer;
					m_pCurrentPlayer = nullptr;
					CW3ListManager::Initialize(_pListsStartAddress);
				}

			}

			if (m_pCurrentPlayer != nullptr) {
				bool isObs = m_pCurrentPlayer->GetTeam() == OBSERVER_TEAM;
				bool isReplay = m_IsReplay;
				CW3GlobalGameInfo::GetInstance().SetObsOrReplay(isObs || isReplay);

				int CircuitBreaker = 0;
				W3ListIterator<W3Player> PlayerIterator(listStart);
				do {
					W3Player& rPlayer = PlayerIterator.GetValue();
					if (rPlayer.IsPlaying()) {
						EPlayerState PlayerState = rPlayer.GetPlayerState();
						W3Player* pPlayer = new W3Player(rPlayer);
						Players.push_back(pPlayer);
					}
				} while (PlayerIterator.next() && CircuitBreaker++ < 30);

				if (CircuitBreaker >= 30) {
					delete m_pCurrentPlayer;
					m_pCurrentPlayer = nullptr;
					for (W3Player* pPlayer : Players) {
						delete pPlayer;
					}
					Players.clear();
					CW3ListManager::Initialize(_pListsStartAddress);
				}
			}
		}
		else {
			Sleep(200);
			CW3ListManager::Initialize(_pListsStartAddress);
		}
		if (!CW3Process::GetInstance().FittingVersionIsRunning()) {
			return;
		}

		/*if (m_pCurrentPlayer != nullptr) {
			for (int i = 0; i < 3; i++) {
				Sleep()
			}
		}*/

	} while (m_pCurrentPlayer == nullptr);

	// detect Realm
	bool IsW3Champions = false;
	std::string gameName = GetGamename();
	if (gameName.rfind("W3Champions-", 0) == 0 || gameName.rfind("w3c-", 0) == 0 ) {
		IsW3Champions = true;
	}

	// detect GameMode
	bool IsTeamGame = false;
	int PlayingPlayerCount = 0;
	for (W3Player* pPlayer : Players) {
		if (pPlayer->GetTeam() != OBSERVER_TEAM) {
			PlayingPlayerCount++;
		}

		for (W3Player* pPlayerTwo : Players) {
			if (pPlayer != pPlayerTwo && pPlayer->GetTeam() != OBSERVER_TEAM &&  pPlayer->GetTeam() == pPlayerTwo->GetTeam()) {
				IsTeamGame = true;
				break;
			}
		}
		if (IsTeamGame) {
			break;
		}
	}

	bool IsBnetLadder = gameName.rfind("BNet", 0) == 0;

	// FFA on W3C anon
	bool IsAnonGame = false;
	if (!IsTeamGame && PlayingPlayerCount > 2 && (IsW3Champions || IsBnetLadder)) {
		IsAnonGame = true;
	}

	// fallback because of gn bug
	if (!IsTeamGame && PlayingPlayerCount == 4) {
		IsAnonGame = true;
	}
	CW3GlobalGameInfo::GetInstance().SetAnonymousGame(IsAnonGame);
	
	
	// Replay specific features
	if (CW3GlobalGameInfo::GetInstance().IsObsOrReplay()) {
		// Set player start positions
		ptr listStart = CW3ListManager::GetInstance().GetList(W3List::EType::LIST_UNITS).refresh().GetFirstElementAddress();
		if (listStart != 0) {
			W3ListIterator<W3Unit> UnitIterator(listStart);
			do {
				W3Unit& rUnit = UnitIterator.GetValue();
				if(rUnit.isMainBuilding()) {
					for (W3Player* pPlayer : Players) {
						if (pPlayer->GetSlotId() == rUnit.getSlotId()) {
							pPlayer->SetStartPos(rUnit.getPosX(), rUnit.getPosY());
							break;
						}
					}
				}
			} while (UnitIterator.next());
		}
	

		// set player resources
		ptr pplistStart = CW3ListManager::GetInstance().GetList(W3List::EType::LIST_PLAYERS).refresh().GetFirstElementAddress();
		std::unordered_set<W3Resource::EType> RelevantResources = { W3Resource::EType::GOLD, W3Resource::EType::LUMBER, W3Resource::EType::SUPPLY, W3Resource::EType::SUPPLY_CAP };

		std::vector<CW3MemoryUtils::ESequence> sequences = { CW3MemoryUtils::ESequence::RESOURCE_LIST };
		if (CW3MemoryUtils::GetInstance().FindW3Addresses(sequences, true)) {
			W3ResourceListIterator ResourceListIterator(CW3MemoryUtils::GetInstance().GetSequence(sequences[0]).address);
			while (true) {
				W3ResourceListIterator ResourceIterator(ResourceListIterator.GetResourceAddress() + sizeof(ptr));
				while (true) {
					W3Resource Resource(ResourceIterator.GetResourceAddress());
					if (Resource.GetSlotId() >= 0 && RelevantResources.find(Resource.GetResourceType()) != RelevantResources.end()) {
						m_ResourcesPerPlayer[Resource.GetSlotId()].push_back(W3Resource(Resource));
					}
					if (!ResourceIterator.hasNext()) {
						break;
					}
					ResourceIterator.next();
				}

				if (!ResourceListIterator.hasNext()) {
					break;
				}
				ResourceListIterator.next();
			}
		}
	}

	// serialize players!
	for (W3Player* pPlayer : Players) {
		m_MatchJson["players"][std::to_string(pPlayer->GetSlotId())] = pPlayer->Serialize();
		delete pPlayer;
	}

	m_MatchJson["game"]["map"] = GetMapName();
	m_MatchJson["id"] = GetTickCount64();
	m_MatchJson["broadcaster"] = m_pCurrentPlayer->GetName();
	m_MatchJson["broadcasterId"] = m_pCurrentPlayer->GetSlotId();
	m_MatchJson["realm"] = _rRealm;

	if (IsW3Champions) {
		m_MatchJson["realm"] = "W3Champions";
	}

	if (gameName.rfind("w3c-", 0) == 0) {
		std::string gateway = gameName.substr(4, 2);
		if (gateway == "10") {
			m_MatchJson["realm"] = "W3Champions@NA";
		}
		else if (gateway == "20") {
			m_MatchJson["realm"] = "W3Champions@EU";
		}
	}
	
	m_MatchJson["isReforged"] = IsHDModeEnabled();
	m_MatchJson["isObserver"] = m_pCurrentPlayer->GetTeam() == 24;
	m_MatchJson["isReplay"] = m_IsReplay;
	m_MatchJson["class"] = "W3Game";


	if (_rRealm == "Netease") {
		std::unordered_map<std::string, int> PlayerIdMap;
		for (auto& rPlayer : m_MatchJson["players"]) {
			if (rPlayer.find("name_buffer") != rPlayer.end() && rPlayer["name_buffer"].size() > 0) {
				std::stringstream ss;
				for (auto& val : rPlayer["name_buffer"]) {
					ss << (char)val.get<int>();
				}
				std::string name = ss.str();
				rPlayer["tName"] = name;
				PlayerIdMap[name] = 0;
			}
		}
		CW3MemoryUtils::GetInstance().GetNeteasePlayerIds(PlayerIdMap);
		for (auto it : PlayerIdMap) {
			for (auto& rPlayer : m_MatchJson["players"]) {
				if (rPlayer["tName"] == it.first) {
					rPlayer.erase("tName");
					if (it.second > 0) {
						rPlayer["neteaseId"] = it.second;
					}
				}
			}
		}
	}

	if (m_MatchJson["isReplay"] || m_MatchJson["isObserver"]) {
		SetToLocalGame();
	}

#ifdef W3BDBG
	CLogger::Log << m_MatchJson.dump(-1,' ', false, nlohmann::json::error_handler_t::replace) << CLogger::END;
#endif // W3BDBG

	CDataPipeWriter::GetInstance().Send(CDataPipeWriter::EMessageType::MATCHUP, m_MatchJson.dump());
	CDataPipeWriter::GetInstance().Send(GetGameDataMessageType(true), "[" + m_MatchJson.dump() + "]");
	Sleep(1000);
}

CW3InMemMatchAnalyzer::~CW3InMemMatchAnalyzer()
{
	m_MatchJson["isWon"] = (m_IsWon || (m_IngameTeams.size() == 1 && (m_IngameTeams.find(m_pCurrentPlayer->GetTeam()) != m_IngameTeams.end())));
	m_MatchJson["gameTime"] = m_CurrentGameTime;
	CDataPipeWriter::GetInstance().Send(CDataPipeWriter::EMessageType::MATCHUP, m_MatchJson.dump());


	m_MatchJson["class"] = "W3GameResult";

	if(CW3Process::GetInstance().W3ProcessIsRunning()) {
		ptr listStart = CW3ListManager::GetInstance().GetList(W3List::EType::LIST_PLAYERS).refresh().GetFirstElementAddress();
		W3ListIterator<W3Player> PlayerIterator(listStart);
		int CircuitBreaker = 0;
		do {
			W3Player& rPlayer = PlayerIterator.GetValue();
			if (rPlayer.IsPlaying()) {
				EPlayerState PlayerState = rPlayer.GetPlayerState();
				m_MatchJson["result"]["players"][std::to_string(rPlayer.GetSlotId())] = rPlayer.Serialize();
				m_MatchJson["result"]["players"][std::to_string(rPlayer.GetSlotId())]["slotState"] = rPlayer.GetRawData().slotState;
				m_MatchJson["result"]["players"][std::to_string(rPlayer.GetSlotId())]["playerState"] = rPlayer.GetRawData().playerState;
			}
			if (++CircuitBreaker > 100) {
				m_MatchJson["result"]["players"] = nlohmann::json::value_t::object;
				break;
			}
		} while (PlayerIterator.next());
	}
	m_MatchJson["result"]["ingameTeams"] = m_IngameTeams;
	m_MatchJson["result"]["won"] = m_MatchJson["isWon"];

	CDataPipeWriter::GetInstance().Send(GetGameDataMessageType(), "[" + m_MatchJson.dump() + "]");
	W3EntityPersistentDataRegistry::GetInstance().FlushPersistentData();
}

void CW3InMemMatchAnalyzer::Run() {
	Run(ERunFlags::NO_FLAGS);
}

void CW3InMemMatchAnalyzer::Run(unsigned int RUN_FLAGS) {
	nlohmann::json changes;

	if (!m_IsWon) {
		
		if (CW3StateTracker::GetInstance().HasStateFlag(CW3StateTracker::EStateFlags::WON) && !CW3StateTracker::GetInstance().HasStateFlag(CW3StateTracker::EStateFlags::LOST)) {
			m_IsWon = true;
		}
	}

	CW3GlobalGameInfo::GetInstance().RefreshGameTime();
	CW3ItemManager::GetInstance().RefreshItemList();

	ptr listStart = 0;
	std::unordered_map<int, int>WorkerSupplyPerPlayer;
	if (difftime(time(0), m_LastUnitScan) >= 0.5) {
		m_LastUnitScan = time(0);
		listStart = CW3ListManager::GetInstance().GetList(W3List::EType::LIST_UNITS).refresh().GetFirstElementAddress();
		if (listStart != 0) {
			W3ListIterator<W3Unit> UnitIterator(listStart);
			do {
				W3Unit& rUnit = UnitIterator.GetValue();
				if (rUnit.isHero()) {
					m_Heroes.emplace(rUnit.GetIdent(), rUnit);
				}

				if (rUnit.isWorker()) {
					WorkerSupplyPerPlayer[rUnit.getSlotId()]++;
				}
			} while (UnitIterator.next());
		}

		//Worker supply
		for (auto& rPair : WorkerSupplyPerPlayer) {
			if (m_WorkerSupplyPerPlayer[rPair.first] != rPair.second) {
				m_WorkerSupplyPerPlayer[rPair.first] = rPair.second;
				changes.push_back(nlohmann::json::parse("{\"class\":\"W3Resource\", \"slotId\": " + std::to_string(rPair.first) + ", \"type\":" + std::to_string(W3Resource::EType::WORKER_SUPPLY) + ", \"value\":" + std::to_string(rPair.second) + "}"));
			}
		}

		listStart = CW3ListManager::GetInstance().GetList(W3List::EType::LIST_RESEARCH).refresh().GetFirstElementAddress();
		if (listStart != 0) {
			W3ListIterator<W3Research> ResearchIterator(listStart);
			do {
				W3Research& rResearch = ResearchIterator.GetValue();
				m_Researches.emplace(rResearch.GetIdent(), rResearch);
			} while (ResearchIterator.next());
		}
	}

	/*PLAYERS*/
	int CurrentPlayerId = GetCurrentPlayerId();
	if (m_MatchJson["broadcasterId"] != CurrentPlayerId) {
		CLogger::Log << "Selected user switched to: " << CurrentPlayerId << CLogger::END;
		m_MatchJson["broadcasterId"] = CurrentPlayerId;
		changes.push_back(nlohmann::json::parse("{\"class\":\"W3PlayerSlot\", \"value\":" + std::to_string(CurrentPlayerId) + "}"));
	}

	m_IngameTeams.clear();
	listStart = CW3ListManager::GetInstance().GetList(W3List::EType::LIST_PLAYERS).refresh().GetFirstElementAddress();
	if (listStart != 0) {
		W3ListIterator<W3Player> PlayerIterator(listStart);
		do {
			W3Player& rPlayer = PlayerIterator.GetValue();
			if (rPlayer.IsPlaying() && !rPlayer.HasLeft()) {
				m_IngameTeams.insert(rPlayer.GetTeam());

				for (auto& rResource : m_ResourcesPerPlayer[rPlayer.GetSlotId()]) {
					rResource.Refresh();
					if(rResource.HasChanged()) {
						changes.push_back(rResource.Serialize());
					}
				}
			}

			if (rPlayer.HasChanged()) {
				changes.push_back(rPlayer.Serialize());
			}
		} while (PlayerIterator.next());
	}

	/* GAMETIME */
	if (difftime(time(0), m_LastGameTimeScan) >= 0.4) {
		m_LastGameTimeScan = time(0);
		int CurrentGameTime = (CW3GlobalGameInfo::GetInstance().GetGameTime() + 300) / 1000;
		if (CurrentGameTime > m_CurrentGameTime) {
			m_CurrentGameTime = CurrentGameTime;
			changes.push_back(nlohmann::json::parse("{\"class\":\"W3GameTime\", \"value\":" + std::to_string(m_CurrentGameTime) + "}"));
			CDataPipeWriter::GetInstance().Send(CDataPipeWriter::EMessageType::GAMETIME, std::to_string(m_CurrentGameTime));
		}
	}

	/* CHATBAR_STATE */
	int ChatbarState = GetChatbarState();
	if (ChatbarState != m_ChatbarState) {
		m_ChatbarState = ChatbarState;
		changes.push_back(nlohmann::json::parse("{\"class\":\"W3ChatbarState\", \"value\":" + std::to_string(m_ChatbarState) + "}"));
	}

	/* HUD_SCALE */
	uint8_t HudScale = GetHudScale();
	if (HudScale != m_HudScale && HudScale <= 128) {
		m_HudScale = HudScale;
		changes.push_back(nlohmann::json::parse("{\"class\":\"W3HudScale\", \"value\":" + std::to_string(m_HudScale) + "}"));
	}

	/* COLORMODE */
	int Colormode = GetColormode();
	if (Colormode != m_ColorMode) {
		m_ColorMode = Colormode;
		std::string value = ((m_ColorMode == 0) ? "true" : "false");
		changes.push_back(nlohmann::json::parse("{\"class\":\"W3TeamColor\", \"value\":" + value + "}"));
	}

	if(CW3GlobalGameInfo::GetInstance().IsProOrObserver()) {
		for (auto& HeroIterator : m_Heroes) {
			W3Unit& rHero = HeroIterator.second;
			rHero.Refresh();
			if (rHero.GetIdent() != HeroIterator.first) {
				m_Heroes.erase(HeroIterator.first);
				break;
			}

			if (rHero.HasChanged() && !(RUN_FLAGS & ERunFlags::NO_HEROES)) {
				changes.push_back(rHero.Serialize());
			}
	}
	}
	if (CW3GlobalGameInfo::GetInstance().IsProOrObserver()) {
		for (auto& ResearchIterator : m_Researches) {
			W3Research& rResearch = ResearchIterator.second;
			rResearch.Refresh();
			if (rResearch.GetIdent() != ResearchIterator.first) {
				m_Researches.erase(ResearchIterator.first);
				break;
			}

			if (rResearch.HasChanged()) {
				changes.push_back(rResearch.Serialize());
			}
		}
	}

	if (changes.size() > 0) {

		for (auto& rChange : changes) {
			rChange["matchId"] = m_MatchJson["id"];
		}

		std::reverse(std::begin(changes), std::end(changes));
		try {
			CDataPipeWriter::GetInstance().Send(GetGameDataMessageType(), changes.dump());
		}
		catch (...) {
			CLogger::Log << "ERROR: was unable to convert data to json. Update skipped" << CLogger::END;
		}
	}
}

int CW3InMemMatchAnalyzer::GetCurrentPlayerId() {
	SIZE_T readChunkBytes;
	ptr pSlotAddress = CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::CURRENTSLOT).address;
	int CurrentPlayerId = 0;
	ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)pSlotAddress, &CurrentPlayerId, sizeof(CurrentPlayerId), &readChunkBytes);
	return CurrentPlayerId;
}

int CW3InMemMatchAnalyzer::GetChatbarState()
{
	SIZE_T readChunkBytes;
	ptr pChatbarStateAddress = CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::CHATBAR_STATE).address;
	int32_t ChatbarState = 0;
	ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)pChatbarStateAddress, &ChatbarState, sizeof(int32_t), &readChunkBytes);
	return ChatbarState;
}

uint8_t CW3InMemMatchAnalyzer::GetHudScale()
{
	SIZE_T readChunkBytes;
	ptr pHudScaleAddress = CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::HUD_SCALE).address + 2;
	uint8_t HudScaleAndCheckByte[] = {0,0};
	ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)pHudScaleAddress, &HudScaleAndCheckByte, sizeof(HudScaleAndCheckByte), &readChunkBytes);
	uint8_t HudScale = HudScaleAndCheckByte[0];
	uint8_t CheckByte = HudScaleAndCheckByte[1];
	if (CheckByte != 60) {
		HudScale = 255;
	}
	else {
		HudScale -= 103;
	}
	return HudScale;
}

int CW3InMemMatchAnalyzer::GetColormode()
{
	SIZE_T readChunkBytes;
	ptr pColormodeAddress = CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::COLORMODE).address;
	int32_t Colormode = 0;
	ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)pColormodeAddress, &Colormode, sizeof(int32_t), &readChunkBytes);
	return Colormode;
}


std::string CW3InMemMatchAnalyzer::GetGamename()
{
	SIZE_T readChunkBytes;
	CW3MemoryUtils::GetInstance().FindW3Addresses(std::vector<CW3MemoryUtils::ESequence>{ CW3MemoryUtils::GAMENAME }, true);
	ptr pColormodeAddress = CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::GAMENAME).address;
	char Buffer[50] = { 0 };
	ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)pColormodeAddress, &Buffer, sizeof(Buffer), &readChunkBytes);
	Buffer[sizeof(Buffer) - 1] = '\0';
	return std::string(Buffer);

	//CW3MemoryUtils::GetInstance().
	//TODO
	//std::string gn = std::string(W3API::GetAPI()->Game->GameName);
	//return gn;
	//return "";
	/*
	SIZE_T readChunkBytes;
	ptr pGameNamePtrAddress = CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::GAMENAME).address;
	ptr pGameNamePtr;
	ReadProcessMemory(CW3Process::getInstance().GetProcessHandle(), (void*)pGameNamePtrAddress, &pGameNamePtr, sizeof(pGameNamePtr), &readChunkBytes);
	//BYTE* pGameNameAddress = ((BYTE*)pGameNamePtr) + 296;
	BYTE* pGameNameAddress = ((BYTE*)pGameNamePtr) + 14;
	char NameBuffer[50];

	//ReadProcessMemory(CW3Process::getInstance().GetProcessHandle(), ((BYTE*)pGameNamePtr) + 14, &NameBuffer, sizeof(NameBuffer), &readChunkBytes);
	ReadProcessMemory(CW3Process::getInstance().GetProcessHandle(), pGameNameAddress, &NameBuffer, sizeof(NameBuffer), &readChunkBytes);
	return CUtils::URLEncode(std::string(NameBuffer));
	*/
}
//
std::string CW3InMemMatchAnalyzer::GetMapName() {
	SIZE_T readChunkBytes;
	ptr pMapNameAddress = CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::MAPNAME).address;
	char NameBuffer[50] = { 0 };
	ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)pMapNameAddress, &NameBuffer, sizeof(NameBuffer), &readChunkBytes);
	NameBuffer[sizeof(NameBuffer) - 1] = '\0';
	return CUtils::URLEncode(std::string(NameBuffer));
}

nlohmann::json& CW3InMemMatchAnalyzer::GetMatchJson()
{
	return m_MatchJson;
}

bool CW3InMemMatchAnalyzer::IsHDModeEnabled()
{	
	/*
	if (CW3Settings::getInstance().Has("REFORGED_ICONS")) {
		return CW3Settings::getInstance().Get("REFORGED_ICONS") == "0";
	}
	return false;
	*/
	return false;
}

void CW3InMemMatchAnalyzer::DbgPrintPlayerDetails(W3Player& _rPlayer) {
	CLogger::Log << "PLAYER-DBG (Player " << _rPlayer.GetSlotId() << "): Base Address: 0x" << std::hex << _rPlayer.GetAddress() << std::dec <<  CLogger::END;
	for (int i = 0; i < 500; i++) {
		uint32_t WORD;
		SIZE_T readChunkBytes;
		ptr CurrentAddress = _rPlayer.GetAddress() + (sizeof(WORD) * i);
		ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)(CurrentAddress), &WORD, sizeof(WORD), &readChunkBytes);
		// if is random indicator
		if (WORD == 96) {
			ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)(CurrentAddress + sizeof(WORD)), &WORD, sizeof(WORD), &readChunkBytes);
			// if is race after random indicator
			if (WORD > 0 && WORD <= 4) {
				//get real slot id
				int detectedSlotId = 0;
				ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)(_rPlayer.GetAddress() + (sizeof(WORD) * 26)), &detectedSlotId, sizeof(WORD), &readChunkBytes);
				bool slotIdWasDetected = detectedSlotId != 0;
				CLogger::Log << "PLAYER-DBG: Detected SLOT-ID: " << std::hex << detectedSlotId  << std::dec <<  std::endl;
				CLogger::Log << "PLAYER-DBG: Full" << std::endl
					<< "	ptr _u1;" << std::endl
					<< "	ptr playerState; //3,4 not set 5 remote Player 6 left" << std::endl
					<< "	ptr _u2[9];" << std::endl
					<< "	" << ((slotIdWasDetected) ? "BYTE slotId[4];" : "uint32_t _u4swap;") << std::endl
					<< "	" << ((slotIdWasDetected) ? "uint32_t _u4swap;" : "BYTE slotId[4];") << std::endl
					<< "	ptr _u4[2];" << std::endl
					<< "	ptr deprecatedNameObject_Only15Chars;" << std::endl
					<< "	ptr _u5[3];" << std::endl
					<< "	ptr nameObject;" << std::endl
					<< "	ptr _u6[25];" << std::endl
					<< "	ptr groupsObject;" << std::endl
					<< "	ptr _u7[" << (i / 2) - 48 + ((i % 2 == 0) ? -1 : 0 )<< "];" << std::endl
					<< "	" << ((i%2 == 0) ? "uint32_t _u8;" : "") << std::endl
					<< "	uint32_t colorId;" << std::endl
					<< "	uint32_t isAI;" << std::endl
					<< "	uint32_t _u9[2];" << std::endl
					<< "	uint32_t slotState;" << std::endl
					<< "	uint32_t team;" << std::endl
					<< "	uint32_t _u10[1];" << std::endl
					<< "	uint32_t randomIndicator; // 96 = rdm; 65=hu; 66=orc;..." << std::endl
					<< "	uint32_t raceId; // 1 = hu; 2 = orc; 3=ud; 4=ne"
					<< CLogger::END;
			}
		}
	}
}
