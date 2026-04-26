#pragma once
#include <Windows.h>
#include "./W3Player.h"
#include "W3PlayerRessources.h"
#include "W3PlayerStatistics.h"
namespace w3api
{

#pragma pack(push, 1)
	struct W3GameRawData {
		BYTE IsIngame;
		unsigned int GameTime;
		BYTE ActivePlayersCount;
		char GameName[256];
		char MapName[256];
		W3PlayerRawData Players[28];
		//unsigned int ShopsCount;
		// W3Shop Shops[999]
	};
#pragma pack(pop)

	class W3Game : public W3EntityBase<W3GameRawData>
	{
	public:

		std::vector<W3Player> Players;
		std::vector<W3PlayerRessources> PlayerRessources;
		std::vector<W3PlayerStatistics> PlayerStatistics;

		W3Game(const W3GameRawData& _rRawData) :W3EntityBase<W3GameRawData>(_rRawData) {
			Init();
		}

		void Init() {
			Players.clear();
			PlayerRessources.clear();
			PlayerStatistics.clear();
			for (int i = 0; i < (sizeof($.Players) / sizeof($.Players[0])); ++i) {
				Players.emplace_back($.Players[i], i);
				PlayerRessources.emplace_back(W3PlayerRessources($.Players[i], i));
				PlayerStatistics.emplace_back(W3PlayerStatistics($.Players[i], i));
			}
		}

		int GetGameTimeInS() const {
			return (int)($.GameTime / 1000);
		}

		virtual UINT64 CalculateChangeDetectionHash() {
			return GetGameTimeInS();
		}

		nlohmann::json Serialize() const {
			nlohmann::json serialized;
			serialized["class"] = "W3Game";
			serialized["game"]["map"] = $.MapName;
			for (int i = 0; i < $.ActivePlayersCount; ++i) {
				serialized["players"][std::to_string(Players[i].GetSlotId())] = Players[i].Serialize();
			}
			serialized["id"] = GetTickCount64();
			serialized["broadcaster"] = $.Players[0].Name;
			serialized["broadcasterId"] = 0;
			serialized["realm"] = "Europe";// _rRealm;
			serialized["isReforged"] = true;//IsHDModeEnabled();
			serialized["isReplay"] = false;// m_IsReplay;
			serialized["isObserver"] = true;// m_pCurrentPlayer->GetTeam() == 24;
			return serialized;
		}


		nlohmann::json SerializeChanges() const {
			nlohmann::json serialized;
			serialized["class"] = "W3GameTime";
			serialized["value"] = GetGameTimeInS();
			return serialized;
		}
	};
};
