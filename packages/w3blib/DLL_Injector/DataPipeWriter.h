#pragma once
#include <sstream>
#include <string>
#include <Windows.h>

class CDataPipeWriter {
public:
	enum EMessageType {
		RECORDER_STATE,
		LOCAL_MATCHUP,
		LOCAL_GAMEDATA,
		GAMEDATA,
		MATCHUP,
		MATCHSCORE,
		PING,
		SWITCH_PLATFORM,
		REQUEST_ADMIN,
		GAMETIME
	};

	static bool Initialize(std::string& rPipeName);
	static CDataPipeWriter& GetInstance();

public:
	CDataPipeWriter(std::string& rPipeName);


public:
	void Send(EMessageType MessageType, const std::string& rData);
	void Send(EMessageType MessageType, const BYTE* rData, const SIZE_T _DataLength);

private:
	static CDataPipeWriter* s_pInstance;

private:
	std::string Encrypt(const std::string& _rMessage);
	std::string Base64Encode(unsigned char const* bytes_to_encode, unsigned int in_len);

private:
	HANDLE m_hPipe;
	std::string m_PipeName;
};