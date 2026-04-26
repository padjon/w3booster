#pragma once
#include <string>
#include "json.h"
#include "W3Unit.h"
#include "W3Research.h"
#include "W3ListManager.h"
#include "W3Player.h"
#include "W3MatchAnalyzerBase.h"
#include "W3InMemMatchAnalyzer.h"

class CW3APIMatchAnalyzer: public CW3MatchAnalyzerBase {
public:
	CW3APIMatchAnalyzer(ptr _pUnitStartAddress, const std::string& _rRealm, const bool _isReplay);
	~CW3APIMatchAnalyzer();
	void Run();
	int GetCurrentPlayerId();
	int GetChatbarState();
	int GetColormode();
	std::string GetMapName();
	int GetTurnFrequency() {
		return 15;
	}

private:
	CW3InMemMatchAnalyzer m_InMemMatchAnalyzer;
	nlohmann::json m_MatchJson;
	W3Player* m_pCurrentPlayer;
	int m_CurrentGameTime;
	int m_ChatbarState;
	int m_ColorMode;
	bool m_IsReplay;
	bool m_IsWon;

private: //units&heroes
	time_t m_LastUnitScan;
	std::unordered_map<uint64_t, W3Unit> m_Heroes;
	std::unordered_map<uint64_t, W3Research> m_Researches;
	std::unordered_set<int> m_IngameTeams;
};