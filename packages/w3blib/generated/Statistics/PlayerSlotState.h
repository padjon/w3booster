#pragma once

namespace Blizzard::Net::Warcraft3::Statistics
{
	enum class PlayerSlotState : unsigned char
	{
		Empty = 0,
		Playing = 1,
		Left = 2
	};
}
