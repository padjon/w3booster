#pragma once
#include <Windows.h>
#include "Utils.h"
#include <vector>
#include "W3Reverse.h"

class CW3Process {
public:
	static CW3Process& GetInstance();

public:
	bool W3ProcessIsRunning();
	int GetW3ProcessInForeground();
	bool FittingVersionIsRunning();
	void IsRunning(bool value);
	bool AdminPrivilegesRequired();
	HANDLE GetProcessHandle();
	int GetPID();
	std::string GetParentProcessName();
	bool IsInNeteaseWatchmode();
	std::string GetExeVersion(DWORD(&version)[4]);
	HWND GetW3HWND();
	bool IsInForeground();
	void* GetModuleBaseAddress();
	static HWND FindMainWindow(unsigned long process_id);

private:
	CW3Process();
	//static void CALLBACK  OnWarcraftClosed(void* context, BOOLEAN isTimeOut);
	static BOOL EnumWindowsCallback(HWND handle, LPARAM lParam);
	static BOOL IsMainWindow(HWND handle);

private:
	static CW3Process* s_pInstance;

private:
	HANDLE m_hProcess;
	int m_PID;
	HWND m_HWND;
	int m_ParentPID;
	std::vector<HANDLE> m_WaitHandleVector;
	bool m_IsRunning;
};

