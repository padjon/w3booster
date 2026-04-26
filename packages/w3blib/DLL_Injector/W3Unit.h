#pragma once
#include "W3MemoryUtils.h"
#include <string>
#include "W3Entity.h"
#include "W3AbilityIterator.h"
#include "W3AbilitySkill.h"
#include "W3AbilityHero.h"
#include "W3Collections.h"
#include "W3AbilityInventory.h"

#pragma pack(push, 1)
struct W3UnitRawData {
	ptr _u1[7];
	int32_t _u2[2];
	ptr _u3[3];
	BYTE colorId;
	char _u4[ptr_size - 1];
	ptr _u5[1];
	int32_t _u51[2];
	union {
		char type[0x4];
		uint32_t intType;
	};
	char name[0x104];
	ptr _u6[4];
	uint32_t _u7[10];
	uint32_t slotId;
	uint32_t _u8[2];
	uint32_t aliveIndicator;
	//ptr _u9[153];
	uint32_t _u10[2];
	ptr _u9[154];
	float _posX;
	float _posY;

};
#pragma pack(pop)

class W3Unit : public W3Entity<W3UnitRawData> {
private:
	union SHashTemplate {
		THash Hash;
		struct {
			BYTE SkillsIdent;
			uint32_t Experience;

		}Details;
	};

	bool m_IsHero;
	bool m_IsWorker;
	ptr m_AbilityStartIterator;
	std::vector<W3AbilitySkill> m_Skills;
	W3AbilityHero* m_pAbilityHero;
	W3AbilityInventory* m_pAbilityInventory;

public:
	W3Unit(W3Unit& _rUnit) : W3Unit(_rUnit.GetAddress(), _rUnit.m_AbilityStartIterator) {};
	W3Unit(ptr _pAddress) : W3Unit(_pAddress, 0) {};
	W3Unit(ptr _pAddress, ptr _AbilityStartIterator) : W3Entity<W3UnitRawData>(), m_AbilityStartIterator(_AbilityStartIterator), m_pAbilityHero(nullptr), m_pAbilityInventory(nullptr), m_IsHero(false), m_IsWorker(false) {
		if (_pAddress != 0) {
			InitEntity(_pAddress);
		}
	};

	~W3Unit() {
		CleanUpEntity();
	}

	virtual void Init() {
		m_Skills.clear();
		auto& rUnitType = GetType();
		m_IsHero = isupper(rUnitType[0]);
		if (!m_IsHero) {
			m_IsWorker = (rUnitType == "hpea" || rUnitType == "opeo" || rUnitType == "uaco" || rUnitType == "ewsp");
		}
		if (isHero() && m_AbilityStartIterator != 0) {
			W3AbilityIterator AbilityIterator(m_AbilityStartIterator);
			while (AbilityIterator.hasPrev()) {
				AbilityIterator.prev();
			}
			while (AbilityIterator.next()) {
				auto& rType = AbilityIterator.GetType();
				if (rType[0] == 'A' && rType[1] != 'I' && isupper(rType[1]) && rType != "AHer") {
					auto& rSkill = AbilityIterator.GetAbility<W3AbilitySkill>(getSlotId());
					if (W3Collections::AbilitySkillTypes.find(rSkill.GetType()) != W3Collections::AbilitySkillTypes.end()) {
						m_Skills.push_back(rSkill);
					}
				}
				else if (rType == "AHer") {
					m_pAbilityHero = new W3AbilityHero(AbilityIterator.GetAbility<W3AbilityHero>().GetAddress());
				}
				else if (rType == "AInv") {
					m_pAbilityInventory = new W3AbilityInventory(AbilityIterator.GetAbility<W3AbilityInventory>().GetAddress());
				}
			}
		}
	}

	virtual void CleanUp() {
		delete m_pAbilityHero;
		delete m_pAbilityInventory;
		m_pAbilityHero = nullptr;
		m_pAbilityInventory = nullptr;
	}

	char* W3Unit::getName() {
		return GetRawData().name;
	}

	int W3Unit::getColorId() {
		return GetRawData().colorId;
	}

	int W3Unit::getSlotId() {
		return GetRawData().slotId;
	}

	float W3Unit::getPosX() {
		return GetRawData()._posX;
	}

	float W3Unit::getPosY() {
		return GetRawData()._posY;
	}

	bool W3Unit::isHero() {
		return m_IsHero;
	}

	bool W3Unit::isWorker() {
		return m_IsWorker;
	}

	bool W3Unit::isMainBuilding() {
		const std::string& rType = GetType();
		return rType == "htow" || rType == "hkee" || rType == "hcas"
			|| rType == "ogre" || rType == "ostr" || rType == "ofrt" 
			|| rType == "unpl" || rType == "unp1" || rType == "unp2" 
			|| rType == "etol" || rType == "etoa" || rType == "etoe";
	}

	bool isAlive() {
		return GetRawData().aliveIndicator != 0;
	}

	std::vector<W3AbilitySkill>& GetSkills() {
		return m_Skills;
	}

	virtual bool HasChanged() {
		return W3Entity<W3UnitRawData>::HasChanged() || (m_pAbilityInventory && m_pAbilityInventory->HasChanged());
	}

	virtual nlohmann::json Serialize() {
		nlohmann::json serialized;
		serialized["id"] = GetIdent();
		serialized["class"] = "W3Unit";
		serialized["type"] = GetType();
		serialized["colorId"] = getColorId();
		serialized["slotId"] = getSlotId();
		serialized["isHero"] = isHero();
		if (m_pAbilityInventory) {
			serialized["inventory"] = m_pAbilityInventory->Serialize();
		}
		serialized["experience"] = (m_pAbilityHero) ? m_pAbilityHero->GetExperience() : 0;
		int abilityOrder = 0;
		for (auto& _rAbility : GetSkills()) {
			nlohmann::json serializedAbility = _rAbility.Serialize();
			serializedAbility["order"] = abilityOrder++;
			serialized["abilities"].push_back(serializedAbility);
		}
		return serialized;
	}

protected:
	virtual char_array& InitGetType() {
		return GetRawData().type;
	}

	virtual uint64_t InitGetId() {
		return ToId(GetRawData().colorId, GetTypeAsInt());
	}

	virtual THash CalculateHash() {
		SHashTemplate tpl;
		tpl.Hash = 0;
		tpl.Details.Experience = (m_pAbilityHero) ? m_pAbilityHero->GetExperience() : 0;
		int abilityLevelCount = 0;
		tpl.Details.SkillsIdent = 0;
		for (auto& rSkill : m_Skills) {
			tpl.Details.SkillsIdent += rSkill.GetHash();
		}
		return tpl.Hash;
	}
};
