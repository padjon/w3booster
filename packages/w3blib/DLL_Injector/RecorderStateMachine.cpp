#include "RecorderStateMachine.h"
#include "W3Process.h"
#include "Logger.h"
#include "DataPipeWriter.h"
#include <time.h>
#include "W3InMemMatchAnalyzer.h"
#include "W3Settings.h"
#include "W3StateTracker.h"
#include "TurnManager.h"

CRecorderStateMachine* CRecorderStateMachine::s_pInstance(nullptr);

CRecorderStateMachine& CRecorderStateMachine::GetInstance()
{
	if (s_pInstance == nullptr) {
		s_pInstance = new CRecorderStateMachine();
	}
	return *s_pInstance;
}


CRecorderStateMachine::CRecorderStateMachine() : m_State(EStates::INITIALIZING), m_pW3MatchAnalyzer(nullptr), m_LastPing(0), m_GameIsRunning(false) {
	SetState(m_State);
}

void CRecorderStateMachine::InitAddresses() {
	CW3ListManager::Initialize(CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::LISTS).address);
	SetState(EStates::PRE_GAME_LOOKUP);
}

void CRecorderStateMachine::Run() {
	CTurnManager::NextTurn();

	if (difftime(time(0), m_LastPing) >= 10.0) {
		Ping();
		m_LastPing = time(0);
	}

	CheckForRunningGame();

	if (!IsGameOrReplayRunning() && m_State > EStates::WAITING_FOR_GAME) {
		SetState(EStates::GAME_ENDED);
	}

	ExecuteState();
}

void CRecorderStateMachine::ExecuteState() {
	switch (m_State) {
		case PRE_GAME_LOOKUP: {
			CLogger::Log << "Waiting for a game to start..." << CLogger::END;
			SetState(EStates::WAITING_FOR_GAME);
		} break;
		case WAITING_FOR_GAME: {
			if (IsGameOrReplayRunning()) {
				SetState(EStates::GAME_STARTING);
			}

			if (m_State == EStates::WAITING_FOR_GAME) {
				Sleep(100);
			}
		} break;

		case GAME_STARTING: {
			CLogger::Log << "Detected match start. Type: " << (IsReplayRunning() ? "REPLAY" : "LIVEGAME") << CLogger::END;
			SetState(EStates::GAME_STARTED);
		} break;

		case GAME_STARTED: {
			char buffer[16] = { 0 };
			SIZE_T readChunkBytes;

			std::vector<CW3MemoryUtils::ESequence> sequences = { /*CW3MemoryUtils::ESequence::REALM,*/ CW3MemoryUtils::ESequence::LISTS };
			while (CW3Process::GetInstance().FittingVersionIsRunning() && !CW3MemoryUtils::GetInstance().FindW3Addresses(sequences, true)) {
				Sleep(100);
			}

			/*
			ptr pRealmAddress = CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::REALM).address;
			ReadProcessMemory(CW3Process::getInstance().GetProcessHandle(), (void*)pRealmAddress, buffer, 16, &readChunkBytes);
			std::string realm = std::string(buffer);
			*/
			std::string realm = "Reforged";
			if (IsNetease()) {
				realm = "Netease";
			} else if (IsW3Champions()) {
				realm = "W3Champions";
			}

			CW3Settings::getInstance().ReloadSettings();

			m_pW3MatchAnalyzer = new CW3InMemMatchAnalyzer(CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::LISTS).address, realm, IsReplayRunning());

			SetState(EStates::GAME_RUNNING);
		}break;

		case GAME_RUNNING: {
			m_pW3MatchAnalyzer->Run();
			Sleep(m_pW3MatchAnalyzer->GetTurnFrequency());
		} break;

		case GAME_ENDED: {
			// memory leak because of cast
			delete m_pW3MatchAnalyzer;
			m_pW3MatchAnalyzer = nullptr;
			CLogger::Log << "Detected match end - stopped processing!" << CLogger::END;
			SetState(EStates::PRE_GAME_LOOKUP);
		} break;
	}
}

void CRecorderStateMachine::OnWarcraft3Closed() {
	if (IsGameOrReplayRunning()) {
		SetState(EStates::GAME_ENDED);
		ExecuteState();
	}
}

bool CRecorderStateMachine::IsReplayRunning()
{
	if (IsGameOrReplayRunning() && IsNetease() && CW3Process::GetInstance().IsInNeteaseWatchmode()) {
		return false;
	}
	return CW3StateTracker::GetInstance().IsInState(CW3StateTracker::EState::REPLAY_RUNNING);
}

bool CRecorderStateMachine::IsGameOrReplayRunning()
{
	return m_GameIsRunning;
}

void CRecorderStateMachine::SetState(EStates _State)
{
	if (m_State != _State) {
		m_State = _State;
		CDataPipeWriter::GetInstance().Send(CDataPipeWriter::EMessageType::RECORDER_STATE, std::to_string(m_State));
	}
}

void CRecorderStateMachine::Ping()
{
	CDataPipeWriter::GetInstance().Send(CDataPipeWriter::EMessageType::PING, "PING");
}

CW3MatchAnalyzerBase* CRecorderStateMachine::GetMatchAnalyzer()
{
	return m_pW3MatchAnalyzer;
}

void CRecorderStateMachine::CheckForRunningGame()
{
	m_GameIsRunning = CW3StateTracker::GetInstance().IsInState(CW3StateTracker::EState::GAME_RUNNING);
}

bool CRecorderStateMachine::IsNetease() {
	auto x = CW3Process::GetInstance().GetParentProcessName();
	if (CW3Process::GetInstance().GetParentProcessName() == "Platform.exe") {
		return true;
	}
	return false;
}

bool CRecorderStateMachine::IsW3Champions() {
	auto x = CW3Process::GetInstance().GetParentProcessName();
	if (CW3Process::GetInstance().GetParentProcessName() == "W3Champions.exe") {
		return true;
	}
	return false;
}
