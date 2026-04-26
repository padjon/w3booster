#pragma once
#pragma once

class CW3StateTracker {

public:
	static CW3StateTracker& GetInstance();

public:
	enum EState {
		NO_GAME =			0,
		GAME_RUNNING =		1 << 0,
		REPLAY_RUNNING =	1 << 1,
		SP_RUNNING =		1 << 2,
		MP_RUNNING =		1 << 3,
	};
	enum EStateFlags {
		NONE =			0,
		LOST =			1 << 0,
		WON =			1 << 1,
		LAG_SHOWN =		1 << 2,
		QUEST_SHOWN =	1 << 3
	};


public:
	void Initialize();
	void TrackState();
	bool IsInState(EState _State);
	bool HasStateFlag(EStateFlags _Flag);

private:
	static CW3StateTracker* s_pInstance;

private:
	/* new logic: notice game state to see if in a game = >= GAME_BEGIN, then just track changes in this value. If the value got smaller, game ended. If the value got bigger: If it got bigger by 8, it was a loss, if it became bigger by >8 and < 50, it was a win, if it was > 50, ignore for gameresult. we implement this in a way where we notice and document game flags. every positive change produces a gameflag. at the end of the game we check if the win or lose flag was set. */

	enum EW3MemoryStates {
		W3MEM_NO_GAME = 0,
		W3MEM_GAME_BEGIN = W3REVERSE::VALUE_W3STATE_GAME_SP,
		W3MEM_GAME_SP_BEGIN = W3REVERSE::VALUE_W3STATE_GAME_SP,
		W3MEM_GAME_SP_END = W3MEM_GAME_SP_BEGIN + 1,
		W3MEM_GAME_REPLAY_BEGIN = W3REVERSE::VALUE_W3STATE_REPLAY,
		W3MEM_GAME_REPLAY_END = W3REVERSE::VALUE_W3STATE_GAME_MP - 1,
		W3MEM_GAME_MP_BEGIN = W3REVERSE::VALUE_W3STATE_GAME_MP,
		W3MEM_GAME_MP_END = W3MEM_GAME_MP_BEGIN + (W3MEM_GAME_REPLAY_END - W3MEM_GAME_REPLAY_BEGIN)
	};

	enum EW3MemoryStateAdditions{
		W3MEM_LOST = W3REVERSE::VALUE_W3STATE_GAME_SP_QUEST_DIALOG_LOST - W3REVERSE::VALUE_W3STATE_GAME_SP_QUEST_DIALOG,
		W3MEM_WON = 10,
		W3MEM_WON_RANGE_BEGIN = 9,
		W3MEM_WON_RANGE_END = 34,
		W3MEM_QUEST_DIALOG = W3REVERSE::VALUE_W3STATE_GAME_SP_QUEST_DIALOG - W3REVERSE::VALUE_W3STATE_GAME_SP,
		W3MEM_LAG_DIALOG = 102,

		W3MEM_WON_FFA = 22, //which FFA???
		W3MEM_WON_3ON3 = 28,
		W3MEM_WON_4ON4 = 34,
	};



private:
	CW3StateTracker();
	int ReadStateFromMemory();

	void SetState(EState _State);
	void SetStateFlags(EStateFlags _Flags);

private:
	const std::unordered_map<CW3StateTracker::EW3MemoryStateAdditions, EStateFlags> m_StateAdditionToFlag;
	int m_MemoryState;
	EState m_State;
	EStateFlags m_StateFlags;
};