#include <vector>
#include <string>
#include "Utils.h"
#include <algorithm>
#include <iostream>
#include <fstream>
#include <sstream>
#include <ctime>
#include <iomanip>
#include <Psapi.h>
#include <set>
#include <atomic>
#include "Logger.h"
#include <iostream>


#include <tlhelp32.h>
#include "W3Process.h"
#include "Settings.h"
#include "W3MemoryUtils.h"
#include "RecorderStateMachine.h"
#include "DataPipeWriter.h"
#include "TurnManager.h"
#include "W3GlobalGameInfo.h"
#include "W3Settings.h"

const char* VERSION = "1.1.1";
static std::atomic_bool g_StartRecorderRunning(false);
/*
Camera max 1650 - ~900
*/
#ifdef _WINDLL
#ifdef __cplusplus
extern "C" {
#endif
	__declspec(dllexport) void SetRecorderSettings(const char* _Settings) {
		CSettings::GetInstance().SetSettings(std::string(_Settings));
	}

	__declspec(dllexport) void StopRecorder() {
		exit(0);
	}

	__declspec(dllexport) void RestartGame() {
		CRecorderStateMachine::GetInstance().SetState(CRecorderStateMachine::EStates::WAITING_FOR_GAME);
	}

	__declspec(dllexport) int InitializeRecorder(bool _LogHeader);
	__declspec(dllexport) void StartRecorder();

	__declspec(dllexport) void SetPro(bool _IsPro) {
		CW3GlobalGameInfo::GetInstance().SetPro(_IsPro);
		CLogger::Log << "Pro status: " << ((_IsPro) ? "true" : "false") << CLogger::END;
	}

	__declspec(dllexport) int GetW3HWND() {
		return (int)CW3Process::GetInstance().GetW3HWND();
	}

	__declspec(dllexport) const char* GetOBSCommands() {

		// test3
		static std::stringstream ss;
		ss.str("");
		ss << "{\"command\":\"SWITCH_SCENE\", \"scene\": \"Scene 2\"}" << std::endl;
		ss << "{\"command\":\"SHOW_SOURCE\", \"scene\": \"Scene 2\", \"id\": 1}" << std::endl;
		return "{\"command\":\"SWITCH_SCENE\", \"scene\": \"Scene 2\"}\n{\"command\":\"SHOW_SOURCE\", \"scene\": \"Scene 2\", \"id\": 2}";
	}

	__declspec(dllexport) void SendOBSResults(const char* a) {
		return;
	}
#ifdef __cplusplus
}
#endif
#endif

void InitializeRecorderSettings() {
	if (CSettings::GetInstance().GetSetting("logToConsole", false)) {
		CLogger::Log.LogToConsole(true);
	}

	std::string& rDataPipe = CSettings::GetInstance().GetSetting<std::string>("dataPipe", "");
	if (rDataPipe == "") {
		MessageBoxA(0, "Can't start the recorder because the data pipe name is not provided", "data pipe name missing", MB_ICONERROR);
		exit(-1);
	}

	if (!CDataPipeWriter::Initialize(rDataPipe)) {
		MessageBoxA(0, "Can't start the recorder because the data pipe was missing", "data pipe not provided", MB_ICONERROR);
		exit(-1);
	}

	std::string& rLogPipe = CSettings::GetInstance().GetSetting<std::string>("logPipe", "");
	if (rLogPipe != "") {
		CLogger::Log.LogToPipe(rLogPipe);
	}
}

#include "StackWalker.h"
#include "W3Reverse.h"
#include "W3StateTracker.h"
class MyStackWalker : public StackWalker
{
public:
	MyStackWalker() : StackWalker() {}
protected:
	virtual void OnOutput(LPCSTR szText)
	{
		CLogger::Log << "Stack: " << szText;
	}
};

LONG WINAPI W3BCrashHandler(EXCEPTION_POINTERS* pExcept)
{
	static char msg[256];
	sprintf_s(msg, 256, "Unhandled exception 0x%08x at %p",
		pExcept->ExceptionRecord->ExceptionCode,
		pExcept->ExceptionRecord->ExceptionAddress);
	CLogger::Log << "ERROR: An error occoured: " << msg << CLogger::END;
	CRecorderStateMachine::GetInstance().SetState(CRecorderStateMachine::EStates::UNEXPECTED_EXCEPTION);
	MyStackWalker sw;
	sw.ShowCallstack();
	CLogger::Log << CLogger::END;
	Sleep(500000000);
	return NULL;
}

int InitializeRecorder(bool _LogHeader) {

	if (g_StartRecorderRunning.load()) {
		return EXIT_SUCCESS;
	}

	::SetUnhandledExceptionFilter(W3BCrashHandler);
	InitializeRecorderSettings();
	CRecorderStateMachine::GetInstance().SetState(CRecorderStateMachine::EStates::INITIALIZING);

	if(_LogHeader) {
		CLogger::Log << "#################################################################" << CLogger::END;
		CLogger::Log << "###              W3Booster Reforged Analyzer v" << VERSION << "             ###" << CLogger::END;
		CLogger::Log << "#################################################################" << CLogger::END;
		CLogger::Log << "Build Time: " << __DATE__ << " " << __TIME__ << CLogger::END;
		CLogger::Log << "Supported architecture: " << ((sizeof(ptr) == sizeof(uint64_t)) ? "x64" : "x86") << CLogger::END;
		CLogger::Log << "Supported version: Warcraft III Reforged" << CLogger::END;
		CLogger::Log << "Process ID: " << GetCurrentProcessId() << std::endl << CLogger::END;

		CLogger::Log << "Configuration" << std::endl;

		auto& rSettings = CSettings::GetInstance().GetSettings();
		for (nlohmann::json::iterator it = rSettings.begin(); it != rSettings.end(); ++it) {
			CLogger::Log << "           " << it.key() << ": " << it.value() << std::endl;
		}
		CLogger::Log << CLogger::END;
	}
	CRecorderStateMachine::GetInstance().SetState(CRecorderStateMachine::EStates::INITIALIZED);
	return EXIT_SUCCESS;
}

void StartRecorder() {
	bool expected = false;
	if (!g_StartRecorderRunning.compare_exchange_strong(expected, true)) {
		CLogger::Log << "Recorder is already running. Ignoring duplicate StartRecorder call." << CLogger::END;
		return;
	}
	
	try {
		CRecorderStateMachine::GetInstance().SetState(CRecorderStateMachine::EStates::PRE_W3_LOOKUP);
		CLogger::Log << "Looking up WC3 process..." << CLogger::END;
		if (!CW3Process::GetInstance().W3ProcessIsRunning()) {
			do {
				if (!CW3Process::GetInstance().W3ProcessIsRunning()) {
					CLogger::Log << "WC3 is not yet running. Looking up every 5 seconds..." << CLogger::END;
					CRecorderStateMachine::GetInstance().SetState(CRecorderStateMachine::EStates::WAITING_FOR_W3);
					do {
						Sleep(5000);
					} while (!CW3Process::GetInstance().W3ProcessIsRunning());
				}
			} while (!CW3Process::GetInstance().W3ProcessIsRunning());
			Sleep(2000);
		}
		CLogger::Log << "WC3 process detected! Process ID: " << CW3Process::GetInstance().GetPID() << CLogger::END;
		CRecorderStateMachine::GetInstance().SetState(CRecorderStateMachine::EStates::ANALYZING_W3);
		
		if (CW3Process::GetInstance().FittingVersionIsRunning() && CW3Process::GetInstance().AdminPrivilegesRequired()) {
			CLogger::Log << "WC3 was started as administrator." << CLogger::END;
			CLogger::Log << "Administration privilegues required to continue.." << CLogger::END;
			CRecorderStateMachine::GetInstance().SetState(CRecorderStateMachine::EStates::ADMIN_REQUIRED);
			Sleep(500);
			CDataPipeWriter::GetInstance().Send(CDataPipeWriter::EMessageType::REQUEST_ADMIN, "NEED_ADMIN");
			g_StartRecorderRunning.store(false);
			return;
		}

		if (CW3Process::GetInstance().FittingVersionIsRunning() && !CW3MemoryUtils::GetInstance().Initialize()) {
			CLogger::Log << "Was not able to initialize the utils, trying again in 2 seconds..." << CLogger::END;
			while (CW3Process::GetInstance().FittingVersionIsRunning() && !CW3MemoryUtils::GetInstance().Initialize()) {
				Sleep(2000);
			}
		}

		std::vector<CW3MemoryUtils::ESequence> sequences = { CW3MemoryUtils::ESequence::LISTS };
		if (CW3Process::GetInstance().FittingVersionIsRunning() && !CW3MemoryUtils::GetInstance().FindW3Addresses(sequences, true)) {
			CLogger::Log << "Could not find all required information, trying again in 2 seconds..." << CLogger::END;
			while (CW3Process::GetInstance().FittingVersionIsRunning() && !CW3MemoryUtils::GetInstance().FindW3Addresses(sequences, true)) {
				Sleep(2000);
			}
		}

		DWORD version[4];
		CW3Process::GetInstance().GetExeVersion(version);
		CLogger::Log << "Detected Version of WC3: v" << version[0] << "." << version[1] << "." << version[2] << "." << version[3] << CLogger::END;
		if (version[3] != W3REVERSE::VALUE_WC3_VERSION_BUILD) {
			CLogger::Log << "ERROR: This version of Reforged is not yet supported, we are working on an update... Stay tuned (v" << version[0] << "." << version[1] << "." << version[2] << "." << version[3] << ")" << CLogger::END;
			while (CW3Process::GetInstance().FittingVersionIsRunning()) {
				Sleep(1000);
			}
		}

		/*
		CLogger::Log << "Looking up Warcraft III settings..." << CLogger::END;
		if (!CW3Settings::getInstance().InitializeSettings()) {
			CLogger::Log << "ERROR: Was unable to detect Warcraft III settings. Please contact the support on discord." << CLogger::END;
			while (CW3Process::getInstance().FittingVersionIsRunning()) {
				Sleep(1000);
			}
		}
#ifdef W3BDBG
		else {
			CLogger::Log << "Detected initial settings:" << CLogger::END;
			CW3Settings::getInstance().dbgPrintSettings();
		}
#endif
*/


		if (CW3Process::GetInstance().FittingVersionIsRunning()) {
			CLogger::Log << "Found all required information..." << CLogger::END;
			CRecorderStateMachine::GetInstance().InitAddresses();
			CW3StateTracker::GetInstance().Initialize();
			while (CW3Process::GetInstance().FittingVersionIsRunning()) {
				CW3StateTracker::GetInstance().TrackState();
				CRecorderStateMachine::GetInstance().Run();

				MSG msg;
				PeekMessage(&msg, 0, 0, 0, PM_REMOVE);
				DispatchMessage(&msg);
			}
			CRecorderStateMachine::GetInstance().OnWarcraft3Closed();
		}

		CLogger::Log << "WC3 process was terminated..." << CLogger::END;


		CW3Process::GetInstance().IsRunning(false);
		g_StartRecorderRunning.store(false);
		StartRecorder();
	}
	catch (const std::exception& e) {
		CLogger::Log << "ERROR: An unexpected std::exception occoured: " << e.what() << CLogger::END;
		CRecorderStateMachine::GetInstance().SetState(CRecorderStateMachine::EStates::UNEXPECTED_EXCEPTION);
		MyStackWalker sw;
		sw.ShowCallstack();
		CLogger::Log << CLogger::END;
		g_StartRecorderRunning.store(false);
	}
	catch (...) {
		CLogger::Log << "ERROR: An unexpected error occoured!" << CLogger::END;
		CRecorderStateMachine::GetInstance().SetState(CRecorderStateMachine::EStates::UNEXPECTED_EXCEPTION);
		MyStackWalker sw;
		sw.ShowCallstack();
		CLogger::Log << CLogger::END;
		g_StartRecorderRunning.store(false);
	}
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
	/*
	std::ifstream settingsFile("settings.txt");
	if (settingsFile.fail()) {
		MessageBoxA(0, "The settings file settings.txt was not found!\r\nApplication shuts down", "settings.txt missing", MB_ICONERROR);
		return -1;
	}
	else {
		try {
			CSettings::GetInstance().SetSettings(settingsFile);
		}
		catch (...) {
			MessageBoxA(0, "Settings are not in a correct format!\r\nApplication shuts down", "Content of settings.txt wrong", MB_ICONERROR);
			return -2;
		}
	}

	InitializeRecorder(true);
	StartRecorder();
	*/

	//while (true);

	CLogger::Log.LogToConsole(true);
	while (!CW3Process::GetInstance().W3ProcessIsRunning()) {

		std::cout << "Start WC3" << std::endl;
	}

	CW3MemoryUtils::GetInstance().Initialize();

	while (true) {
		bool isRunning = CW3StateTracker::GetInstance().IsInState(CW3StateTracker::EState::GAME_RUNNING);

		std::cout << ((isRunning) ? "true" : "false")<< std::endl;
		Sleep(1000);

	}
}


#ifdef _WINDLL
BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpReserved) {

	// Perform actions based on the reason for calling.
	switch (fdwReason)
	{
	case DLL_PROCESS_ATTACH:
		break;

	case DLL_THREAD_ATTACH:
		// Do thread-specific initialization.
		break;

	case DLL_THREAD_DETACH:
		// Do thread-specific cleanup.
		break;

	case DLL_PROCESS_DETACH:
		// Perform any necessary cleanup.
		break;
	}
	return TRUE;  // Successful DLL_PROCESS_ATTACH.
}
#endif
