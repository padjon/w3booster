#pragma once
#include "W3EntityBase.h"

namespace w3api
{

#pragma pack(push, 1)
	struct W3ItemRawData {
		UINT Id;
		char Name[100];
		UINT Slot;
		UINT Charges;
		char ButtonArt[100];
	};
#pragma pack(pop)

	class W3Item: public W3EntityBase<W3ItemRawData>
	{
	public:
		
		W3Item(const W3ItemRawData& _rRawData) :W3EntityBase<W3ItemRawData>(_rRawData) {

		}

		UINT64 CalculateChangeDetectionHash() {
			UINT64 Hash = 0;
			return $.Slot + $.Id;
		};

		nlohmann::json w3api::W3Item::SerializeChanges() const
		{
			return GetStringId();
		}
	};
};
