#pragma once
#include <algorithm>
#include <string>
#include <Windows.h>
#include <tlhelp32.h>
#include <iomanip>
#include <sstream>
#include <fstream>
#include "ProcInfo.h"

class CUtils {
public:

	//-----------------------------------------------------------
	// Get Process ID by its name
	//-----------------------------------------------------------

	static int GetRunningProcIDByName(const std::string& p_name)
	{
		cProcInfo ProcInfo;
		bool canCheckSuspended = ProcInfo.Capture() == 0;

		HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
		PROCESSENTRY32 structprocsnapshot = { 0 };

		structprocsnapshot.dwSize = sizeof(PROCESSENTRY32);

		if (snapshot == INVALID_HANDLE_VALUE)return 0;
		if (Process32First(snapshot, &structprocsnapshot) == FALSE) {
			CloseHandle(snapshot);
			return 0;
		}

		int id = 0;
		while (Process32Next(snapshot, &structprocsnapshot))
		{
			if (!strcmp(structprocsnapshot.szExeFile, p_name.c_str()))
			{
				id = structprocsnapshot.th32ProcessID;
				SYSTEM_PROCESS* pProcess = ProcInfo.FindProcessByPid(id);
				if (canCheckSuspended) {
					if (pProcess != nullptr) {
						SYSTEM_THREAD* pThread = ProcInfo.FindSysThread(pProcess);
						if (pThread) {
							BOOL isSuspended = false;
							ProcInfo.IsThreadSuspended(pThread, &isSuspended);
							if (isSuspended) {
								id = 0;
								continue;
							}
						}
					}
				}

				if (pProcess != nullptr && pProcess->WorkingSetPrivateSize.LowPart < (20000 * 1024)) {
					id = 0;
					continue;
				}

				if (id != 0) {
					DWORD exitCode = 0;
					HANDLE hproc = OpenProcess(PROCESS_ALL_ACCESS, false, id);
					if (hproc == NULL || !GetExitCodeProcess(hproc, &exitCode) || exitCode != STILL_ACTIVE) {
						if (hproc != NULL) {
							CloseHandle(hproc);
						}
						id = 0;
						continue;
					}
					CloseHandle(hproc);
				}

				break;
			}
		}



		CloseHandle(snapshot);
		return id;
	}

	static std::string ProcessIdToName(DWORD processId)
	{
		std::string ret;
		HANDLE handle = OpenProcess(
			PROCESS_QUERY_LIMITED_INFORMATION,
			FALSE,
			processId /* This is the PID, you can find one from windows task manager */
		);
		if (handle)
		{
			DWORD buffSize = 1024;
			CHAR buffer[1024];
			if (QueryFullProcessImageNameA(handle, 0, buffer, &buffSize))
			{
				ret = buffer;
			}
			else
			{
				printf("Error GetModuleBaseNameA : %lu", GetLastError());
			}
			CloseHandle(handle);
		}
		else
		{
			printf("Error OpenProcess : %lu", GetLastError());
		}
		
		return ret.substr(ret.find_last_of("/\\") + 1);
	}

	static LONG GetStringRegKey(HKEY hKey, const std::string &strValueName, std::string &strValue, const std::string &strDefaultValue)
	{
		strValue = strDefaultValue;
		CHAR szBuffer[512];
		DWORD dwBufferSize = sizeof(szBuffer);
		ULONG nError;
		nError = RegQueryValueEx(hKey, strValueName.c_str(), 0, NULL, (LPBYTE)szBuffer, &dwBufferSize);
		if (ERROR_SUCCESS == nError)
		{
			strValue = szBuffer;
		}
		return nError;
	}

	static BOOL TerminateMyProcess(DWORD dwProcessId, UINT uExitCode)
	{
		DWORD dwDesiredAccess = PROCESS_TERMINATE;
		BOOL  bInheritHandle = FALSE;
		HANDLE hProcess = OpenProcess(dwDesiredAccess, bInheritHandle, dwProcessId);
		if (hProcess == NULL)
			return FALSE;

		BOOL result = TerminateProcess(hProcess, uExitCode);

		CloseHandle(hProcess);

		return result;
	}

	static std::string URLEncode(const std::string& value) {
		std::ostringstream escaped;
		escaped.fill('0');
		escaped << std::hex;

		for (std::string::const_iterator i = value.begin(), n = value.end(); i != n; ++i) {
			std::string::value_type c = (*i);

			// Keep alphanumeric and other accepted characters intact
			if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
				escaped << c;
				continue;
			}

			// Any other characters are percent-encoded
			escaped << std::uppercase;
			escaped << '%' << std::setw(2) << int((unsigned char)c);
			escaped << std::nouppercase;
		}

		return escaped.str();
	}

	static bool FileExists(const std::string& name) {
		struct stat buffer;
		return (stat(name.c_str(), &buffer) == 0);
	}

	static bool FileContains(const std::wstring& file, const std::string& phrase) {

		bool found = false;
		std::string line;
		std::ifstream stream1(file);

		if (!stream1.good()) {
			return false;
		}

		while (std::getline(stream1, line))
		{
			if (line.find(phrase) != std::string::npos) {
				found = true;
				break;
			}
		}
		return found;
	}

	static std::string GenerateRandomString(size_t length)
	{
		srand(time(NULL));
		auto randchar = []() -> char
		{
			const char charset[] =
				"0123456789"
				"ABCDEFGHIJKLMNOPQRSTUVWXYZ"
				"abcdefghijklmnopqrstuvwxyz";
			const size_t max_index = (sizeof(charset) - 1);
			return charset[rand() % max_index];
		};
		std::string str(length, 0);
		std::generate_n(str.begin(), length, randchar);
		return str;
	}
};
