#pragma once
#include <Windows.h>
#include "W3Item.h"
#include "W3Ability.h"
#include "W3EntityBase.h"

#include <vector>

namespace w3api
{

#pragma pack(push, 1)
	struct W3HeroRawData {
		UINT Id;
		char Name[100];
		char ButtonArt[100];

		UINT Level;
		UINT Experience;
		UINT LevelUpExperience;
		UINT HitPoints;
		UINT MaxHitPoints;
		UINT ManaPoints;
		UINT MaxManaPoints;
		UINT DamageDealt;
		UINT DamageReceived;
		UINT SelfDamage;
		UINT PickOrder;
		UINT HealingDone;
		UINT NumberOfDeaths;
		UINT TotalKills;
		UINT SelfKills;
		UINT HeroKills;
		UINT BuildingKills;
		UINT TimeAliveMilliSeconds;
		UINT AbilityCount;
		W3AbilityRawData Abilities[24];
		UINT ItemCount;
		W3ItemRawData Items[6];
	};
#pragma pack(pop)

	class W3Hero : public W3EntityBase<W3HeroRawData>
	{

	private:
		const int m_SlotId;
		std::vector<W3Item> m_Items;
		std::vector<W3Ability> m_Abilities;

	public:
		W3Hero(const W3HeroRawData& _rRawData, int _SlotId) : W3EntityBase<W3HeroRawData>(_rRawData), m_SlotId(_SlotId){
			for (int i = 0; i < (sizeof($.Items) / sizeof($.Items[0])); ++i) {
				m_Items.emplace_back(W3Item($.Items[i]));
			}

			for (int i = 0; i < (sizeof($.Abilities) / sizeof($.Abilities[0])); ++i) {
				m_Abilities.emplace_back(W3Ability($.Abilities[i]));
			}
		}

		UINT64 CalculateChangeDetectionHash() {
			union SHashTemplate {
				UINT64 Hash;
				struct {
					uint16_t ItemAndAbilityCount;
					uint16_t Experience;
					uint16_t CurrentAndMaxHitPoints;
					uint16_t CurrentAndMaxMana;

				}Details;
			} H;
			H.Details.ItemAndAbilityCount = $.ItemCount + $.AbilityCount;
			H.Details.Experience = $.Experience;
			H.Details.CurrentAndMaxHitPoints = $.MaxHitPoints + ($.HitPoints / 5);
			H.Details.CurrentAndMaxMana = $.MaxManaPoints +($.ManaPoints/ 5);
			return H.Hash;
		};

		virtual bool DependencyHasChanged() {
			bool DependencyChanged = false;
			for (int i = 0; i < $.ItemCount; ++i) {
				DependencyChanged |= m_Items[i].HasChanged();
			}
			for (int i = 0; i < $.AbilityCount; ++i) {
				if (m_Abilities[i].IsHeroSkill()) {
					DependencyChanged |= m_Abilities[i].HasChanged();
				}
			}
			return DependencyChanged;
		}

		nlohmann::json SerializeChanges() const {
			nlohmann::json serialized;
			serialized["id"] = (int)this;
			serialized["class"] = "W3Unit";
			serialized["type"] = GetStringId();
			serialized["slotId"] = m_SlotId;
			serialized["isHero"] = true;
			serialized["experience"] = $.Experience;
			serialized["hitpoints"]["max"] = $.MaxHitPoints;
			serialized["hitpoints"]["current"] = $.HitPoints;
			serialized["mana"]["max"] = $.MaxManaPoints;
			serialized["mana"]["current"] = $.ManaPoints;


			serialized["inventory"] = { "", "", "", "", "", "" };
			for (int i = 0; i < $.ItemCount; ++i) {
				const W3Item& rItem = m_Items[i];
				serialized["inventory"][rItem->Slot] = rItem.SerializeChanges();
			}

			int abilityOrder = 0;
			for (int i = 0; i < $.AbilityCount; ++i) {
				if (m_Abilities[i].IsHeroSkill()) {
					nlohmann::json& serializedAbility = m_Abilities[i].SerializeChanges();
					serializedAbility["order"] = abilityOrder++;
					serialized["abilities"].push_back(serializedAbility);
				}
			}
			return serialized;
		}
	};
};
