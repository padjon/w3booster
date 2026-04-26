#pragma once

namespace Blizzard::Net::Warcraft3::Statistics
{
	enum class PlayerType : unsigned char
	{
		Empty = 0,
		Player = 1,
		Computer = 2,
		Neutral = 3,
		Observer = 4,
		None = 5,
		Other = 6
	};
}
