#pragma once
#include "W3MemoryUtils.h"
#include <string>
#include "W3Entity.h"
#include "W3AbilityIterator.h"
#include "W3AbilitySkill.h"
#include "W3AbilityHero.h"
#include "W3Collections.h"
#include "W3EntityWithoutChangeDetection.h"
#include <iomanip>
#include <sstream>

#pragma pack(push, 1)
struct W3ControlGroupsRawData {
	struct {
		ptr _u1[2];
		ptr listEnd;
		ptr listStart;
		union {
			ptr _u3;
			uint32_t groupSize;
		};
	} currentGroup;
	struct {
		ptr _u1[2];
		ptr listEnd;
		ptr listStart;
		union {
			ptr _u3;
			uint32_t groupSize;
		};
	} commandGroups[10];
};
#pragma pack(pop)

class W3ControlGroups : public W3Entity<W3ControlGroupsRawData> {
private:
	union SHashTemplate {
		THash Hash;
	};

	int m_SlotId;
	std::string m_Name;

private:
	struct SGroup {
		std::string frontunit;
		int size = 0;
		int hash = 0;
	}m_Groups[10];

	struct SGroupEntityIterator {
		ptr prev;
		ptr next;
		ptr groupEntity;
	};

public:
	W3ControlGroups(W3ControlGroups& _rControlGroups) : W3ControlGroups(_rControlGroups.GetAddress()) {};
	W3ControlGroups(ptr _pAddress, ptr _pExtra) : W3ControlGroups(_pAddress) {};
	W3ControlGroups(ptr _pAddress) : W3Entity<W3ControlGroupsRawData>(), m_SlotId(0), m_Name("") {
		InitEntity(_pAddress);
	}

	~W3ControlGroups() {
		CleanUpEntity();
	}

	virtual void Init() {
		for (int i = 0; i < 10; i++) {
			auto& rGroup = m_Groups[i];
			auto& rRawGroup = m_RawData.commandGroups[i];
			rGroup.size = 0;
			rGroup.frontunit = "";
			rGroup.hash = 0;
			if (rRawGroup.groupSize > 0) {
				SGroupEntityIterator it;
				ptr currentAddress = rRawGroup.listStart;
				int CicrcuitBreaker = 0;
				while (currentAddress != 0 && CW3MemoryUtils::GetInstance().GetW3Object<SGroupEntityIterator>(currentAddress, it)) {
					W3EntityWithoutChangeDetection<W3Unit> Unit(it.groupEntity);
					if (Unit.isAlive()) {
						rGroup.size++;
						if (rGroup.frontunit == "") {
							rGroup.frontunit = Unit.GetType();
							rGroup.hash = Unit.GetTypeAsInt();
						}
					}
					rGroup.hash += rGroup.size;
					currentAddress = ((currentAddress == rRawGroup.listEnd) ? 0 : it.next);
				}
			}
		}
	}

	virtual void CleanUp() {

	}


	virtual nlohmann::json Serialize() {
		nlohmann::json serialized;
		for (int i = 0; i < 10; i++) {
			if (m_Groups[i].size > 0) {
				auto& rGroup = serialized[std::to_string(i)];
				rGroup["size"] = m_Groups[i].size;
				rGroup["frontunit"] = m_Groups[i].frontunit;
			}
		}
		return serialized;
	}

protected:
	virtual char_array& InitGetType() {
		return "CGR";
	}

	virtual uint64_t InitGetId() {
		return GetAddress();
	}

	virtual THash CalculateHash() {
		SHashTemplate tpl;
		tpl.Hash = 0;
		for (int i = 0; i < 10; i++) {
			tpl.Hash += (i + 1) * m_Groups[i].hash;
		}
		return tpl.Hash;
	}
};
