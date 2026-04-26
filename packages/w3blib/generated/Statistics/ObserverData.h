#pragma once

#include "ObserverGame.h"
#include "PlayerInfo.h"
#include "ShopInfo.h"
#include <string>

//C# TO C++ CONVERTER NOTE: Forward class declarations:
namespace Blizzard::Net::Warcraft3::Statistics { class PlayerInfo; }
namespace Blizzard::Net::Warcraft3::Statistics { class ShopInfo; }

namespace Blizzard::Net::Warcraft3::Statistics
{
	class ObserverData
	{
	public:
		static constexpr int MAX_PLAYERS = 28;

		static constexpr int MAX_SHOPS = 999;

	private:
		static constexpr int VERSION_OFFSET = 0;

		static constexpr int REFRESH_RATE_OFFSET = VERSION_OFFSET + sizeof(unsigned int);

		static constexpr int GAME_OFFSET = REFRESH_RATE_OFFSET + sizeof(unsigned int);

		static constexpr int PLAYERS_OFFSET = GAME_OFFSET + ObserverGame::SIZE;

		static constexpr int SHOPS_COUNT_OFFSET = PLAYERS_OFFSET + MAX_PLAYERS * PlayerInfo::SIZE;

		static constexpr int SHOPS_OFFSET = SHOPS_COUNT_OFFSET + sizeof(unsigned int);

	public:
		static constexpr int SIZE = sizeof(unsigned int) + sizeof(unsigned int) + ObserverGame::SIZE + MAX_PLAYERS * PlayerInfo::SIZE + sizeof(unsigned int) + MAX_SHOPS * ShopInfo::SIZE;

		static constexpr int DEFAULT_REFRESH_RATE = 2000;

		static const std::wstring MEMORY_MAPPED_FILENAME;

		static bool TryOpen(ObserverData *&observerData);

	private:
		MemoryMappedFile *const memoryMappedFile;

		MemoryMappedViewAccessor *const mappedViewAccessor;

//C# TO C++ CONVERTER TODO TASK: C# 'unsafe' code is not converted by C# to C++ Converter:
//		private readonly unsafe byte * data;

	public:
		ObserverData(MemoryMappedFile *memoryMappedFile);

		ObserverData();

		~ObserverData();

		/// <summary>
		/// Game client version
		/// </summary>
		unsigned int getVersion() const;

		/// <summary>
		/// Refresh rate in milliseconds
		/// </summary>
		unsigned int getRefreshRate() const;
		void setRefreshRate(unsigned int value);

//C# TO C++ CONVERTER TODO TASK: C# 'unsafe' code is not converted by C# to C++ Converter:
//		public unsafe ObserverGame * Game
//		{
//			get
//			{
//				return (ObserverGame * ) & this.data[GAME_OFFSET];
//			}
//		}

		Span<PlayerInfo> *getPlayers() const;

		Span<ShopInfo> *getShops() const;
	};
}
