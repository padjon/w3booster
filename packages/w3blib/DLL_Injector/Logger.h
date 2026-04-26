#pragma once
#include <sstream>
#include <string>
#include <Windows.h>
#include <mutex>

class CLogger {
public:
	static CLogger Log;
	static const std::string END;;

public:
	CLogger();
	void StartLogline();

	template <typename T>
	CLogger& operator << (T const& value);
	CLogger& operator << (const std::string& rValue);
	CLogger& operator <<(std::ostream& (*os)(std::ostream&));

public:
	void EndLogline();
	void PrintLogLine(std::string& rLogLine);

	void LogToConsole(bool value);
	void LogToPipe(std::string& rLogPipe);
	bool LogToConsole();

private:
	std::ostringstream m_Stream;
	std::recursive_mutex m_Mutex;
	bool m_isNewLine;
	std::string m_LogId;
	FILE* m_pConsoleFile;
	HANDLE m_hLogPipe;
};

template<typename T>
inline CLogger& CLogger::operator<<(T const& value)
{
	std::lock_guard<std::recursive_mutex> lock(m_Mutex);
	if (m_isNewLine) {
		StartLogline();
	}
	m_Stream << value;
	return *this;
}
