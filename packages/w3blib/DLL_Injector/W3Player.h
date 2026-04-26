#pragma once
#include "W3MemoryUtils.h"
#include <string>
#include "W3Entity.h"
#include "W3AbilityIterator.h"
#include "W3AbilitySkill.h"
#include "W3AbilityHero.h"
#include "W3Collections.h"
#include <iomanip>
#include <sstream>
#include "W3ControlGroups.h"
#include "Logger.h"

enum EPlayerState {
	EMPTY_SLOT_3 = 3,
	EMPTY_SLOT_4 = 4,
	NOT_PLAYING = 4,
	REMOTE_PLAYER = 5,
	REMOTE_PLAYER_LEFT = 6,
	LOCAL_PLAYER_REF = 0xa,
	LOCAL_PLAYER = 0xb,
	LOCAL_PLAYER_LEFT = 0xc,
	LOCAL_PLAYER_END = 0xc,
};

enum ESlotState {
	INIT = 0,
	PLAYING = 1,
	LEFT = 2,
};


class W3Player : public W3Entity<W3REVERSE::W3PlayerRawData> {
private:
	union SHashTemplate {
		THash Hash;
		struct {
			char ResearchType[4];
			BYTE SlotID;
			BYTE Level;
		} Details;
	};

	int m_SlotId;
	std::string m_Name;
	float m_PosX;
	float m_PosY;
	std::vector<unsigned char> m_NameBuffer;
	W3ControlGroups* m_pControlGroups;


public:
	W3Player(W3Player& _rPlayer) : W3Player(_rPlayer.GetAddress()) {};
	W3Player(ptr _pAddress, ptr _pExtra) : W3Player(_pAddress) {};
	W3Player(ptr _pAddress) : W3Entity<W3REVERSE::W3PlayerRawData>(), m_SlotId(0), m_Name(""), m_pControlGroups(nullptr), m_PosX(0), m_PosY(0) {
		InitEntity(_pAddress);
		
	}

	virtual ~W3Player() {
		CleanUpEntity();
	}

	virtual void Init() {
		m_SlotId = GetRawData().slotId[0] + GetRawData().slotId[1] + GetRawData().slotId[2] + GetRawData().slotId[3];
		//m_SlotId = GetRawData().slotId;
		if (IsPlaying()) {
			m_pControlGroups = new W3ControlGroups(m_RawData.groupsObject);
		}

		m_PosX = m_pPersistentData->Data["PosX"];
		m_PosY = m_pPersistentData->Data["PosY"];
	}

	virtual void CleanUp() {
		delete m_pControlGroups;
		m_pControlGroups = nullptr;
	}

	EPlayerState GetPlayerState() {
		return (EPlayerState)GetRawData().playerState;
	}

	bool IsLocalPlayer() {
		return GetRawData().playerState >= EPlayerState::LOCAL_PLAYER_REF && GetRawData().playerState <= LOCAL_PLAYER_END;
	}

	bool IsPlaying() {
		return GetRawData().playerState > EPlayerState::NOT_PLAYING;
	}

	bool IsIngame() {
		return GetRawData().slotState == ESlotState::PLAYING;
	}

	bool HasLeft() {
		return GetRawData().slotState == ESlotState::LEFT;
	}

	int GetTeam() {
		return (GetRawData().team != -1) ? GetRawData().team : 24;
	}

	int GetSlotId() {
		return m_SlotId;
	}

	std::string GetRace() {

		if (!CW3GlobalGameInfo::GetInstance().IsObsOrReplay() && GetRawData().randomIndicator == 0x60) {
			return "Random";
		}

		switch (GetRawData().raceId) {
		case 0: {
			return "Random";
		} break;
		case 1: {
			return "Human";
		} break;
		case 2: {
			return "Orc";
		} break;
		case 3: {
			return "Undead";
		} break;
		case 4: {
			return "Nightelf";
		} break;
		}
		return "Unknown";
	}

	int GetRaceId() {

		if (!CW3GlobalGameInfo::GetInstance().IsObsOrReplay() && GetRawData().randomIndicator == 0x60) {
			return 0;
		}
		return GetRawData().raceId;
	}

	std::string GetName() {
		if (CW3GlobalGameInfo::GetInstance().IsAnonymousGame() && !IsLocalPlayer()) {
			return "Player " + std::to_string(GetSlotId() + 1);
		}

		if (GetPlayerState() > EPlayerState::NOT_PLAYING&& m_Name.empty()) {
			SIZE_T readChunkBytes = 0;
			char nameBuffer[30] = { 0 };
			ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)(m_RawData.nameObject), &nameBuffer, sizeof(nameBuffer), &readChunkBytes);
			nameBuffer[sizeof(nameBuffer) - 1] = '\0';
			std::string Name(nameBuffer);
			if (Name.find("#") == std::string::npos) {
				char nameBuffer2[20] = { 0 };
				ptr NameObjectOffsetAddress = (GetRawData().CustomGamesNameObject_limitedTo15Chars + ptr_size * 7);
				ptr NameAddress = 0;
				ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)(NameObjectOffsetAddress), &NameAddress, ptr_size, &readChunkBytes);
				ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)(NameAddress), &nameBuffer2, sizeof(nameBuffer2), &readChunkBytes);
				nameBuffer2[sizeof(nameBuffer2) - 1] = '\0';
				Name = std::string(nameBuffer2);
			}
			m_NameBuffer = std::vector<unsigned char>(Name.begin(), Name.end());
			m_Name = CUtils::URLEncode(Name);
		}
		return m_Name;
	}

	std::string SetName(const std::string& _rName) {
		m_Name = _rName;
		return m_Name;
	}

	void SetStartPos(const float _PosX, const float _PosY) {
		m_PosX = _PosX;
		m_PosY = _PosY;
		m_pPersistentData->Data["PosX"] = m_PosX;
		m_pPersistentData->Data["PosY"] = m_PosY;
	}


	virtual bool HasChanged() {
		return W3Entity<W3REVERSE::W3PlayerRawData>::HasChanged() || (m_pControlGroups && m_pControlGroups->HasChanged());
	}

	virtual nlohmann::json Serialize() {
		nlohmann::json serialized;
		serialized["class"] = "W3Player";
		serialized["id"] = m_SlotId;
		serialized["name"] = GetName();
		serialized["name_buffer"] = m_NameBuffer;
		serialized["startPosition"] = nlohmann::json::value_t::object;
		serialized["startPosition"]["x"] = m_PosX;
		serialized["startPosition"]["y"] = m_PosY;
		serialized["race"] = GetRaceId();
		serialized["team"] = GetTeam();
		serialized["colorId"] = GetRawData().colorId;
		serialized["isAI"] = GetRawData().isAI == 1;
			
		serialized["controlgroups"] = nlohmann::json::value_t::object;
		if (m_pControlGroups) {
			serialized["controlgroups"] = m_pControlGroups->Serialize();
		}
		return serialized;
	}

protected:
	virtual char_array& InitGetType() {
		return "PLY";
	}

	virtual uint64_t InitGetId() {
		return GetSlotId();
	}

	virtual THash CalculateHash() {
		SHashTemplate tpl;
		tpl.Hash = 0;
		return tpl.Hash;
	}
};
