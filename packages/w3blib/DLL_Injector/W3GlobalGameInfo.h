#pragma once
#pragma once
#include <string>
#include <unordered_set>
#include <unordered_map>
#include "W3MemoryUtils.h"
#include "W3Item.h"

class CW3GlobalGameInfo {

public:
	static CW3GlobalGameInfo& GetInstance();
	void RefreshGameTime();
	int32_t GetGameTime();

	void SetObsOrReplay(bool _IsObsOrReplay);
	bool IsObsOrReplay();
	void SetPro(bool _IsPro);
	bool IsProOrObserver();
	bool IsAnonymousGame();
	void SetAnonymousGame(bool _IsAnonymousGame);


private:
	static CW3GlobalGameInfo* s_pInstance;

private:
	CW3GlobalGameInfo();

private:
	int32_t m_GameTime;
	bool m_IsObsOrReplay;
	bool m_IsPro;
	bool m_IsAnonymousGame;

};