#include "W3ItemManager.h"
#include "W3ListManager.h"
#include "W3ListIterator.h"

CW3ItemManager* CW3ItemManager::s_pInstance = nullptr;

CW3ItemManager& CW3ItemManager::GetInstance()
{
	if (s_pInstance == nullptr) {
		s_pInstance = new CW3ItemManager();
	}
	return *s_pInstance;
}

void CW3ItemManager::RefreshItemList()
{
	ptr listStart = CW3ListManager::GetInstance().GetList(W3List::EType::LIST_ITEMS).refresh().GetFirstElementAddress();
	if (listStart != 0) {
		W3ListIterator<> ItemIterator(listStart);
		do {
			m_AllItems[ItemIterator.GetIdent()] = ItemIterator.GetValueAddress();
		} while (ItemIterator.next());
	}
}

ptr CW3ItemManager::GetItemAddress(ptr _Ident)
{
	if (_Ident == -1 || m_AllItems.find(_Ident) == m_AllItems.end()) {
		return 0;
	}
	return m_AllItems[_Ident];
}

CW3ItemManager::CW3ItemManager()
{
}
