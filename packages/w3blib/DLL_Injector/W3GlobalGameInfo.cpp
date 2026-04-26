#include "W3GlobalGameInfo.h"

CW3GlobalGameInfo* CW3GlobalGameInfo::s_pInstance = nullptr;

CW3GlobalGameInfo& CW3GlobalGameInfo::GetInstance()
{
	if (s_pInstance == nullptr) {
		s_pInstance = new CW3GlobalGameInfo();
	}
	return *s_pInstance;
}

void CW3GlobalGameInfo::RefreshGameTime()
{
	SIZE_T readChunkBytes;
	ptr pTimeAddress = CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::GAMETIME).address;
	ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)pTimeAddress, &m_GameTime, sizeof(int32_t), &readChunkBytes);
}

int32_t CW3GlobalGameInfo::GetGameTime()
{
	return m_GameTime;
}

CW3GlobalGameInfo::CW3GlobalGameInfo() : m_GameTime(0), m_IsObsOrReplay(false), m_IsPro(false), m_IsAnonymousGame(false)
{
}

void CW3GlobalGameInfo::SetObsOrReplay(bool _IsObsOrReplay) {
	m_IsObsOrReplay = _IsObsOrReplay;
}

bool CW3GlobalGameInfo::IsObsOrReplay() {
	return m_IsObsOrReplay;
}

void CW3GlobalGameInfo::SetPro(bool _IsPro)
{
	m_IsPro = _IsPro;
}

bool CW3GlobalGameInfo::IsProOrObserver()
{
	return IsObsOrReplay() || m_IsPro;
}

bool CW3GlobalGameInfo::IsAnonymousGame()
{
	return m_IsAnonymousGame;
}

void CW3GlobalGameInfo::SetAnonymousGame(bool _IsAnonymousGame)
{
	m_IsAnonymousGame = _IsAnonymousGame;
}
