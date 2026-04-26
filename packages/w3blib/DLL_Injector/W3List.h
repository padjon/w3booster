#pragma once
#include <Windows.h>
#include "W3MemoryUtils.h"
#include "W3Reverse.h"

class W3List {
public:

	// search for 66 64 61 5E 66 64 61 5e || 88 03 = w3u 
	enum EType {
		LIST_RESEARCH = W3REVERSE::VALUE_LISTID__WUP, //lga+puW+
		LIST_UNITS = W3REVERSE::VALUE_LISTID__W3U, //lga+u3w+
		LIST_ITEMS = W3REVERSE::VALUE_LISTID_ITEM , //lga+meti
		LIST_PLAYERS = W3REVERSE::VALUE_LISTID__PLY //lga+ylp+
		//3d2 => lga+mag+
	};

private:
	struct RawData {
		ptr _u1[2];
		ptr prev;
		ptr next;
		uint32_t _u2;
		uint32_t _u3;
		uint32_t _u4;
		uint32_t listType;
		BYTE _u5[ptr_size*10];
		uint32_t _u6;
		uint32_t _u7;
		ptr _u8[3];
		ptr firstElementAddress;
	};

private:
	boolean m_IsValid;
	ptr m_Address;
	RawData m_RawData;
	EType m_Type;

private:
	void W3List::cleanUp() {
	}

	void W3List::init(ptr pAddress) {
		cleanUp();
		m_Address = pAddress;
		m_IsValid = CW3MemoryUtils::GetInstance().GetW3Object<RawData>(pAddress, m_RawData);
		m_Type = (EType)m_RawData.listType;
	}

public:
	W3List::W3List(const W3List& rList) : m_IsValid(false), m_Address(0), m_RawData(), m_Type((EType)0) {
		init(rList.m_Address);
	}

	W3List::W3List(ptr pAddress) : m_IsValid(false), m_Address(0), m_RawData(), m_Type((EType)0) {
		if (pAddress != 0) {
			init(pAddress);
		}
	}

	uint64_t GetIdent() {
		return (uint64_t)m_Address;
	}

	W3List& W3List::refresh() {
		init(m_Address);
		return *this;
	}

	bool W3List::hasNext() {
		return m_IsValid && m_RawData.next != 0;
	}

	W3List& W3List::next() {
		init(m_RawData.next - ptr_size);
		return *this;
	}

	bool W3List::hasPrev() {
		return m_IsValid && m_RawData.prev != 0;
	}

	W3List& W3List::prev() {
		init(m_RawData.prev - ptr_size);
		return *this;
	}

	EType GetType() {
		return m_Type;
	}

	ptr GetFirstElementAddress() {
		if (m_RawData.firstElementAddress != 0) {
			return m_RawData.firstElementAddress - ptr_size;
		}
		return 0;
	}

	W3List::~W3List() {
		cleanUp();
	}
};
