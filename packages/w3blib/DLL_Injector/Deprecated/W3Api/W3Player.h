#pragma once
#include "W3PlayerBase.h"
#include "W3PlayerRessources.h"
#include "W3PlayerStatistics.h"
#include "W3Hero.h"

namespace w3api
{
	class W3Player: public W3PlayerBase
	{
	public:
		W3PlayerRessources Ressources;
		W3PlayerStatistics Statistics;
		std::vector<W3Hero> Heroes;
		W3Player(const W3PlayerRawData& _rRawData, int _SlotId) : W3PlayerBase(_rRawData, _SlotId), Ressources(_rRawData, _SlotId) , Statistics(_rRawData, _SlotId) {
			for (int i = 0; i < 3; ++i) {
				Heroes.emplace_back(W3Hero($.Heroes[i], GetSlotId()));
			}
		}

		~W3Player() {
		}

		void SetSlotId(int _SlotId) {
			W3PlayerBase::SetSlotId(_SlotId);
			Ressources.SetSlotId(_SlotId);
			Statistics.SetSlotId(_SlotId);
		}

		std::string GetRace() const {


			switch ($.RacePreference) {
			default:
			case EPlayerRacePreference::Random: {
				return "Random";
			} break;
			case EPlayerRacePreference::Human: {
				return "Human";
			} break;
			case EPlayerRacePreference::Orc: {
				return "Orc";
			} break;
			case EPlayerRacePreference::Undead: {
				return "Undead";
			} break;
			case EPlayerRacePreference::Nightelf: {
				return "Nightelf";
			} break;
			}
		}

		virtual nlohmann::json Serialize() const {
			nlohmann::json serialized;
			std::string Name($.Name);
			serialized["class"] = "W3PlayerBase";
			serialized["name"] = CUtils::URLEncode(Name);
			serialized["name_buffer"] = std::vector<unsigned char>(Name.begin(), Name.end());
			serialized["race"] = GetRace();
			serialized["team"] = $.TeamIndex;
			serialized["race_id"] = $.Race;
			serialized["id"] = GetSlotId();
			serialized["player_id"] = GetSlotId();
			serialized["colorId"] = $.Color;
			serialized["is_ai"] = $.Type == EPlayerType::Computer;
			serialized["controlgroups"] = nlohmann::json::value_t::object;
			/*if (m_pControlGroups) {
				serialized["controlgroups"] = m_pControlGroups->Serialize();
			}*/
			return serialized;
		}
	};
};
