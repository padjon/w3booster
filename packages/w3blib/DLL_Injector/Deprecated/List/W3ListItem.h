#pragma once
#include <Windows.h>
#include <vector>
#include "W3Ability.h"
#include <bitset>
#include "Logger.h"
#include "W3Collections.h"
#include "W3List.h"

abstract class W3ListEntry {
protected:
	struct ListEntryRawData {
		void* extra;
		void* _u1;
		void* prev;
		void* next;
		void* _u2[6];
		void* self1;
		void* _u3[3];
		void* self2;
		void* _u4[4];
		void* details;
	};

	typedef uint64_t THash;

	struct PersistentData {
		THash LastHash = 0;
		THash CurrentHash = 0;
		bool IsFirstSeen = true;
	};


protected:
	static std::unordered_map<void*, PersistentData> s_PersistentData;

protected:
	void* m_Address;
	RawData m_RawData;
	PersistentData* m_pPersistentData;
	std::vector<W3Ability> m_Abilities;

protected:
	
	void W3ListEntry::cleanUp() = 0;

	void W3ListEntry::init(void* pAddress) {
		cleanUp();
		m_Address = pAddress;
		CW3MemoryUtils::GetInstance().GetW3Object<RawData>(pAddress, m_RawData);
		m_pPersistentData = &s_PersistentData[pAddress];
		if (GetDetails().isHero() || GetDetails().GetType() == "hbla") {
			W3Ability ability(m_RawData.extra);
			while (ability.hasPrev()) {
				ability.prev();
			}
			while (ability.hasNext()) {
				ability.next();
				auto& rType = ability.GetType();
				ability.GetDetails();
				if (rType[0] == 'A' && rType[1] != 'I' && isupper(rType[1]) && rType != "AHer" && W3Collections::AbilityTypes.find(rType) != W3Collections::AbilityTypes.end() && rType == ability.GetDetails().GetType()) {
					m_Abilities.push_back(ability);
				}
			}
		}

		THash Hash = CalculateHash();
		if (Hash != m_pPersistentData->CurrentHash) {
			m_pPersistentData->LastHash = m_pPersistentData->CurrentHash;
			m_pPersistentData->CurrentHash = Hash;
		}
	}

public:
	W3ListEntry::W3ListEntry(const W3ListEntry& rUnit) {
		init(rUnit.m_Address);
	}

	W3ListEntry::W3ListEntry(void* pAddress) {
		if (pAddress != nullptr) {
			init(pAddress);
		}
	}

	uint64_t GetIdent() {
		return (uint64_t)m_Address;
	}

	void W3ListEntry::refresh() {
		init(m_Address);
	}

	bool W3ListEntry::hasNext() {
		return m_RawData.next != nullptr;
	}

	bool W3ListEntry::next() {
		if (hasNext()) {
			init((BYTE*)m_RawData.next - 0x08);
			return true;
		}
		return false;
	}

	bool W3ListEntry::hasPrev() {
		return m_RawData.prev != nullptr;
	}

	W3ListEntry& W3ListEntry::prev() {
		init((BYTE*)m_RawData.prev - 0x08);
		return *this;
	}
	
	bool IsFirstSeen() {
		bool IsFirstSeen = m_pPersistentData->IsFirstSeen;
		m_pPersistentData->IsFirstSeen = false;
		return IsFirstSeen;
	}

	bool HasChanged() {
		bool hasChanged = m_pPersistentData->LastHash != m_pPersistentData->CurrentHash;
		m_pPersistentData->LastHash = m_pPersistentData->CurrentHash;
		return hasChanged;
	}

	abstract THash CalculateHash() = 0;
	abstract nlohmann::json Serialize() = 0;

	W3ListEntry::~W3ListEntry() {
		cleanUp();
	}
};