#pragma once
#include <Windows.h>
#include "W3PlayerEnums.h"
#include "W3Hero.h"
#include "W3Structure.h"
#include "W3Upgrade.h"
#include "W3Unit.h"
#include "W3Queue.h"
#include "W3PlayerItem.h"
#include "../Utils.h"

namespace w3api
{

#pragma pack(push, 1)
	struct W3PlayerRawData {
		char Name[36];
		EPlayerRacePreference::EPlayerRacePreference RacePreference;
		EPlayerRace::EPlayerRace Race;
		BYTE Id;
		BYTE TeamIndex;
		BYTE Color;
		EPlayerType::EPlayerType Type;
		UINT Handicap;
		EPlayerGameResult::EPlayerGameResult GameResult;
		EPlayerSlotState::EPlayerSlotState SlotState;
		EPlayerAiDifficulty::EPlayerAiDifficulty AiDifficulty;
		UINT ActionsPerMinute;
		UINT RealTimeActionsPerMinute;
		UINT Gold;
		UINT GoldMindex;
		UINT GoldUpkeepLost;
		UINT GoldDiversionTax;
		UINT Lumber;
		UINT LumberMined;
		UINT LumberUpkeepLost;
		UINT LumberDiversionTax;
		UINT FoodCap;
		UINT FoodUsed;
		UINT HeroCount;
		W3HeroRawData Heroes[999];
		UINT StructureCount;
		W3StructureRawData Structures[999];
		UINT UpgradeCount;
		W3UpgradeRawData Upgrades[999];
		UINT UnitCount;
		W3UnitRawData Units[999];
		UINT QueueingUnitsCount;
		W3QueueRawData Queues[999];
		UINT IemCount;
		W3PlayerItemRawData PlayerItems[999];
		UINT timeInUpkeep[10];
	};
#pragma pack(pop)
	class W3PlayerBase : public W3EntityBase<W3PlayerRawData>
	{
	private:
		int m_SlotId;

	public:
		W3PlayerBase(const W3PlayerRawData& _rRawData, int _SlotId) : W3EntityBase<W3PlayerRawData>(_rRawData), m_SlotId(_SlotId) {
		}

		~W3PlayerBase() {
		}

		void SetSlotId(int _SlotId) {
			m_SlotId = _SlotId;
		}

		int GetSlotId() const {
			return m_SlotId;
		}
	};
};
