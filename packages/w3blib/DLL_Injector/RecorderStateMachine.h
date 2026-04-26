#pragma once
#include <vector>
#include "W3MemoryUtils.h"
#include "json.h"
#include "W3MatchAnalyzerBase.h"

class CRecorderStateMachine {
public:
	enum EStates {
		UNEXPECTED_EXCEPTION,
		INITIALIZING,
		INITIALIZED,
		PRE_W3_LOOKUP,
		WAITING_FOR_W3,
		WAITING_FOR_64BIT_W3,
		ANALYZING_W3,
		ADMIN_REQUIRED,
		PRE_GAME_LOOKUP,
		WAITING_FOR_GAME,
		GAME_STARTING,
		GAME_STARTED,
		GAME_RUNNING,
		GAME_ENDED,
		RECORDER_STOPS,
	};

	static CRecorderStateMachine& GetInstance();

public:
	CRecorderStateMachine();
	void InitAddresses();
	void Run();
	void OnWarcraft3Closed();
	bool IsReplayRunning();
	bool IsGameOrReplayRunning();
	void SetState(EStates _State);
	void Ping();
	CW3MatchAnalyzerBase* GetMatchAnalyzer();
	

private:
	void ExecuteState();
	void CheckForRunningGame();
	bool IsNetease();
	bool IsW3Champions();

private:
	static CRecorderStateMachine* s_pInstance;
	EStates m_State;
	CW3MatchAnalyzerBase* m_pW3MatchAnalyzer;
	time_t m_LastPing;
	bool m_GameIsRunning;
};


