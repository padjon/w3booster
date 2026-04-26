#pragma once
#include <string>
#include <unordered_set>
#include <unordered_map>
#include "W3MemoryUtils.h"
#include "W3Item.h"

class CW3ItemManager {

public:
	static CW3ItemManager& GetInstance();
	void RefreshItemList();
	ptr GetItemAddress(ptr _Ident);


private:
	static CW3ItemManager* s_pInstance;

private:
	CW3ItemManager();

private:
	std::unordered_map<ptr, ptr> m_AllItems;

};