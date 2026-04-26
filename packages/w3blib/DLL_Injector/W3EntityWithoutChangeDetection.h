#pragma once
#include "W3MemoryUtils.h"
#include <string>
#include "W3Entity.h"
#include "W3AbilityIterator.h"
#include "W3Unit.h"

template <class T> class W3EntityWithoutChangeDetection : public T {

public:
	W3EntityWithoutChangeDetection(ptr _pAddress) : T(0) {
		InitEntity(_pAddress);
	};

protected:
	virtual THash CalculateHash() {
		return m_pPersistentData->CurrentHash;
	}
};
