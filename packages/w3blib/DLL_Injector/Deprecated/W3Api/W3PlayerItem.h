#pragma once
#include "W3EntityBase.h"

namespace w3api
{

#pragma pack(push, 1)
	struct W3PlayerItemRawData {
		UINT Id;
		char Name[100];
		UINT ItemLevel;
		UINT Collected;
		UINT Purchased;
		UINT Sold;
		UINT Used;
		UINT Destroyed;
		UINT DamageDealt;
		UINT HealingDone;
	};
#pragma pack(pop)

	class W3PlayerItem : public W3EntityBase<W3PlayerItemRawData>
	{
	public:

		W3PlayerItem(const W3PlayerItemRawData& _rRawData) :W3EntityBase<W3PlayerItemRawData>(_rRawData) {

		}

		UINT64 CalculateChangeDetectionHash() {
			UINT64 Hash = 0;
			return 0;
		};
	};
};
