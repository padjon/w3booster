#pragma once
#include <Windows.h>

namespace w3api
{

#pragma pack(push, 1)
	struct W3UpgradeRawData {
		UINT Id;
		char Name[100];
		UINT CurrentLevel;
		UINT MaxLevel;
		UINT UpgradeProgress;
		char ButtonArt[100];
	};
#pragma pack(pop)

	class W3Upgrade: public W3EntityBase<W3UpgradeRawData>
	{
	public:
		W3Upgrade(const W3UpgradeRawData& _rRawData) :W3EntityBase<W3UpgradeRawData>(_rRawData) {

		}
	};
};
