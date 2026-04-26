#pragma once
#include <Windows.h>

namespace w3api
{

	enum EQueueType : byte
	{
		Research = 0,
		Unit = 1,
		Reviving = 2,
	};

#pragma pack(push, 1)
	struct W3QueueRawData {
		UINT Id;
		char Name[100];
		UINT TrainingProgress;
		EQueueType type;
		char ButtonArt[100];
	};
#pragma pack(pop)

	class W3Queue : public W3EntityBase<W3QueueRawData>
	{
	public:
		W3Queue(const W3QueueRawData& _rRawData) :W3EntityBase<W3QueueRawData>(_rRawData) {

		}
	};
};
