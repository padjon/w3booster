#pragma once
#include <Windows.h>
#include <vector>
#include "W3Ability.h"
#include <bitset>
#include "Logger.h"
#include "W3Collections.h"
#include "W3List.h"

class W3ListIterator {
protected:
	struct RawData {
		ptr extra;
		ptr _u1;
		ptr prev;
		ptr next;
		ptr _u2[4];
		int32_t _u3[4];
		ptr self1;
		ptr _u4[3];
		ptr self2;
		int32_t _u5[2];
		ptr _u6[3];
		ptr details;
	};

	typedef uint64_t THash;

	struct PersistentData {
		THash LastHash = 0;
		THash CurrentHash = 0;
		std::unordered_set<ptr> AlreadySeenSet;
	};

protected:
	ptr m_Address;
	RawData m_RawData;

protected:
	virtual void W3ListIterator::init(ptr pAddress) = 0;

public:
	W3ListIterator()  {}

	void W3ListIterator::refresh() {
		init(m_Address);
	}

	bool W3ListIterator::hasNext() {
		return m_RawData.next != 0;
	}

	bool W3ListIterator::next() {
		if (hasNext()) {
			init(m_RawData.next - ptr_size);
			return true;
		}
		return false;
	}

	bool W3ListIterator::hasPrev() {
		return m_RawData.prev != 0;
	}

	W3ListIterator& W3ListIterator::prev() {
		init(m_RawData.prev - ptr_size);
		return *this;
	}
};