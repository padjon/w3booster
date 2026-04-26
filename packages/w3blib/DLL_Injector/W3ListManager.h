#pragma once
#include <string>
#include "W3List.h"
#include <unordered_set>
#include <unordered_map>

class CW3ListManager {

public:
	static CW3ListManager& Initialize(ptr _pListAddress);
	static bool IsValid();
	static CW3ListManager& GetInstance();

public:
	W3List& GetList(W3List::EType _Type);

private:
	CW3ListManager(ptr _pListAddress);
	void Init(ptr _pListAddress);
	static std::unordered_set<W3List::EType> s_RelevantListsSet;

private:
	static CW3ListManager* s_pInstance;
	ptr m_ListAddress;
	std::unordered_map<W3List::EType, W3List> m_TypeToListMap;
};
