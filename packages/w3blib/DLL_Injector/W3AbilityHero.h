#pragma once
#pragma once
#include "W3MemoryUtils.h"
#include "W3Ability.h"
#include "W3Entity.h"
#include "json.h"

#pragma pack(push, 1)
struct W3AbilityHeroRawData {
	AbilityHeader _header;
	uint32_t _u1[25];
	uint32_t experience;
	uint32_t avaliableSkillPoints;
};
#pragma pack(pop)

class W3AbilityHero : public W3Entity<W3AbilityHeroRawData> {
public:
	W3AbilityHero(ptr _pAddress) : W3Entity() {
		InitEntity(_pAddress);
	}

	~W3AbilityHero() {
		CleanUpEntity();
	}

	virtual void Init() {
	}

	virtual void CleanUp() {
	}

	int GetExperience() {
		return GetRawData().experience;
	}

	int GetAvailableSkillPoints() {
		return GetRawData().avaliableSkillPoints;
	}

	char_array& InitGetType() {
		return GetRawData()._header.type;
	};

	uint64_t InitGetId() {
		return 0;
	}

	virtual THash CalculateHash() {
		return 0;
	};
};
