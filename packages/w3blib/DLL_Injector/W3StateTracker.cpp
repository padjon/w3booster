#include "W3MemoryUtils.h"
#include "W3StateTracker.h"
#include "Logger.h"

CW3StateTracker* CW3StateTracker::s_pInstance(nullptr);
CW3StateTracker& CW3StateTracker::GetInstance() {
	if (s_pInstance == nullptr) {
		s_pInstance = new CW3StateTracker();
	}
	return *s_pInstance;
}


CW3StateTracker::CW3StateTracker(): 
	m_MemoryState(EW3MemoryStates::W3MEM_NO_GAME), m_State(EState::NO_GAME), m_StateFlags(EStateFlags::NONE), m_StateAdditionToFlag({
		{EW3MemoryStateAdditions::W3MEM_LOST,   EStateFlags::LOST},
		{EW3MemoryStateAdditions::W3MEM_WON,   EStateFlags::WON},
		{EW3MemoryStateAdditions::W3MEM_QUEST_DIALOG,   EStateFlags::QUEST_SHOWN},
		{EW3MemoryStateAdditions::W3MEM_LAG_DIALOG,   EStateFlags::LAG_SHOWN},
	}) 
{
	Initialize();
}

void CW3StateTracker::Initialize() {
	m_MemoryState = EW3MemoryStates::W3MEM_NO_GAME;
	m_State = EState::NO_GAME;
	m_StateFlags = EStateFlags::NONE;
}


void CW3StateTracker::TrackState()
{
	int lastMemoryState = m_MemoryState;
	int newMemoryState = m_MemoryState = ReadStateFromMemory();

	if (newMemoryState != lastMemoryState) {
		#ifdef W3BDBG
				CLogger::Log << "STATE-DBG: wc3 mem state changed from " << lastMemoryState << " to " << newMemoryState << CLogger::END;
		#endif

		//Game started
		if (lastMemoryState < EW3MemoryStates::W3MEM_GAME_BEGIN && newMemoryState >= EW3MemoryStates::W3MEM_GAME_BEGIN) {
			SetState(EState::GAME_RUNNING);
			SetStateFlags(EStateFlags::NONE);

			if (newMemoryState >= EW3MemoryStates::W3MEM_GAME_REPLAY_BEGIN && newMemoryState <= EW3MemoryStates::W3MEM_GAME_REPLAY_END) {
				SetState((EState)(m_State | EState::REPLAY_RUNNING));
			}
			else if (newMemoryState >= EW3MemoryStates::W3MEM_GAME_SP_BEGIN && newMemoryState <= EW3MemoryStates::W3MEM_GAME_SP_END) {
				SetState((EState)(m_State | EState::SP_RUNNING));
			}
			else if (newMemoryState >= EW3MemoryStates::W3MEM_GAME_MP_BEGIN && newMemoryState <= EW3MemoryStates::W3MEM_GAME_MP_END) {
				SetState((EState)(m_State | EState::MP_RUNNING));
			}
		} 
		// Game continues
		else if (newMemoryState >= EW3MemoryStates::W3MEM_GAME_BEGIN) {
			const int StateAddition = newMemoryState - lastMemoryState;
			// flag was added
			if (StateAddition > 0) {
				auto it = m_StateAdditionToFlag.find((EW3MemoryStateAdditions)StateAddition);
				if (it != m_StateAdditionToFlag.end()) {
					SetStateFlags((EStateFlags)(m_StateFlags | it->second));
				}
				else if (StateAddition >= EW3MemoryStateAdditions::W3MEM_WON_RANGE_BEGIN && StateAddition <= EW3MemoryStateAdditions::W3MEM_WON_RANGE_END) {
					SetStateFlags((EStateFlags)(m_StateFlags | EStateFlags::WON));
				}
			#ifdef W3BDBG
				else {
					CLogger::Log << "STATE-DBG: unknown mem flag set: " << StateAddition << CLogger::END;
				}
			#endif
			}
		}
		// Game ended
		else if (lastMemoryState >= EW3MemoryStates::W3MEM_GAME_BEGIN && newMemoryState < EW3MemoryStates::W3MEM_GAME_BEGIN) {
			SetState(EState::NO_GAME);
		}
	}
}

bool CW3StateTracker::IsInState(EState _State)
{
	return (m_State & _State) == _State;
}

bool CW3StateTracker::HasStateFlag(EStateFlags _StateFlag)
{
	return (m_StateFlags & _StateFlag) == _StateFlag;
}

int CW3StateTracker::ReadStateFromMemory()
{
	SIZE_T readChunkBytes;
	ptr pMapNameAddress = CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::W3STATE).address;
	int result = 0;
	ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)pMapNameAddress, &result, sizeof(result), &readChunkBytes);
	return result;
}

void CW3StateTracker::SetState(EState _State)
{
	if (m_State != _State) {
		#ifdef W3BDBG
				CLogger::Log << "STATE-DBG: state changed from " << m_State << " to " << _State << CLogger::END;
		#endif
		m_State = _State;
	}
}

void CW3StateTracker::SetStateFlags(EStateFlags _StateFlags)
{
	if (m_StateFlags != _StateFlags) {
		#ifdef W3BDBG
				CLogger::Log << "STATE-DBG: flag set "<< _StateFlags - m_StateFlags << CLogger::END;
		#endif
		m_StateFlags = _StateFlags;
	}
}
