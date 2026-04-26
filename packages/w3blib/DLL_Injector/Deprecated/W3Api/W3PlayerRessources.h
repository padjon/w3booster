#pragma once
#include "W3PlayerBase.h"
#include "../RobustAPIVariable.h";
#include "../Logger.h"
namespace w3api
{
	class W3PlayerRessources : public W3PlayerBase {

	protected:
		CRobustAPIVariable<UINT> m_WorkerFood;

	public:
		W3PlayerRessources(const W3PlayerRawData& _rRawData, int _SlotId) :W3PlayerBase(_rRawData, _SlotId),
			m_WorkerFood(0, 5) {
		}

		virtual UINT64 CalculateChangeDetectionHash() {
			union SHashTemplate {
				UINT64 Hash;
				struct {
					uint16_t Gold;
					uint16_t Lumber;
					uint8_t Food;
					uint8_t WorkerFood;
					uint8_t FoodCap;
				}Details;
			} H;

			H.Details.Gold = $.Gold;
			H.Details.Lumber = $.Lumber;
			H.Details.Food = $.FoodUsed;
			H.Details.WorkerFood = m_WorkerFood.GetValue(CalculateWorkerFood());
			H.Details.FoodCap = $.FoodCap;
			return H.Hash;
		};

		virtual nlohmann::json SerializeChanges() const {
			nlohmann::json serialized;
			serialized["class"] = "W3PlayerRessources";
			serialized["slotId"] = GetSlotId();
			serialized["value"]["gold"] = $.Gold;
			serialized["value"]["lumber"] = $.Lumber;
			serialized["value"]["food"] = $.FoodUsed;
			serialized["value"]["food_cap"] = $.FoodCap;
			serialized["value"]["worker_food"] = m_WorkerFood.GetValue();
			return serialized;
		}

		int CalculateWorkerFood() {
			int Food = 0;
			for (int UnitIndex = 0; UnitIndex < $.UnitCount; UnitIndex++) {
				if ($.Units[UnitIndex].IsWorker || isWorker($.Units[UnitIndex].Id)) {
					Food += $.Units[UnitIndex].CurrentAmount;
				}
			}

			for (int QueueIndex = 0; QueueIndex < $.QueueingUnitsCount; QueueIndex++) {
				if (isWorker($.Queues[QueueIndex].Id)) {
					Food++;
				}
			}
			return Food;
		}
	private:

		bool isWorker(int unitId) {
			return unitId == u("aeph") || unitId == u("ocau") || unitId == u("oepo") || unitId == u("pswe") || unitId == u("limh");
		}

		int u(const std::string& _rUnit) {
			return *(int*)&_rUnit;
		};
	};
};