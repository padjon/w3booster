#pragma once
#include "W3MemoryUtils.h"
#include "W3Entity.h"
#include <string>
#include "json.h"
#include "W3ListIterator.h"
#include "W3Player.h"

#pragma pack(push, 1)
struct W3ResourceRawData {
	ptr _u0_next_iterator;
	ptr _u1[3];
	uint64_t _orpglf;
	uint32_t list_index1;
	uint32_t list_index2;
	ptr _u2[5];
	ptr player;
	ptr _u3[4];
	uint32_t _u4;
	uint32_t type;
	ptr _u5[10];
	uint32_t value;
};
#pragma pack(pop)

class W3Resource : public W3Entity<W3ResourceRawData> {

public:
	enum EType {
		GOLD = 1,
		LUMBER = 2,
		SUPPLY = 5,
		SUPPLY_CAP = 4,
		WORKER_SUPPLY = 99,
	};

private:
	union SHashTemplate {
		THash Hash;
		struct {
			uint32_t type;
			uint32_t value;
		} Details;
	};

	char m_TypeCode[4];
	int m_SlotId;

public:
	W3Resource(W3Resource& _rResource) : W3Resource(_rResource.GetAddress()) {};
	W3Resource(ptr _pAddress, ptr _pExtra) : W3Resource(_pAddress) {};
	W3Resource(ptr _pAddress) : W3Entity<W3ResourceRawData>(), m_TypeCode(), m_SlotId(0) {
		InitEntity(_pAddress);
	}

	~W3Resource() {
		CleanUpEntity();
	}

	virtual void Init() {
		m_SlotId = -1;
		auto ListIterator = W3ListIterator<W3Player>(GetPlayerAddress());
		if (std::string(ListIterator.GetType()) == "ylp+") {
			m_SlotId = ListIterator.GetValue().GetSlotId();
		}
	}

	virtual void CleanUp() {
	}



	const EType GetResourceType() {
		return (EType)m_RawData.type;
	}

	const uint32_t GetResourceValue() {
		return m_RawData.value;
	}

	int GetSlotId() {
		return m_SlotId;
	}

	ptr GetRawPlayerPointer() {
		return m_RawData.player;
	}

	ptr GetResolvedPlayerListAddress() {
		return GetPlayerAddress();
	}

	std::string GetResolvedPlayerListType() {
		auto ListIterator = W3ListIterator<W3Player>(GetPlayerAddress());
		return ListIterator.GetType();
	}

	virtual nlohmann::json Serialize() {
		nlohmann::json serialized;
		serialized["id"] = GetIdent();
		serialized["class"] = "W3Resource";
		serialized["type"] = GetResourceType();;
		serialized["slotId"] = m_SlotId;
		serialized["value"] = GetResourceValue();
		return serialized;
	}

protected:
	virtual char_array& InitGetType() {
		m_TypeCode[0] = (char)(GetResourceType() + 48);
		m_TypeCode[1] = 'S';
		m_TypeCode[2] = 'E';
		m_TypeCode[3] = 'R';
		return m_TypeCode;
	}

	virtual uint64_t InitGetId() {
		return ToId(GetRawData().list_index1, GetRawData().list_index2);
	}



	virtual THash CalculateHash() {
		SHashTemplate tpl;
		tpl.Hash = 0;
		tpl.Details.type = GetRawData().type;
		tpl.Details.value = GetRawData().value;
		return tpl.Hash;
	}

private:
	const ptr GetPlayerAddress() {
		return m_RawData.player - sizeof(ptr);
	}
};
