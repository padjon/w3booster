#pragma once
#include <string>
#include "W3MemoryUtils.h"
#include "json.h"

class W3AbilityIterator {
private:
#pragma pack(push, 1)
	struct RawData {
		ptr child;
		ptr _u1;
		ptr prevOfThisAbility;
		ptr nextOfThisAbility;
		char _u2[0x4];
		char type[0x4];
		ptr _u3[2];
		int32_t _u4[2];
		ptr prev;
		ptr next;
		ptr self1;
		ptr owner;
		ptr _u5[2];
		ptr self2;
		ptr _u6[3];
		int32_t _u7[2];
		ptr details;
	};
#pragma pack(pop)

	ptr m_Address;
	RawData m_RawData;
	void* m_pAbility;
	void (*m_pAbilityDeleter)(void*);
	std::string m_Type;

private:
	const int ObjectOffset = 6 * ptr_size + 4 * sizeof(int32_t);

private:
	void W3AbilityIterator::cleanUp() {
		if (m_pAbility != nullptr && m_pAbilityDeleter != nullptr) {
			m_pAbilityDeleter(m_pAbility);
		}
		m_pAbility = nullptr;
		m_pAbilityDeleter = nullptr;
	}

	void W3AbilityIterator::init(ptr pAddress) {
		cleanUp();
		m_Address = pAddress;
		CW3MemoryUtils::GetInstance().GetW3Object<RawData>(pAddress, m_RawData);
		m_Type = std::string(m_RawData.type, 4);
		std::reverse(m_Type.begin(), m_Type.end());
	}

public:
	W3AbilityIterator::W3AbilityIterator(const W3AbilityIterator& _rAbility) : m_pAbility(nullptr), m_pAbilityDeleter(nullptr) {
		init(_rAbility.m_Address);
	}

	W3AbilityIterator::W3AbilityIterator(ptr pAddress) : m_pAbility(nullptr), m_pAbilityDeleter(nullptr) {
		init(pAddress);
	}

	void W3AbilityIterator::refresh() {
		init(m_Address);
	}

	bool W3AbilityIterator::hasNext() {
		return m_RawData.next != 0 && m_RawData.next - ObjectOffset != m_Address;;
	}

	bool W3AbilityIterator::next() {
		if (!hasNext()) {
			return false;
		}
		init(m_RawData.next - ObjectOffset);
		return true;
	}

	bool W3AbilityIterator::hasPrev() {
		return m_RawData.prev != 0 && m_RawData.prev - ObjectOffset != m_Address;
	}

	W3AbilityIterator& W3AbilityIterator::prev() {
		init(m_RawData.prev - ObjectOffset);
		return *this;
	}

	const std::string& W3AbilityIterator::GetType() {
		return m_Type;
	}

	template <class T>
	T& GetAbility() {
		if (m_pAbility == nullptr) {
			m_pAbility = new T(m_RawData.details);
			m_pAbilityDeleter = [](void* pAbility) { delete static_cast<T*>(pAbility); };
		}
		return *(T*)m_pAbility;
	}

	template <class T>
	T& GetAbility(int _Ident) {
		if (m_pAbility == nullptr) {
			m_pAbility = new T(m_RawData.details, _Ident);
			m_pAbilityDeleter = [](void* pAbility) { delete static_cast<T*>(pAbility); };
		}
		return *(T*)m_pAbility;
	}

	W3AbilityIterator::~W3AbilityIterator() {
		cleanUp();
	}
};
