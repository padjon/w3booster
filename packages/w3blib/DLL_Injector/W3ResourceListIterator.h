#pragma once
#include <Windows.h>
#include "W3MemoryUtils.h"
#include "W3Reverse.h"
#include "W3Player.h"
#include "W3Resource.h"


class W3ResourceListIterator {
private:
	struct RawData {
		ptr next;
	};

private:
	boolean m_IsValid;
	ptr m_Address;
	RawData m_RawData;

private:
	void W3ResourceListIterator::cleanUp() {
	}

	void W3ResourceListIterator::init(ptr pAddress) {
		cleanUp();
		m_Address = pAddress;
		m_IsValid = CW3MemoryUtils::GetInstance().GetW3Object<RawData>(pAddress, m_RawData);
	}

public:
	W3ResourceListIterator::W3ResourceListIterator(const W3ResourceListIterator& rList) : m_IsValid(false), m_Address(0), m_RawData() {
		init(rList.m_Address);
	}

	W3ResourceListIterator::W3ResourceListIterator(ptr pAddress) : m_IsValid(false), m_Address(0), m_RawData() {
		if (pAddress != 0) {
			init(pAddress);
		}
	}

	uint64_t GetIdent() {
		return (uint64_t)m_Address;
	}

	W3ResourceListIterator& W3ResourceListIterator::refresh() {
		init(m_Address);
		return *this;
	}

	bool W3ResourceListIterator::hasNext() {
		return m_IsValid && m_RawData.next != 0;
	}

	W3ResourceListIterator& W3ResourceListIterator::next() {
		init(m_RawData.next);
		return *this;
	}

	const ptr GetResourceAddress() {
		return m_Address;
	}

	W3ResourceListIterator::~W3ResourceListIterator() {
		cleanUp();
	}
};
