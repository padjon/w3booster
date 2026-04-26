#pragma once
#include "W3PlayerBase.h"

namespace w3api
{
	class W3PlayerStatistics : public W3PlayerBase {

	public:
		W3PlayerStatistics(const W3PlayerRawData& _rRawData, int _SlotId) :W3PlayerBase(_rRawData, _SlotId) {
		}

		virtual UINT64 CalculateChangeDetectionHash() {
			union SHashTemplate {
				UINT64 Hash;
				struct {
					uint16_t Gold;
					uint16_t Lumber;
					uint16_t Food;
					uint16_t FoodCap;
				}Details;
			} H;

			H.Details.Gold = $.Gold;
			H.Details.Lumber = $.Lumber;
			H.Details.Food = $.FoodUsed;
			H.Details.Food = $.FoodCap;
			return H.Hash;
		};

		virtual nlohmann::json SerializeChanges() const {
			nlohmann::json serialized;
			serialized["class"] = "W3Player";
			serialized["id"] = GetSlotId();
			serialized["gold"] = $.Gold;
			serialized["lumber"] = $.Lumber;
			serialized["food"] = $.FoodUsed;
			serialized["food_cap"] = $.FoodCap;
			return serialized;
		}
	};
}