#include "Logger.h"
#include <ctime>
#include <iomanip>
#include <iostream>
#include <Windows.h>
#include "Utils.h"


const std::string CLogger::END= "LOGGER::END";
CLogger CLogger::Log;

CLogger::CLogger() : m_Stream(), m_Mutex(), m_isNewLine(true), m_LogId(CUtils::GenerateRandomString(6)), m_pConsoleFile(nullptr), m_hLogPipe(0) {
}


void CLogger::StartLogline()
{
	std::lock_guard<std::recursive_mutex> lock(m_Mutex);
	std::time_t t = std::time(0);   // get time now
	std::tm now = {};
	localtime_s(&now, &t);
	m_Stream << "[" << std::setfill('0') << std::setw(2) << now.tm_hour << ':' << std::setfill('0') << std::setw(2) << now.tm_min << ':' << std::setfill('0') << std::setw(2) << now.tm_sec << "] [" + m_LogId + "] ";
	m_isNewLine = false;
}


CLogger& CLogger::operator<<(const std::string& rValue)
{
	std::lock_guard<std::recursive_mutex> lock(m_Mutex);
	if (rValue == CLogger::END) {
		EndLogline();
	} else {
		if (m_isNewLine) {
			StartLogline();
		}
		m_Stream << rValue;
	}
	return *this;
}

CLogger& CLogger::operator<<(std::ostream& (*os)(std::ostream&))
{
	std::lock_guard<std::recursive_mutex> lock(m_Mutex);
	if (m_isNewLine) {
		StartLogline();
	}
	m_Stream << os;
	return *this;
}

void CLogger::EndLogline() {
	std::lock_guard<std::recursive_mutex> lock(m_Mutex);
	m_Stream << std::endl;
	std::string logLine = m_Stream.str();
	PrintLogLine(logLine);
	m_isNewLine = true;
	m_Stream.str("");
	m_Stream.clear();
}

void CLogger::PrintLogLine(std::string& rLogLine) {
	std::lock_guard<std::recursive_mutex> lock(m_Mutex);
	if(LogToConsole()) {
		std::cout << rLogLine;
	}
	if (m_hLogPipe != 0) {
		DWORD numWritten;
		WriteFile(m_hLogPipe, rLogLine.c_str(), rLogLine.length(), &numWritten, NULL);
	}
}

void CLogger::LogToConsole(bool value)
{
	std::lock_guard<std::recursive_mutex> lock(m_Mutex);
	if (value) {
		m_pConsoleFile = nullptr;
		AllocConsole();
		freopen_s(&m_pConsoleFile, "CONOUT$", "w", stdout);
		DWORD prev_mode;
		HANDLE hInput = GetStdHandle(STD_INPUT_HANDLE);
		GetConsoleMode(hInput, &prev_mode);
		SetConsoleMode(hInput, prev_mode & ~ENABLE_QUICK_EDIT_MODE);
	}
}

void CLogger::LogToPipe(std::string& rLogPipe)
{
	std::lock_guard<std::recursive_mutex> lock(m_Mutex);
	if (rLogPipe != "") {
		m_hLogPipe = CreateFile(TEXT(std::string("\\\\.\\pipe\\" + rLogPipe).c_str()), GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
		ConnectNamedPipe(m_hLogPipe, NULL);
	}
}

bool CLogger::LogToConsole()
{
	std::lock_guard<std::recursive_mutex> lock(m_Mutex);
	return m_pConsoleFile != nullptr;
}
