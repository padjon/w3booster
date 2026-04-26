#include "W3Process.h"
#include "Utils.h"
#include <unordered_map>
#include <sstream>
#include "W3MemoryUtils.h"
#include "Logger.h"
#include <mutex>

CW3Process* CW3Process::s_pInstance(nullptr);
CW3Process& CW3Process::GetInstance() {
	if (s_pInstance == nullptr) {
		s_pInstance = new CW3Process();
	}
	return *s_pInstance;
}

CW3Process::CW3Process() : m_hProcess(0), m_PID(0), m_ParentPID(-1), m_HWND(0), m_WaitHandleVector(), m_IsRunning(false) {

}

static ULONGLONG lastProcessEnd = 0;
bool CW3Process::W3ProcessIsRunning() {
	// only update state, if the last End of WC3 is longer then 4.5 sec ago
	if (lastProcessEnd == 0) {	
		if (!m_IsRunning) {
			
			int processId = GetW3ProcessInForeground();
			if (processId <= 0) {
				processId = CUtils::GetRunningProcIDByName("Warcraft III.exe");
			}

			if (processId != 0) {
				m_PID = processId;
				m_hProcess = OpenProcess(PROCESS_ALL_ACCESS, false, processId);
				m_IsRunning = true;
			}
		}
		else {
			DWORD exitCode = 0;
			GetExitCodeProcess(m_hProcess, &exitCode);
			if (exitCode != STILL_ACTIVE) {
				m_IsRunning = false;
				lastProcessEnd = GetTickCount64();
			}
		}
	}
	else {
		if (GetTickCount64() - lastProcessEnd > 4500) {
			lastProcessEnd = 0;
		}
	}
	return m_IsRunning;
}


int CW3Process::GetW3ProcessInForeground()
{
	HWND fgHWND = GetForegroundWindow();
	if (fgHWND != 0) {
		DWORD PID = 0;
		GetWindowThreadProcessId(fgHWND, &PID);
		if (PID > 0) {
			const std::string processName= CUtils::ProcessIdToName(PID);
			if (!strcmp(processName.c_str(), "Warcraft III.exe")) {
				return PID;
			}
		}
	}
	return 0;
}

bool CW3Process::FittingVersionIsRunning() {
	return W3ProcessIsRunning() && (GetW3ProcessInForeground() == 0 || IsInForeground());
}

bool CW3Process::AdminPrivilegesRequired()
{
	return W3ProcessIsRunning() && GetProcessHandle() == 0;
}

void CW3Process::IsRunning(bool value) {
	m_IsRunning = value;
}

HANDLE CW3Process::GetProcessHandle()
{
	return m_hProcess;
}

int CW3Process::GetPID()
{
	return m_PID;
}

std::string CW3Process::GetParentProcessName()
{
	std::unordered_map<int, std::string> processNames;
	m_ParentPID = -1;

	HANDLE h = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
	PROCESSENTRY32 pe = { 0 };
	pe.dwSize = sizeof(PROCESSENTRY32);

	if (Process32First(h, &pe)) {
		do {
			processNames[pe.th32ProcessID] = std::string(pe.szExeFile);
			if (pe.th32ProcessID == GetPID() && m_ParentPID < 0) {
				m_ParentPID = pe.th32ParentProcessID;
			}
		} while (Process32Next(h, &pe));
	}
	CloseHandle(h);
	return (m_ParentPID >= 0 && processNames.find(m_ParentPID) != processNames.end()) ? processNames[m_ParentPID] : "";
}

bool CW3Process::IsInNeteaseWatchmode() {
	if (m_ParentPID < 0) {
		GetParentProcessName();
	}

	if (m_ParentPID > 0) {
		HWND NeteaseHWND = FindMainWindow(m_ParentPID);
		if (NeteaseHWND != 0) {
			return (FindWindowEx(NeteaseHWND, 0, 0, "Warcraft III") != 0);
		}
	}
	return false;
}

std::string CW3Process::GetExeVersion(DWORD(&version)[4])
{
	LPSTR path = new CHAR[MAX_PATH];
	DWORD pathSize = MAX_PATH;
	if (QueryFullProcessImageNameA(GetProcessHandle(), 0, path, &pathSize) == 0) {
		version[0] = 0;
		version[1] = 0;
		version[2] = 0;
		version[3] = 0;
		return "0.0.0.0";
	}

	DWORD dwDummy;
	DWORD dwFVISize = GetFileVersionInfoSize(path, &dwDummy);

	LPBYTE lpVersionInfo = new BYTE[dwFVISize];

	GetFileVersionInfo(path, 0, dwFVISize, lpVersionInfo);

	UINT uLen;
	VS_FIXEDFILEINFO* lpFfi;

	VerQueryValue(lpVersionInfo, "\\", (LPVOID*)&lpFfi, &uLen);

	DWORD dwFileVersionMS = lpFfi->dwFileVersionMS;
	DWORD dwFileVersionLS = lpFfi->dwFileVersionLS;

	delete[] lpVersionInfo;

	printf("Higher: %x\n", dwFileVersionMS);

	printf("Lower: %x\n", dwFileVersionLS);

	version[0] = HIWORD(dwFileVersionMS);
	version[1] = LOWORD(dwFileVersionMS);
	version[2] = HIWORD(dwFileVersionLS);
	version[3] = LOWORD(dwFileVersionLS);

	std::stringstream ss;
	ss << version[0] << "." << version[1] << "." << version[2] << "." << version[3];
	delete[] path;
	return std::string();
}

/*
std::mutex g_ClosingMutex;
void CALLBACK  CW3Process::OnWarcraftClosed(void* context, BOOLEAN isTimeOut) {
	g_ClosingMutex.lock();
	int index = (int)context;
	CW3Process& rInstance = CW3Process::getInstance();

	if (rInstance.m_WaitHandleVector[index] != 0) {
		UnregisterWait(rInstance.m_WaitHandleVector[index]);
		rInstance.m_WaitHandleVector[index] = 0;
	}

	if (rInstance.W3ProcessIsRunning()) {
		rInstance.IsRunning(false);
	}
	g_ClosingMutex.unlock();
}
*/

struct handle_data {
	unsigned long process_id;
	HWND window_handle;
};

HWND CW3Process::FindMainWindow(unsigned long process_id)
{
	handle_data data;
	data.process_id = process_id;
	data.window_handle = 0;
	EnumWindows(CW3Process::EnumWindowsCallback, (LPARAM)&data);
	return data.window_handle;
}

BOOL CALLBACK CW3Process::EnumWindowsCallback(HWND handle, LPARAM lParam)
{
	char buffer[200];
	GetWindowTextA(handle, buffer, 200);

	handle_data& data = *(handle_data*)lParam;
	unsigned long process_id = 0;
	GetWindowThreadProcessId(handle, &process_id);
	if (data.process_id != process_id || !IsMainWindow(handle))
		return TRUE;

	data.window_handle = handle;
	return FALSE;
}

BOOL CW3Process::IsMainWindow(HWND handle)
{
	return GetWindow(handle, GW_OWNER) == (HWND)0 && IsWindowVisible(handle);
}

HWND CW3Process::GetW3HWND()
{
	if (W3ProcessIsRunning()) {
		HWND W3HWND = CW3Process::GetInstance().FindMainWindow(CW3Process::GetInstance().GetPID());
		if (W3HWND == 0) {

			if (m_ParentPID < 0) {
				GetParentProcessName();
			}

			if (m_ParentPID > 0) {
				HWND NeteaseHWND = FindMainWindow(m_ParentPID);
				if (NeteaseHWND != 0) {
					W3HWND = FindWindowEx(NeteaseHWND, 0, 0, "Warcraft III");
				}
			}
		}
		return W3HWND;
	}
	return 0;
}

bool CW3Process::IsInForeground()
{
	if (W3ProcessIsRunning() && GetPID() != 0) {
		HWND fgHWND = GetForegroundWindow();
		if (fgHWND != 0) {
			DWORD PID = 0;
			GetWindowThreadProcessId(fgHWND, &PID);
			if (PID == GetPID()) {
				return true;
			}
			else {
				if (m_ParentPID < 0) {
					GetParentProcessName();
				}

				if (m_ParentPID > 0 && m_ParentPID == PID) {
					return true;
				}
			}
		}
	}
	return false;
}

void* CW3Process::GetModuleBaseAddress()
{
	HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPMODULE, CW3Process::GetInstance().GetPID());
	void* ModuleBaseAddress = 0;
	if (hSnapshot != INVALID_HANDLE_VALUE)
	{
		MODULEENTRY32 ModuleEntry32 = { 0 };
		ModuleEntry32.dwSize = sizeof(MODULEENTRY32);
		if (Module32First(hSnapshot, &ModuleEntry32))
		{
			do
			{
				if (strcmp(ModuleEntry32.szModule, "Warcraft III.exe") == 0)
				{
					ModuleBaseAddress = (void*)ModuleEntry32.modBaseAddr;
					break;
				}
			} while (Module32Next(hSnapshot, &ModuleEntry32));
		}
		CloseHandle(hSnapshot);
	}
	return ModuleBaseAddress;
}



