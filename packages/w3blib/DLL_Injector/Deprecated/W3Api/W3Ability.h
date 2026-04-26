#pragma once
#include <Windows.h>
#include "W3EntityBase.h"

namespace w3api
{

#pragma pack(push, 1)
	struct W3AbilityRawData {
		UINT Id;
		char Name[36];
		float Cooldown;
		float CooldownRemaining;
		UINT Level;
		char ButtonArt[100];
		BYTE IsHeroAbility;
		UINT DamageDealt;
		UINT HealingDone;
	};
#pragma pack(pop)

	class W3Ability : public W3EntityBase<W3AbilityRawData>
	{
	private:
		int m_LastActivation;
		bool m_IsCurrentlyActive;

	public:
		
		W3Ability(const W3AbilityRawData& _rRawData) :W3EntityBase<W3AbilityRawData>(_rRawData), m_LastActivation(0), m_IsCurrentlyActive(false){
		}

		bool IsHeroSkill() const;

		UINT64 CalculateChangeDetectionHash();
		nlohmann::json SerializeChanges() const; 
	};
};
