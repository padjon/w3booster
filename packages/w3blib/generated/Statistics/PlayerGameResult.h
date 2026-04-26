#pragma once

namespace Blizzard::Net::Warcraft3::Statistics
{
	enum class PlayerGameResult : unsigned char
	{
		Victory = 0,
		Defeat = 1,
		Tie = 2,
		Neutral = 3
	};
}
