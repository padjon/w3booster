#include "W3ListManager.h"
#include "Logger.h"

std::unordered_set<W3List::EType> CW3ListManager::s_RelevantListsSet = { W3List::EType::LIST_ITEMS, W3List::EType::LIST_UNITS, W3List::EType::LIST_RESEARCH, W3List::EType::LIST_PLAYERS };
CW3ListManager* CW3ListManager::s_pInstance = nullptr;

CW3ListManager& CW3ListManager::Initialize(ptr _pListAddress)
{
	if (s_pInstance == nullptr) {
		s_pInstance = new CW3ListManager(_pListAddress);
	}
	else {
		s_pInstance->Init(_pListAddress);
	}
	return GetInstance();
}

bool CW3ListManager::IsValid()
{
	if (s_pInstance == nullptr || s_pInstance->m_TypeToListMap.size() != s_RelevantListsSet.size() ) {
		return false;
	}
	
	for (auto& rListPair : s_pInstance->m_TypeToListMap) {
		auto& rList = rListPair.second;
		if (rList.refresh().GetType() != rListPair.first) {
			return false;
		}
	}

	return true;
}

CW3ListManager& CW3ListManager::GetInstance()
{
	return *s_pInstance;
}

CW3ListManager::CW3ListManager(ptr _pListAddress) : m_ListAddress(0), m_TypeToListMap()
{
	Init(_pListAddress);
}

void CW3ListManager::Init(ptr _pListAddress)
{
	if (_pListAddress == 0) {
		m_ListAddress = 0;
		m_TypeToListMap.clear();
		return;
	}
	
	m_ListAddress = _pListAddress;
	m_TypeToListMap.clear();
	W3List list(_pListAddress);
	while (list.hasPrev()) {
		list.prev();
	}

	while (list.hasNext()) {
		list.next();
		if (s_RelevantListsSet.find(list.GetType()) != s_RelevantListsSet.end()) {
			m_TypeToListMap.emplace(list.GetType(), list);
			if (m_TypeToListMap.size() == s_RelevantListsSet.size()) {
				break;
			}
		}
	}

#ifdef W3BDBG
	static bool DbgWasPrinted = false;
	if (!DbgWasPrinted) {
		DbgWasPrinted = true;
	
		while (list.hasPrev()) {
			list.prev();
		}

		while (list.hasNext()) {
			list.next();
			if (list.GetFirstElementAddress() != 0) {
				char NameBuffer[5] = { '\0' };
				SIZE_T readChunkBytes;
				ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), ((BYTE*)list.GetFirstElementAddress()) + 36, &NameBuffer, 4, &readChunkBytes);

				CLogger::Log << "LIST-DBG ( " << NameBuffer << " ): " << std::hex << list.GetType() << std::dec << CLogger::END;

				if (_stricmp(NameBuffer, "puW+") == 0 || // LIST_RESEARCH
					_stricmp(NameBuffer, "u3w+") == 0 || // LIST_UNITS
					_stricmp(NameBuffer, "meti") == 0 || // LIST_ITEMS
					_stricmp(NameBuffer, "ylp+") == 0) // LIST_PLAYERS
				{
					CLogger::Log << "LIST-DBG ( " << NameBuffer << " ): " << std::hex << list.GetType() << std::dec << CLogger::END;
				}
			}
		}
	}
#endif // W3BDBG
}

W3List& CW3ListManager::GetList(W3List::EType _Type)
{
	auto it = m_TypeToListMap.find(_Type);
	if (it == m_TypeToListMap.end() && m_ListAddress != 0) {
		Init(m_ListAddress);
		it = m_TypeToListMap.find(_Type);
	}

	if (it == m_TypeToListMap.end()) {
		static W3List EmptyList(0);
		return EmptyList;
	}

	return it->second;
}
