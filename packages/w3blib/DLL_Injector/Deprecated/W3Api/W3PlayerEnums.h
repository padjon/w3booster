#pragma once
#include <Windows.h>

namespace w3api
{
	namespace EPlayerRace {
		enum EPlayerRace : byte
		{
			Unknown = 0,
			Human = 1,
			Orc = 2,
			Undead = 3,
			NightElf = 4,
			Demon = 5,
			Last = 6,
			Other = 7,
			Creep = 8,
			Commoner = 9,
			Critter = 10,
			Naga = 11
		};
	}

	namespace EPlayerRacePreference {
	enum EPlayerRacePreference : byte
	{
		Human = 0x01,
		Orc = 0x02,
		Nightelf = 0x04,
		Undead = 0x08,
		Demon = 0x10,
		Random = 0x20,
		UserSelectable = 0x40
	};
	}

namespace EPlayerSlotState {

	enum EPlayerSlotState : byte
	{
		Empty = 0,
		Playing = 1,
		Left = 2
	};
}

namespace EPlayerType {
	enum EPlayerType : byte
	{
		Empty = 0,
		Player = 1,
		Computer = 2,
		Neutral = 3,
		Observer = 4,
		None = 5,
		Other = 6,
	};
}

namespace EPlayerGameResult {
	enum EPlayerGameResult : byte
	{
		Victory = 0,
		Defeat = 1,
		Tie = 2,
		Neutral = 3,
	};
}

namespace EPlayerAiDifficulty {
	enum EPlayerAiDifficulty : byte
	{
		Newbie = 0,
		Normal = 1,
		Insane = 2,
	};
};
};
