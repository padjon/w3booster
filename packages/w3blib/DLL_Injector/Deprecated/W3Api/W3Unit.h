#pragma once
#include <Windows.h>

namespace w3api
{

#pragma pack(push, 1)
	struct W3UnitRawData {
		UINT Id;
		char Name[100];
		UINT OwnerId;
		UINT CurrentAmount;
		UINT TotalAmount;
		char ButtonArt[100];
		BYTE IsWorker;
		BYTE IsFunctionalWorker;
		UINT DamageDealt;
		UINT DamageReceived;
		UINT HealingDone;
	};
#pragma pack(pop)

	class W3Unit : public W3EntityBase<W3UnitRawData>
	{
	public:
		W3Unit(const W3UnitRawData _rRawData) :W3EntityBase<W3UnitRawData>(_rRawData) {

		}
	};
};
