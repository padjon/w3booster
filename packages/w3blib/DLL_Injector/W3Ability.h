#pragma once
#include "W3MemoryUtils.h"

#pragma pack(push, 1)
struct AbilityHeader {
	ptr _u1[7];
	union {
		ptr _u2;
		struct {
			BYTE _u3;
			BYTE cooldownIndicator;
		};	
	};
	ptr _u4;
	uint32_t _u5[6];
	ptr _u6[2];
	char type[0x4];
	uint32_t _u7[10];
};
#pragma pack(pop)
