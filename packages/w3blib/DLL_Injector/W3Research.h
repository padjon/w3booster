#pragma once
#include "W3MemoryUtils.h"
#include <string>

#pragma pack(push, 1)
struct W3ResearchRawData {
	ptr _u1[10];
	int32_t _u2[2];
	int32_t slotId;
	union {
		char type[0x4];
		uint32_t intType;
	};
	int32_t level;
};
#pragma pack(pop)

class W3Research : public W3Entity<W3ResearchRawData> {
private:
	union SHashTemplate {
		THash Hash;
		struct {
			char ResearchType[4];
			BYTE SlotID;
			BYTE Level;
		} Details;
	};

public:
	W3Research(W3Research& _rResearch) : W3Research(_rResearch.GetAddress()) {};
	W3Research(ptr _pAddress, ptr _pExtra) : W3Research(_pAddress) {};
	W3Research(ptr _pAddress) : W3Entity<W3ResearchRawData>() {
		InitEntity(_pAddress);
	}

	~W3Research() {
		CleanUpEntity();
	}

	virtual void Init() {

	}

	virtual void CleanUp() {

	}

	BYTE GetSlotId() {
		return GetRawData().slotId;
	}

	BYTE GetLevel() {
		return GetRawData().level;
	}

	virtual nlohmann::json Serialize() {
		nlohmann::json serialized;
		serialized["id"] = GetIdent();
		serialized["class"] = "W3Research";
		serialized["type"] = GetType();
		serialized["slotId"] = GetSlotId();
		serialized["level"] = GetLevel();
		return serialized;
	}

protected:
	virtual char_array& InitGetType() {
		return GetRawData().type;
	}

	virtual uint64_t InitGetId() {
		return ToId(GetRawData().slotId, GetTypeAsInt());
	}

	virtual THash CalculateHash() {
		SHashTemplate tpl;
		tpl.Hash = 0;
		tpl.Details.SlotID = GetSlotId();
		memcpy(tpl.Details.ResearchType, GetType().c_str(), sizeof(tpl.Details.ResearchType));
		tpl.Details.Level = GetLevel();
		return tpl.Hash;
	}
};
