#pragma once
#include <Windows.h>

namespace w3api
{

#pragma pack(push, 1)
	struct W3StructureRawData {
		UINT Id;
		char Name[100];
		UINT ConstructionProgress;
		UINT UpgradeProgress;
		char ButtonArt[100];
	};
#pragma pack(pop)

	class W3Structure: public W3EntityBase<W3StructureRawData>
	{
	public:
		W3Structure(const W3StructureRawData& _rRawData) : W3EntityBase<W3StructureRawData>(_rRawData){

		}
	};
};
