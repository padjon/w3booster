#pragma once
#include "W3MemoryUtils.h"
#include "W3Ability.h"
#include "json.h"
#include "W3GlobalGameInfo.h"

#pragma pack(push, 1)
struct W3AbilitySkillRawData {
	AbilityHeader _header;
	uint32_t level;
};
#pragma pack(pop)

class W3AbilitySkill : public W3Entity<W3AbilitySkillRawData> {

private:
	int m_LastActivation;
	int m_SlotId;
	const char* PMKEY_LAST_COOLDOWN_INDICATOR = "LAST_COOLDOWN_INDICATOR";
	const char* PMKEY_LAST_ACTIVATION = "LAST_ACTIVATION";

public:

	enum ESkillState {
		DEFAULT = 0x00,
		COOLDOWN = 0x02
	};


public:
	W3AbilitySkill(ptr _pAddress, int _SlotId) : W3Entity(), m_LastActivation(0), m_SlotId(_SlotId) {
		InitEntity(_pAddress);
	}

	virtual ~W3AbilitySkill() {
		CleanUpEntity();
	}

	virtual void Init() {
		if (((m_pPersistentData->Data[PMKEY_LAST_COOLDOWN_INDICATOR] & 2) == 0) && ((m_RawData._header.cooldownIndicator & 2) > 0)) {
			m_pPersistentData->Data[PMKEY_LAST_ACTIVATION] = CW3GlobalGameInfo::GetInstance().GetGameTime();
		}
		m_pPersistentData->Data[PMKEY_LAST_COOLDOWN_INDICATOR] = m_RawData._header.cooldownIndicator;

		m_LastActivation = m_pPersistentData->Data[PMKEY_LAST_ACTIVATION];
	}

protected:
	void CleanUp() {
	}

public:
	int W3AbilitySkill::GetLevel() {
		return GetRawData().level;
	}

	nlohmann::json Serialize() {
		nlohmann::json serialized;
		serialized["class"] = "W3Skill";
		serialized["type"] = GetType();
		serialized["level"] = GetLevel() + 1;
		serialized["lastActivation"] = m_LastActivation;

		return serialized;
	}
	char_array& InitGetType() {
		return GetRawData()._header.type;
	};

	uint64_t InitGetId() {
		return ToId(m_SlotId,GetTypeAsInt());
	}

	virtual THash CalculateHash() {
		return  1 + GetLevel() + GetTypeAsInt() + m_LastActivation;
	};
};
