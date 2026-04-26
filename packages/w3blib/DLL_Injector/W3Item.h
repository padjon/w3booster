#pragma once
#include "W3MemoryUtils.h"
#include "W3Entity.h"
#include <string>
#include "json.h"

#pragma pack(push, 1)
struct W3ItemRawData {
	ptr _u1[3];
	ptr id;
	ptr _u2[10];
	char type[0x4];
	char name[0x40];
};
#pragma pack(pop)

class W3Item : public W3Entity<W3ItemRawData> {
private:
	union SHashTemplate {
		THash Hash;
		struct {
			uint32_t type;
		} Details;
	};

public:
	W3Item(W3Item& _rResearch) : W3Item(_rResearch.GetAddress()) {};
	W3Item(ptr _pAddress, ptr _pExtra) : W3Item(_pAddress) {};
	W3Item(ptr _pAddress) : W3Entity<W3ItemRawData>() {
		InitEntity(_pAddress);
	}

	~W3Item() {
		CleanUpEntity();
	}

	virtual void Init() {
		// m_Id = m_RawData.id;
	}

	virtual void CleanUp() {
	}

	virtual nlohmann::json Serialize() {
		nlohmann::json serialized;
		serialized["id"] = GetIdent();
		serialized["class"] = "W3Item";
		serialized["type"] = GetType();
		return serialized;
	}

protected:
	virtual char_array& InitGetType() {
		return GetRawData().type;
	}

	virtual uint64_t InitGetId() {
		return ToId(m_RawData.id, GetTypeAsInt());
	}

	virtual THash CalculateHash() {
		SHashTemplate tpl;
		tpl.Hash = 0;
		tpl.Details.type = GetTypeAsInt();
		return tpl.Hash;
	}
};
