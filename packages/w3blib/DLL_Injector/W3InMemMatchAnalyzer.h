#pragma once
#include <string>
#include "json.h"
#include "W3Unit.h"
#include "W3Research.h"
#include "W3ListManager.h"
#include "W3Player.h"
#include "W3MatchAnalyzerBase.h"
#include "W3Resource.h"

class CW3InMemMatchAnalyzer: public CW3MatchAnalyzerBase {
public:

	enum ERunFlags {
		NO_FLAGS = 0,
		NO_HEROES = 1,
	};

	CW3InMemMatchAnalyzer(ptr _pUnitStartAddress, const std::string& _rRealm, const bool _isReplay);
	~CW3InMemMatchAnalyzer();
	void Run();
	void Run(unsigned int RUN_FLAGS);
	int GetCurrentPlayerId();
	int GetChatbarState();
	uint8_t GetHudScale();
	int GetColormode();
	std::string GetGamename();
	std::string GetMapName();
	nlohmann::json& GetMatchJson();
	std::map<std::string, std::string> GetWar3Settings();
	bool IsHDModeEnabled();
	int GetTurnFrequency() {
		return 50;
	}

private:
	void DbgPrintPlayerDetails(W3Player& _rPlayer);

private:
	nlohmann::json m_MatchJson;
	W3Player* m_pCurrentPlayer;
	int m_CurrentGameTime;
	int m_ChatbarState;
	uint8_t m_HudScale;
	int m_ColorMode;
	bool m_IsReplay;
	bool m_IsWon;

private: //units&heroes
	time_t m_LastUnitScan;
	time_t m_LastGameTimeScan;
	std::unordered_map<uint64_t, W3Unit> m_Heroes;
	std::unordered_map<uint64_t, W3Research> m_Researches;
	std::unordered_map<int, std::list<W3Resource>> m_ResourcesPerPlayer;
	std::unordered_map<int, int> m_WorkerSupplyPerPlayer;
	std::unordered_set<int> m_IngameTeams;
};