#pragma once
#include <list>
#include "W3APIMatchAnalyzer.h"
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
#include "W3Api/W3API.h"



CW3APIMatchAnalyzer::CW3APIMatchAnalyzer(ptr _pListsStartAddress, const std::string& _rRealm, const bool _IsReplay)
	: m_InMemMatchAnalyzer(_pListsStartAddress, _rRealm, _IsReplay), m_MatchJson(), m_IsReplay(_IsReplay), m_LastUnitScan(0), m_Heroes(), m_Researches(), m_IngameTeams(), m_pCurrentPlayer(nullptr), m_CurrentGameTime(-1), m_ColorMode(-1), m_ChatbarState(0), m_IsWon(false)
{//

	if (m_InMemMatchAnalyzer.GetGameDataMessageType(false) == CDataPipeWriter::EMessageType::LOCAL_GAMEDATA) {
		SetToLocalGame();
	}

	CW3GlobalGameInfo::GetInstance().SetAnonymousGame(false);
	W3API::GetAPI()->SetRefreshRate(200);

	while (W3API::GetAPI()->Game->ActivePlayersCount <= 0) {
		Sleep(50);
	};

	W3API::GetAPI()->Game.Init();

	for (int PlayerIndex = 0; PlayerIndex < W3API::GetAPI()->Game->ActivePlayersCount; PlayerIndex++) {
		w3api::W3Player& rPlayer = W3API::GetAPI()->Game.Players[PlayerIndex];
		for (auto& rJsonPlayer : m_InMemMatchAnalyzer.GetMatchJson()["players"]) {
			if (rPlayer->Color == rJsonPlayer["colorId"] && rJsonPlayer["team"] != 24) {
				rPlayer.SetSlotId(rJsonPlayer["id"]);
				break;
			}
		}
	}
	/*
	Sleep(500);
	//Sleep(10000);
	CW3ListManager::Initialize(_pListsStartAddress);
	do {
		Sleep(100);
		while (!CW3Process::getInstance().IsInForeground()) {
			Sleep(200);
		}
		int CurrentPlayerId = GetCurrentPlayerId();
		ptr listStart = CW3ListManager::GetInstance().GetList(W3List::EType::LIST_PLAYERS).refresh().GetFirstElementAddress();
		if (listStart != 0) {
			int CircuitBreaker = 0;
			W3ListIterator<W3Player> PlayerIterator(listStart);
			do {
				W3Player& rPlayer = PlayerIterator.GetValue();
				if (rPlayer.IsPlaying() && rPlayer.GetSlotId() == CurrentPlayerId && rPlayer.IsLocalPlayer()) {
					m_pCurrentPlayer = new W3Player(rPlayer);
				}
			} while (PlayerIterator.next() && CircuitBreaker++ < 30);

			if (CircuitBreaker >= 30) {
				delete m_pCurrentPlayer;
				m_pCurrentPlayer = nullptr;
				CW3ListManager::Initialize(_pListsStartAddress);
			}
		}
		else {
			Sleep(200);
			CW3ListManager::Initialize(_pListsStartAddress);
		}
		if (!CW3Process::getInstance().FittingVersionIsRunning()) {
			return;
		}
	} while (m_pCurrentPlayer == nullptr);

	w3api::W3Game& rGame = W3API::GetAPI()->Game;
	m_MatchJson = rGame.Serialize();

	m_MatchJson["game"]["map"] = GetMapName();
	m_MatchJson["broadcaster"] = m_pCurrentPlayer->GetName();
	m_MatchJson["broadcasterId"] = m_pCurrentPlayer->GetSlotId();
	m_MatchJson["realm"] = _rRealm;
	m_MatchJson["isReforged"] = IsHDModeEnabled();
	m_MatchJson["isReplay"] = m_IsReplay;
	m_MatchJson["isObserver"] = m_pCurrentPlayer->GetTeam() == 24;

	for (auto& rPlayer : m_MatchJson["players"]) {
		int CircuitBreaker = 0;
		ptr listStart = CW3ListManager::GetInstance().GetList(W3List::EType::LIST_PLAYERS).refresh().GetFirstElementAddress();
		W3ListIterator<W3Player> PlayerIterator(listStart);
		do {
			W3Player& rInMemPlayer = PlayerIterator.GetValue();
			std::stringstream toFind;
			toFind << rPlayer["name"].get<std::string>() << "%23";
			std::string& name = rInMemPlayer.GetName();
			if (name.rfind(toFind.str() , 0) == 0) {
				rPlayer["name"] = rInMemPlayer.GetName();
				break;
			}
		} while (PlayerIterator.next() && CircuitBreaker++ < 30);
	}

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

	CDataPipeWriter::GetInstance().Send(CDataPipeWriter::EMessageType::MATCHUP, m_MatchJson.dump());
	CDataPipeWriter::GetInstance().Send(GetGameDataMessageType(true), "[" + m_MatchJson.dump() + "]");
	Sleep(1000);
	*/
}

CW3APIMatchAnalyzer::~CW3APIMatchAnalyzer()
{
	W3API::GetAPI()->SetRefreshRate(2000);
}
static int runCounter = 0;
void CW3APIMatchAnalyzer::Run() {
	runCounter += GetTurnFrequency();
	if (runCounter >= m_InMemMatchAnalyzer.GetTurnFrequency()) {
		m_InMemMatchAnalyzer.Run(CW3InMemMatchAnalyzer::ERunFlags::NO_HEROES);
		runCounter -= m_InMemMatchAnalyzer.GetTurnFrequency();
	}

	auto& API = *W3API::GetAPI();
	if(API.IsGameRunning()) {
		int rate = API.GetRefreshRate();
		if (API.GetRefreshRate() >= 200) {
			API.SetRefreshRate(20);
		}

		nlohmann::json changes;

		if (API.HasChanged()) {
			Sleep(30);
			if (API.Game.HasChanged()) {
				if (API.Game.GetGameTimeInS() != m_CurrentGameTime) {
					m_CurrentGameTime = API.Game.GetGameTimeInS();
					CDataPipeWriter::GetInstance().Send(CDataPipeWriter::EMessageType::GAMETIME, std::to_string(m_CurrentGameTime));
				}
				changes.push_back(API.Game.SerializeChanges());
			}
			for (int PlayerIndex = 0; PlayerIndex < API.Game->ActivePlayersCount; PlayerIndex++) {
				w3api::W3Player& rPlayer = API.Game.Players[PlayerIndex];
				if (rPlayer.Ressources.HasChanged()) {
					changes.push_back(rPlayer.Ressources.SerializeChanges());
				}
				for (int HeroIndex = 0; HeroIndex < rPlayer->HeroCount; HeroIndex++) {
					if (rPlayer.Heroes[HeroIndex].HasChanged()) {
						changes.push_back(rPlayer.Heroes[HeroIndex].SerializeChanges());
					}
				}
			}
		}


		///*PLAYERS*/
		//int CurrentPlayerId = GetCurrentPlayerId();
		//if (m_MatchJson["broadcasterId"] != CurrentPlayerId) {
		//	CLogger::Log << "Selected user switched to: " << CurrentPlayerId << CLogger::END;
		//	m_MatchJson["broadcasterId"] = CurrentPlayerId;
		//	changes.push_back(nlohmann::json::parse("{\"class\":\"W3PlayerSlot\", \"value\":" + std::to_string(CurrentPlayerId) + "}"));
		//}

		///* CHATBAR_STATE */
		//int ChatbarState = GetChatbarState();
		//if (ChatbarState != m_ChatbarState) {
		//	m_ChatbarState = ChatbarState;
		//	changes.push_back(nlohmann::json::parse("{\"class\":\"W3ChatbarState\", \"value\":" + std::to_string(m_ChatbarState) + "}"));
		//}

		///* COLORMODE */
		//int Colormode = GetColormode();
		//if (Colormode != m_ColorMode) {
		//	m_ColorMode = Colormode;
		//	std::string value = ((m_ColorMode == 0) ? "true" : "false");
		//	changes.push_back(nlohmann::json::parse("{\"class\":\"W3TeamColor\", \"value\":" + value + "}"));
		//}

		if (changes.size() > 0) {

			for (auto& rChange : changes) {
				rChange["matchId"] = m_InMemMatchAnalyzer.GetMatchJson()["id"];
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
}

int CW3APIMatchAnalyzer::GetCurrentPlayerId() {
	SIZE_T readChunkBytes;
	ptr pSlotAddress = CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::CURRENTSLOT).address;
	int CurrentPlayerId = 0;
	ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)pSlotAddress, &CurrentPlayerId, sizeof(CurrentPlayerId), &readChunkBytes);
	return CurrentPlayerId;
}

int CW3APIMatchAnalyzer::GetChatbarState()
{
	SIZE_T readChunkBytes;
	ptr pChatbarStateAddress = CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::CHATBAR_STATE).address;
	int32_t ChatbarState = 0;
	ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)pChatbarStateAddress, &ChatbarState, sizeof(int32_t), &readChunkBytes);
	return ChatbarState;
}

int CW3APIMatchAnalyzer::GetColormode()
{
	SIZE_T readChunkBytes;
	ptr pColormodeAddress = CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::COLORMODE).address;
	int32_t Colormode = 0;
	ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)pColormodeAddress, &Colormode, sizeof(int32_t), &readChunkBytes);
	return Colormode;
}

std::string CW3APIMatchAnalyzer::GetMapName() {
	SIZE_T readChunkBytes;
	ptr pMapNameAddress = CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::MAPNAME).address;
	char NameBuffer[50];
	ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)pMapNameAddress, &NameBuffer, sizeof(NameBuffer), &readChunkBytes);
	return CUtils::URLEncode(std::string(NameBuffer));
}

