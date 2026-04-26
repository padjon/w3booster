#pragma once
#include <Windows.h>

class W3List {
public:
	enum EType {
		LIST_UNITS = 0x387
	};

private:
	struct RawData {
		void* _u1[4];
		void* prev;
		void* next;
		void* _u2;
		uint32_t _u3;
		uint32_t listType;
		void* _u4[14];
		void* firstElementAddress;
	};

private:
	void* m_Address;
	RawData m_RawData;
	EType m_Type;

private:
	void W3List::cleanUp() {
	}

	void W3List::init(void* pAddress) {
		cleanUp();
		m_Address = pAddress;
		CW3MemoryUtils::GetInstance().GetW3Object<RawData>(pAddress, m_RawData);
		m_Type = m_RawData.listType;
	}

public:
	W3List::W3List(const W3List& rUnit) : m_pDetails(nullptr) {
		init(rUnit.m_Address);
	}

	W3List::W3List(void* pAddress) : m_pDetails(nullptr) {
		if (pAddress != nullptr) {
			init(pAddress);
		}
	}

	uint64_t GetIdent() {
		return (uint64_t)m_Address;
	}

	void W3List::refresh() {
		init(m_Address);
	}

	bool W3List::hasNext() {
		return m_RawData.next != nullptr;
	}

	W3List& W3List::next() {
		init((BYTE*)m_RawData.next - 0x08);
		return *this;
	}

	bool W3List::hasPrev() {
		return m_RawData.prev != nullptr;
	}

	W3List& W3List::prev() {
		init((BYTE*)m_RawData.prev - 0x08);
		return *this;
	}

	EType GetType() {
		return m_Type;
	}

	void* GetFirstElementAddress() {
		return m_RawData.firstElementAddress - 0x08;
	}

	W3List::~W3List() {
		cleanUp();
	}
};