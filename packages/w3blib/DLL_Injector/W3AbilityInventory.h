#pragma once
#pragma once
#include "W3MemoryUtils.h"
#include "W3Ability.h"
#include "W3Entity.h"
#include "W3ItemManager.h"
#include "json.h"

typedef std::string TItems[6];

#pragma pack(push, 1)
struct W3AbilityInventoryRawData {
	AbilityHeader _header;
	uint32_t _u1[14];
	struct {
		uint64_t id;
		uint32_t _u1;
	}items[6];
};
#pragma pack(pop)

class W3AbilityInventory : public W3Entity<W3AbilityInventoryRawData> {
private:
	std::string m_Items[6];

public:
	W3AbilityInventory(ptr _pAddress) : W3Entity(), m_Items() {
		InitEntity(_pAddress);
	}

	~W3AbilityInventory() {
		CleanUpEntity();
	}

	virtual void Init() {
		for (int i = 0; i < 6; i++) {
			ptr ItemAddress = CW3ItemManager::GetInstance().GetItemAddress(m_RawData.items[i].id);
			m_Items[i] = (ItemAddress == 0) ? "" : W3Item(ItemAddress).GetType();
		}
	}

	virtual void CleanUp() {
	}

	TItems& GetItems() {
		return m_Items;
	}

	char_array& InitGetType() {
		return GetRawData()._header.type;
	};

	uint64_t InitGetId() {
		return m_Address;
	}

	virtual THash CalculateHash() {
		THash hash = 0;
		for (int i = 0; i < 6; i++) {
			hash += (m_RawData.items[i].id * i);
		}
		return hash;
	};


	virtual nlohmann::json Serialize() {
		nlohmann::json serialized = nlohmann::json::array();
		for (const auto& rItem : m_Items) {
			serialized.push_back(rItem);
		}
		return serialized;
	}
};
