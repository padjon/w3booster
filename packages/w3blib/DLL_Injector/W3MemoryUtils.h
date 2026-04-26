#pragma once
#include <vector>
#include <map>
#include <unordered_map>
#include <Windows.h>
#include "W3Process.h"

#ifdef WC3X86
typedef uint32_t ptr;
const int ptr_size = sizeof(uint32_t);
#else
	typedef uint64_t ptr;
	const int ptr_size = sizeof(uint64_t);
#endif

class CW3MemoryUtils {
public:
	enum ESequence {
		MAPNAME,
		GAMETIME,
		LISTS,
		RESOURCE_LIST,
//		REALM,
		COLORMODE,
		CURRENTSLOT,
		W3STATE,
		CHATBAR_STATE,
		WAR3LOG_TXT_PATH,
		HUD_SCALE,
		GAMENAME
	};

	struct SSequence {
		SSequence() : type(MAPNAME), sequence(), sequenceMask(), offset(0), followFoundAddressAsPointer(false), address(0), onlyAtStartRegion(false), searchOffset(0), memoryRegionMinSize(0) {};
		ESequence type;
		std::vector<BYTE> sequence;
		std::vector<bool> sequenceMask;
		int offset;
		bool followFoundAddressAsPointer;
		ptr address;
		bool onlyAtStartRegion;
		int searchOffset;
		int memoryRegionMinSize;
	};

public:
	static CW3MemoryUtils& GetInstance();
	static int SearchBuffer(char* _Haystack, SIZE_T _Haystacklen, char* needle, SIZE_T _Needlelen);
	template <class T>
	static bool GetW3Object(ptr _pAddress, T& _rBuffer);

public:
	CW3MemoryUtils();
	void InitSequences();
	SSequence& GetSequence(ESequence _SequenceType);

public:
	bool FindW3Addresses(std::vector<ESequence>& _SequenceIds, bool _CleanBefore);
	bool GetNeteasePlayerIds(std::unordered_map<std::string, int>& _rPlayerIdMap);
	bool Initialize();

private:
	static CW3MemoryUtils* s_pInstance;

private:
	std::map<ESequence, SSequence> m_SequenceMap;
	ptr m_ModuleBaseAddress;
};

template<class T>
inline bool CW3MemoryUtils::GetW3Object(ptr _pAddress, T& _rBuffer)
{
	SIZE_T objectSize = sizeof(T);
	SIZE_T readChunkBytes = 0;
	ZeroMemory(&_rBuffer, objectSize);
	if (_pAddress == 0) {
		return false;
	}
	if(!ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)_pAddress, &_rBuffer, objectSize, &readChunkBytes) || readChunkBytes < objectSize) {
		return false;
	}
	return true;
}
