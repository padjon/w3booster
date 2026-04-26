#pragma once
#include <list>
#include "W3MemoryUtils.h"
#include "W3Process.h"
#include "Logger.h"
#include <unordered_map>
#include "W3Reverse.h"

CW3MemoryUtils* CW3MemoryUtils::s_pInstance(nullptr);

CW3MemoryUtils& CW3MemoryUtils::GetInstance()
{
	if (s_pInstance == nullptr) {
		s_pInstance = new CW3MemoryUtils();
	}
	return *s_pInstance;
}


CW3MemoryUtils::CW3MemoryUtils() : m_SequenceMap(), m_ModuleBaseAddress(0)
{
}


void CW3MemoryUtils::InitSequences()
{
	m_SequenceMap.clear();

	m_SequenceMap[CW3MemoryUtils::ESequence::MAPNAME].type = CW3MemoryUtils::ESequence::MAPNAME;
	m_SequenceMap[CW3MemoryUtils::ESequence::GAMETIME].type = CW3MemoryUtils::ESequence::GAMETIME;
	m_SequenceMap[CW3MemoryUtils::ESequence::CURRENTSLOT].type = CW3MemoryUtils::ESequence::CURRENTSLOT;
	m_SequenceMap[CW3MemoryUtils::ESequence::W3STATE].type = CW3MemoryUtils::ESequence::W3STATE;
	m_SequenceMap[CW3MemoryUtils::ESequence::CHATBAR_STATE].type = CW3MemoryUtils::ESequence::CHATBAR_STATE;
	m_SequenceMap[CW3MemoryUtils::ESequence::COLORMODE].type = CW3MemoryUtils::ESequence::COLORMODE;
	m_SequenceMap[CW3MemoryUtils::ESequence::WAR3LOG_TXT_PATH].type = CW3MemoryUtils::ESequence::WAR3LOG_TXT_PATH;
	m_SequenceMap[CW3MemoryUtils::ESequence::HUD_SCALE].type = CW3MemoryUtils::ESequence::HUD_SCALE;

		m_SequenceMap[CW3MemoryUtils::ESequence::MAPNAME].address = m_ModuleBaseAddress + W3REVERSE::OFFSET_MAPNAME;
	m_SequenceMap[CW3MemoryUtils::ESequence::GAMETIME].address = m_ModuleBaseAddress + W3REVERSE::OFFSET_GAMETIME;
	m_SequenceMap[CW3MemoryUtils::ESequence::CHATBAR_STATE].address = m_ModuleBaseAddress + W3REVERSE::OFFSET_CHATBAR_STATE;
	m_SequenceMap[CW3MemoryUtils::ESequence::COLORMODE].address = m_ModuleBaseAddress + W3REVERSE::OFFSET_COLORMODE;
	m_SequenceMap[CW3MemoryUtils::ESequence::W3STATE].address = m_ModuleBaseAddress + W3REVERSE::OFFSET_W3STATE;
	m_SequenceMap[CW3MemoryUtils::ESequence::CURRENTSLOT].address = m_ModuleBaseAddress + W3REVERSE::OFFSET_CURRENTSLOT;

	m_SequenceMap[CW3MemoryUtils::ESequence::WAR3LOG_TXT_PATH].address = m_ModuleBaseAddress + W3REVERSE::OFFSET_WAR3LOG_TXT_PATH;
	m_SequenceMap[CW3MemoryUtils::ESequence::HUD_SCALE].address = m_ModuleBaseAddress + W3REVERSE::OFFSET_HUDSCALE;

	m_SequenceMap[CW3MemoryUtils::ESequence::LISTS].type = CW3MemoryUtils::ESequence::LISTS;
	m_SequenceMap[CW3MemoryUtils::ESequence::LISTS].sequence = { 'f', 'd', 'a', '^', 'f', 'd', 'a', '^' };
	m_SequenceMap[CW3MemoryUtils::ESequence::LISTS].offset = -(4 * ptr_size);
	m_SequenceMap[CW3MemoryUtils::ESequence::LISTS].searchOffset = -1;
	m_SequenceMap[CW3MemoryUtils::ESequence::LISTS].followFoundAddressAsPointer = false;

	ptr GamenameSearchPattern = m_ModuleBaseAddress + W3REVERSE::VALUE_GAMENAME_SEARCHPATTERN;
	m_SequenceMap[CW3MemoryUtils::ESequence::GAMENAME].type = CW3MemoryUtils::ESequence::GAMENAME;
	m_SequenceMap[CW3MemoryUtils::ESequence::GAMENAME].sequence = std::vector<BYTE>(sizeof(GamenameSearchPattern));
	std::memcpy(m_SequenceMap[CW3MemoryUtils::ESequence::GAMENAME].sequence.data(), &GamenameSearchPattern, sizeof(GamenameSearchPattern));
	m_SequenceMap[CW3MemoryUtils::ESequence::GAMENAME].offset = W3REVERSE::VALUE_GAMENAME_PATTERN_OFFSET;
	m_SequenceMap[CW3MemoryUtils::ESequence::GAMENAME].searchOffset = -1;
	m_SequenceMap[CW3MemoryUtils::ESequence::GAMENAME].followFoundAddressAsPointer = false;

	m_SequenceMap[CW3MemoryUtils::ESequence::RESOURCE_LIST].type = CW3MemoryUtils::ESequence::RESOURCE_LIST;
	m_SequenceMap[CW3MemoryUtils::ESequence::RESOURCE_LIST].sequence = { 'o', 'r', 'p', '^', 'g', 'l', 'f', '`', 0xc9, 0x03, 0x00, 0x00, 0xc9, 0x03, 0x00, 0x00 };
	m_SequenceMap[CW3MemoryUtils::ESequence::RESOURCE_LIST].offset = -(5 * ptr_size);
	m_SequenceMap[CW3MemoryUtils::ESequence::RESOURCE_LIST].searchOffset = -1;
	m_SequenceMap[CW3MemoryUtils::ESequence::RESOURCE_LIST].followFoundAddressAsPointer = false;
}

CW3MemoryUtils::SSequence& CW3MemoryUtils::GetSequence(ESequence _SequenceType)
{
	return m_SequenceMap[_SequenceType];
}


int CW3MemoryUtils::SearchBuffer(char* _Haystack, SIZE_T _Haystacklen, char* _Needle, SIZE_T _Needlelen)
{   /* warning: O(n^2) */
	const int origLen = _Haystacklen - _Needlelen + 1;
	int searchlen = origLen;
	for (; searchlen-- > 0; _Haystack++)
		if (!memcmp(_Haystack, _Needle, _Needlelen))
			return origLen - searchlen - 1;
	return -1;
}


bool CW3MemoryUtils::FindW3Addresses(std::vector<ESequence>& _SequenceIds, bool _CleanBefore) {
	int64_t nextMemoryStartAddress = 0;
	MEMORY_BASIC_INFORMATION mbi;
	bool run = true;

	std::list<SSequence*> sequences;
	for (auto Sequence : _SequenceIds) {
		sequences.push_back(&GetSequence(Sequence));
	}

	const int bufferSize = 0x8000;
	BYTE nbuffer[bufferSize] = { 0 };
	SIZE_T rb = 0;
	while (run) {
		run = VirtualQueryEx(CW3Process::GetInstance().GetProcessHandle(), (LPCVOID)nextMemoryStartAddress, &mbi, sizeof(MEMORY_BASIC_INFORMATION));
		nextMemoryStartAddress = ((uint64_t)mbi.BaseAddress + (uint64_t)mbi.RegionSize);
		uint64_t startAddress = (uint64_t)mbi.BaseAddress;
		uint64_t nextAddress = (uint64_t)mbi.BaseAddress;
		uint64_t lastPossibleAddress = ((uint64_t)mbi.BaseAddress + (uint64_t)mbi.RegionSize - 1);
		while (run && startAddress < lastPossibleAddress) {
			uint64_t maxReadSize = min(bufferSize, (uint64_t)lastPossibleAddress - startAddress);
			ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (LPCVOID)startAddress, nbuffer, maxReadSize, &rb);
			nextAddress = startAddress + maxReadSize;
			if (rb > 0) {
				auto it = sequences.begin();
				while ( it != sequences.end()) {
					auto& rSequence = **it;
					it++;

					if (rSequence.memoryRegionMinSize > mbi.RegionSize) {
						continue;
					}

					int64_t offset = 0;
					bool found = false;
					if (rSequence.searchOffset < 0) {
						offset = SearchBuffer((char*)& nbuffer, rb, (char*)rSequence.sequence.data(), rSequence.sequence.size());
						if (offset >= 0) {
							offset = (int64_t)(offset + rSequence.offset);
							found = true;
						}
					}
					else {
						for (int searchOffset = rSequence.searchOffset; searchOffset < rb; searchOffset += 0x100) {

							if (memcmp(rSequence.sequence.data(), nbuffer + searchOffset, rSequence.sequence.size()) == 0) {
								offset = (int64_t)(searchOffset + rSequence.offset);
								found = true;
							}

							if (rSequence.onlyAtStartRegion || found) {
								break;
							}
						}
					}

					if (found) {
						

						if (!rSequence.followFoundAddressAsPointer) {
							rSequence.address = startAddress + offset;
						}
						else {
							memcpy(&rSequence.address, &nbuffer[offset], ptr_size);
						}
						sequences.remove(&rSequence);
					}
				}
			}
			run &= sequences.size() > 0;
			if (mbi.RegionSize > 0x200000) {
				break;
			}
			startAddress = nextAddress;
		}
	}
	/*
	for (auto& rSequence : sequences) {
		CLogger::Log <<"Info-ID:" << rSequence->type << CLogger::END;
	}*/
	return sequences.size() == 0;
}

bool CW3MemoryUtils::GetNeteasePlayerIds(std::unordered_map<std::string, int>& _rPlayerIdMap)
{
	int BUF_SIZE = 0xc89000;
	HANDLE hMapFile;
	LPCTSTR pOrigBuf;
	LPCTSTR pBuf;
	std::stringstream ss;
	ss << "dotnetfranewerkt" << CW3Process::GetInstance().GetPID();
	hMapFile = OpenFileMapping( FILE_MAP_READ, FALSE, TEXT(ss.str().c_str()));
	if (hMapFile == NULL) {
		return false;
	}

	pOrigBuf = (LPTSTR)MapViewOfFile(hMapFile, FILE_MAP_READ, 0, 0, BUF_SIZE);
	if (pOrigBuf == NULL) {
		CloseHandle(hMapFile);
		return false;
	}

	int found = 0;
	for(auto it : _rPlayerIdMap) {
		std::string name = it.first;
		int size = BUF_SIZE;
		int result = 0;
		ptr id = 0;
		pBuf = pOrigBuf;
		while (result >= 0) {
			result = CW3MemoryUtils::SearchBuffer((char*)pBuf, size, (char*)name.c_str(), name.length());
			if (result >= 0) {
				int len = name.length();
				if (memcmp(pBuf + result, pBuf + result + 76, len) == 0) {
					int id = 0;
					memcpy(&id, pBuf + result + 68, sizeof(id));
					_rPlayerIdMap[name] = id;
					found++;
					break;
				}
				pBuf += result + len;
				size -= (result + len);
			}
		}
	}
	UnmapViewOfFile(pOrigBuf);
	CloseHandle(hMapFile);
	return found == _rPlayerIdMap.size();
}


bool CW3MemoryUtils::Initialize() {
	m_ModuleBaseAddress = (ptr) CW3Process::GetInstance().GetModuleBaseAddress();
	if(m_ModuleBaseAddress != 0) {
#ifdef W3BDBG
		CLogger::Log << "War3.exe Module Base Address:" << std::hex << CW3Process::GetInstance().GetModuleBaseAddress() << std::dec << CLogger::END;
#endif // W3BDBG
		InitSequences();
		return true;
	}
	else {
		return false;
	}
}
