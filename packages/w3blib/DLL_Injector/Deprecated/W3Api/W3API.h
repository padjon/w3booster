#pragma once
#include <Windows.h>
#include "W3Game.h"
#include "W3EntityBase.h"
#include "../Logger.h"


#pragma pack(push, 1)
	struct W3APIRawData {
		unsigned int Version;
		unsigned int RefreshRate;
		w3api::W3GameRawData RawGame;
	};
#pragma pack(pop)

class W3API: public w3api::W3EntityBase<W3APIRawData>
{
private:
	static W3API* s_pInstance;
	static HANDLE s_hAPIFileMapping;

	W3API(const W3APIRawData& _rW3APIRawData):w3api::W3EntityBase<W3APIRawData>(_rW3APIRawData), Game($.RawGame) {
	}

public:
	static W3API* GetAPI() {
		if (s_pInstance == nullptr) {
			s_hAPIFileMapping = OpenFileMapping(FILE_MAP_ALL_ACCESS, false, "War3StatsObserverSharedMemory");
			if (s_hAPIFileMapping != nullptr) {

				W3APIRawData* pData = (W3APIRawData*)MapViewOfFile(s_hAPIFileMapping, FILE_MAP_ALL_ACCESS, 0, 0, sizeof(W3APIRawData));
				if (pData) {
					s_pInstance = new W3API(*pData);
					s_pInstance->SetRefreshRate(2000);
				}
			}
		}
		return s_pInstance;
	}

	static std::string DBG_lastResult;
	static void DEBUG_CheckAPI() {
		HANDLE hAPIFileMapping = OpenFileMapping(FILE_MAP_ALL_ACCESS, false, "War3StatsObserverSharedMemory");
		std::stringstream ss;
		ss << "OAPI: " << ((hAPIFileMapping != 0) ? "OK" : "NOK") << " ERR: " << GetLastError();
		if (ss.str() != DBG_lastResult) {
			CLogger::Log << ss.str() << CLogger::END;
			DBG_lastResult = ss.str();
		}
		
		if (hAPIFileMapping != nullptr) {
			CloseHandle(hAPIFileMapping);
		}
	}

public:
	w3api::W3Game Game;

	static void Release() {
		if (s_pInstance != nullptr) {
			delete s_pInstance;
			s_pInstance = nullptr;
		}

		if(s_hAPIFileMapping != nullptr) {
			CloseHandle(s_hAPIFileMapping);
			s_hAPIFileMapping = nullptr;
			CLogger::Log << "Released Observer API handle..." << CLogger::END;
		}
	}

	virtual UINT64 CalculateChangeDetectionHash() {
		return Game->GameTime;
	}

	bool IsGameRunning() const {
		return Game->IsIngame != 0;
	};

	bool IsCurrentGameSupported() const {
		bool Supported = IsGameRunning();
		if (Supported) {
			for (int i = 0; i < Game->ActivePlayersCount; i++) {
				Supported &= !std::string(Game.Players[i]->Name).empty();
			}
		}
		return Supported;
	};

	unsigned int GetVersion() const {
		return $.Version;
	};

	unsigned int GetRefreshRate() const {
		return $.RefreshRate;
	}

	unsigned int SetRefreshRate(unsigned int _RefreshRate) const {
		return ((W3APIRawData*)&$)->RefreshRate = _RefreshRate;
	}

};
