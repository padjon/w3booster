#include "stdafx.h"
#include <Windows.h>
#include <iostream>
#include <sstream>
#include <iostream>
#include <string>
#include <Psapi.h>

// BeepHook.cpp : Defines the exported functions for the DLL application.
//
#include "stdafx.h"

#include <string>
#include <iostream>
#include <Windows.h>
#include <cstdio>
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>
#include <array>
#include <vector>
#include <fstream>

#include "client.h"


const void* scan_memory(void* address_low, std::size_t nbytes,
	const std::vector<BYTE>& bytes_to_find)
{
	// all readable pages: adjust this as required
	const DWORD pmask = PAGE_READONLY | PAGE_READWRITE | PAGE_WRITECOPY | PAGE_EXECUTE |
		PAGE_EXECUTE_READ | PAGE_EXECUTE_READWRITE | PAGE_EXECUTE_WRITECOPY;

	::MEMORY_BASIC_INFORMATION mbi{};

	BYTE* address = static_cast<BYTE*>(address_low);
	BYTE* address_high = address + nbytes;
	
	while (address < address_high && ::VirtualQuery(address, std::addressof(mbi), sizeof(mbi)))
	{
		// committed memory, readable, wont raise exception guard page
		// if( (mbi.State==MEM_COMMIT) && (mbi.Protect|pmask) && !(mbi.Protect&PAGE_GUARD) )
		if ((mbi.State == MEM_COMMIT) && (mbi.Protect&pmask) && !(mbi.Protect&PAGE_GUARD))
		{
			const BYTE* begin = static_cast<const BYTE*>(mbi.BaseAddress);
			const BYTE* end = begin + mbi.RegionSize;

			const BYTE* found = std::search(begin, end, bytes_to_find.begin(), bytes_to_find.end());
			while (found != end)
			{
				return found;
				found = std::search(found + 1, end, bytes_to_find.begin(), bytes_to_find.end());
			}
		}

		address += mbi.RegionSize;
		mbi = {};
	}

	return nullptr;
}


ofstream *logger;
ostringstream dbgl;
bool isConsole = false;
bool isDebug = false;


void dbg(std::ostream &rText) {
	if (isDebug) {
		(*logger) << dbgl.str();
		(*logger).flush();
	}
	if(isConsole) {
		std::cout << dbgl.str();
	}
	dbgl.str("");
}

void snip() {
	Sleep(1000);
	std::string cmdline(GetCommandLineA());
	
	isConsole = cmdline.find("-recorder-console") != std::string::npos;
	isDebug = cmdline.find("-recorder-debug") != std::string::npos;

	if (isDebug) {
		logger = new ofstream("dbg_log.txt", std::ios::out);
	}

	if(isConsole) {
		FILE *pFile = nullptr;
		AllocConsole();
		freopen_s(&pFile, "CONOUT$", "w", stdout);
	}

	dbg(dbgl << "GrubWatch Recorder v0.1.4 successfully loaded" << std::endl);

	const int preZeroBytes = 256;
	const int postZeroBytes = 256;
	std::vector<BYTE> pattern;
	for(int i = 0; i < preZeroBytes; i++)
		pattern.push_back(0x00);
	pattern.push_back(0x01);
	pattern.push_back(0x00);
	pattern.push_back(0x40);
	pattern.push_back(0x00);
	pattern.push_back(0x0f);
	for (int i = 0; i < postZeroBytes; i++)
		pattern.push_back(0x00);

	const int PORT = 25055;
	//std::string server = "localhost";
	std::string server = "devsheep.de";
	std::stringstream ss;
	ss << "Was unable to connect to server: " << server << ":" << PORT;
	const std::string conErrMsg = ss.str();
	int reconTries = 0;
	int flushCounter = 0;
	bool writeFile = false;
	void* memoryRegionStart = nullptr;
	ofstream recordFile;
	do {
		bool loopBrokenByReconnect = false;
		try {
			myTcpSocket client(PORT);
			client.setKeepAlive(60);
			dbg(dbgl << "Trying to connect to grubServer: " << server << " on port " << PORT << std::endl);
			client.connectToServer(server, NAME);
			reconTries = 0;
			dbg(dbgl << "Connection established" << std::endl);

			if(memoryRegionStart == nullptr) {
				dbg(dbgl << "Start searching for memory region.." << std::endl);
				Sleep(2000);
				memoryRegionStart = (void*)scan_memory((void*)0x05000000, 0x10000000 - 0x05000000, pattern);
			}
			else {
				dbg(dbgl << "Using cached memory region.." << std::endl);
			}

			if (memoryRegionStart == nullptr) {
				MessageBox(nullptr, "Error", "Could not find Memory-Section.\r\nRestart WC3", MB_ICONERROR);
				break;
			} else {
				dbg(dbgl << "Memory found, ready to record data: " << memoryRegionStart <<std::endl);
				enum EStates {
					WAITING_FOR_GAME,
					GAME_STARTED,
					FRAME_FLUSHED,
					GAME_RUNNING,
					GAME_ENDED
				};

				const BYTE* bufferStart = (BYTE*)memoryRegionStart + 8 + preZeroBytes;
				const int ENDBUFFER_SIZE = 256;
				BYTE endBuffer[ENDBUFFER_SIZE] = { 0 };

				int position = 0;
				EStates state = WAITING_FOR_GAME;
				while(true) {
					int readBytes = 0;
					const BYTE* startAddress = bufferStart + position;
					for (int i = 0; i < 256; ++i) {
						BYTE b = *(startAddress + i);
						if (b > 0) {
							readBytes = i + 1;
						} else if (readBytes < i - 4) {
							break;
						}
					}

					if (isDebug && readBytes > 0 && writeFile ) {
						stringstream ss;
						ss << "dbg_buffer_after_flush" << flushCounter << ".bin";
						ofstream myFile(ss.str().c_str(), ios::out | ios::binary);
						myFile.write((const char*)bufferStart, 16000);
						myFile.close();
						writeFile = false;
					}
					///
					/// Transist between states
					///
			
					//check if buffer was flushed
					if (state == FRAME_FLUSHED) {
						if (readBytes > 0) {
							vector<BYTE> pattern(endBuffer, endBuffer + ENDBUFFER_SIZE);
							dbg(dbgl << "PATTERN SIZE:" << pattern.size() << std::endl);
							BYTE* patternStart = (BYTE*)scan_memory((void*)bufferStart,16000, pattern);
							dbg(dbgl << "FLUSH POSITION:" << patternStart << std::endl);
							if (patternStart == nullptr) {
								MessageBoxA(nullptr, "Did not find start after flush!", "", 0);
							}
							else {
								patternStart = patternStart + ENDBUFFER_SIZE;
								position = (patternStart - bufferStart);
								state = GAME_RUNNING;
								dbg(dbgl << "new Position after flush:" << position << std::endl);
								continue;
							}
						}

						if (position == 0 && readBytes == 0) {
							state = GAME_ENDED;
						}

					} else if (readBytes == 0 && position > 8) {
						if (*(startAddress - 1) == 0 && *(startAddress - 2) == 0 && *(startAddress - 3) == 0 && *(startAddress - 4) == 0 
							&& *(startAddress - 5) == 0 && *(startAddress - 6) == 0 && *(startAddress - 7) == 0 && *(startAddress - 8) == 0) {
							dbg(dbgl << std::endl << "buffer clearing at:" << position << std::endl);
							position = 0;
							client.sendMessage(string("FLUSH") + std::to_string(++flushCounter));
							state = FRAME_FLUSHED;
							if(isDebug) {
								stringstream ss;
								ss << "dbg_flush" << flushCounter << ".bin";
								writeFile = true;
								ofstream myFile2(ss.str().c_str(), ios::out | ios::binary);
								myFile2.write((const char*)endBuffer, ENDBUFFER_SIZE);
								myFile2.close();
							}

							Sleep(50);

						}
					} else {
						position += readBytes;
						if (position == 0 && readBytes == 0) {
							if(state != WAITING_FOR_GAME) {
								state = GAME_ENDED;
							}
						}
						else {
							state = (state == WAITING_FOR_GAME) ? GAME_STARTED : GAME_RUNNING;
						}
					}

					//keep the last 128 bytes to find the beginning again
					if ( state != FRAME_FLUSHED && position >= ENDBUFFER_SIZE && readBytes > 0) {
						memcpy(&endBuffer, (void*)(bufferStart + position - ENDBUFFER_SIZE), ENDBUFFER_SIZE);
					}
					///
					/// handle states
					///

					switch (state) {
						case WAITING_FOR_GAME: {
							dbg(dbgl << "no game yet" << std::endl);
							Sleep(1000);
						} break;

						case FRAME_FLUSHED: {
							dbg(dbgl << " [" << readBytes << "] ");
							Sleep(33);
						} break;

						case GAME_STARTED: {
							if (isDebug && !recordFile.is_open()) {
								recordFile.open("dbg_fullrecord.bin", ios::binary | ios::out);
							}
							dbg(dbgl << "GAME STARTED!" << std::endl);
							if(!loopBrokenByReconnect) {
								client.sendMessage(string("GAME_STARTED"));
							}
						}
						case GAME_RUNNING: {
							if (readBytes > 0) {
								dbg(dbgl << " " << readBytes << " ");
								client.sendMessage(std::string((const char*)startAddress, readBytes));
								if(isDebug) {
									recordFile.write((const char*)startAddress, readBytes);
								}
							}
							Sleep(33);
						} break;

						case GAME_ENDED: {
							dbg(dbgl << "GAME ENDED!" << std::endl);
							client.sendMessage(string("GAME_ENDED"));
							if(isDebug) {
								recordFile.close();
							}
							state = WAITING_FOR_GAME;
						} break;
					}

					loopBrokenByReconnect = false;
				}
			}
			} catch (...) {
				loopBrokenByReconnect = true;
				if (++reconTries >= 30) {
					MessageBox(nullptr, (conErrMsg + " \n\rRECORDING STOPPED, relaunch the game!").c_str(), "RECORDING STOPPED - RESTART LAUNCHER", MB_OK | MB_ICONERROR);
					break;
				}
				dbg(dbgl << conErrMsg << "! Trying again in 10 seconds..." << std::endl);
				Sleep(10000);
			}
	} while (true);
	MessageBox(nullptr, "RECORDING STOPPED because of the previously shown error\r\n Please restart the game", "RECORDING STOPPED", MB_OK | MB_ICONERROR);
}

BOOL APIENTRY DllMain(HMODULE hModule, DWORD dwReason, LPVOID lpReserved)
{
	if (dwReason == DLL_PROCESS_ATTACH)
	{
		//DWORD baseAddress = (DWORD)GetModuleHandle(NULL);
		//std::ostringstream ss;
		//ss << std::hex << baseAddress;
		//MessageBox(nullptr, "Base Address", ss.str().c_str(), 0);
		CreateThread(0, 0, (LPTHREAD_START_ROUTINE)snip, 0, 0, 0);

	}
	return TRUE;
}