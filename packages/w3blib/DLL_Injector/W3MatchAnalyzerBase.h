#pragma once
#include "DataPipeWriter.h"
class CW3MatchAnalyzerBase {
	public:
		virtual ~CW3MatchAnalyzerBase() = default;
		virtual void Run() = 0;
		virtual int GetTurnFrequency() = 0;

	private:
		bool m_IsLocalGame = false;

	public:
		void SetToLocalGame() {
			m_IsLocalGame = true;
		}

		CDataPipeWriter::EMessageType GetGameDataMessageType(bool IsMatchup = false) {
			if (m_IsLocalGame) {
				return (IsMatchup) ? CDataPipeWriter::EMessageType::LOCAL_MATCHUP : CDataPipeWriter::EMessageType::LOCAL_GAMEDATA;
			}
			return CDataPipeWriter::EMessageType::GAMEDATA;
		}
};
