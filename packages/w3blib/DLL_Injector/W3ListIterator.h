#pragma once
#include <Windows.h>
#include <vector>
#include "W3Ability.h"
#include <bitset>
#include "Logger.h"
#include "W3Collections.h"
#include "W3AbilityIterator.h"
#include "W3List.h"

class W3ListIteratorNoValue {};

	template <class T = W3ListIteratorNoValue>
	class W3ListIterator {
	protected:
	#pragma pack(push, 1)
		struct RawData {
			ptr extra;
			ptr _u1;
			ptr prev;
			ptr next;
			char lga[4];
			char type[4];
			ptr id;
			ptr _u2[2];
			int32_t _u3[4];
			ptr self1;
			ptr _u4[3];
			ptr self2;
			int32_t _u5[2];
			ptr _u6[3];
			ptr details;
		};
	#pragma pack(pop)

		typedef uint64_t THash;


	protected:
		ptr m_Address;
		RawData m_RawData;
		T* m_pValue;


	protected:

		template<class T>
		void init(ptr pAddress) {
			m_Address = pAddress;
			CW3MemoryUtils::GetInstance().GetW3Object<RawData>(pAddress, m_RawData);
			delete m_pValue;
			m_pValue = new T(m_RawData.details, m_RawData.extra);
		}

		template<>
		void init<W3ListIteratorNoValue>(ptr pAddress) {
			m_Address = pAddress;
			CW3MemoryUtils::GetInstance().GetW3Object<RawData>(pAddress, m_RawData);
		}


	public:
		W3ListIterator(const W3ListIterator& rListIterator) : m_Address(0), m_RawData(), m_pValue(nullptr) {
			init(rListIterator.m_Address);
		}

		W3ListIterator(ptr pAddress) : m_Address(0), m_RawData(), m_pValue(nullptr) {
			if (pAddress != 0) {
				init<T>(pAddress);
			}
		}

		ptr GetListItemAddress() {
			return m_Address;
		}

		T& GetValue() {
			return *m_pValue;
		}

		ptr GetValueAddress() {
			return m_RawData.details;
		}

		ptr GetIdent() {
			return m_RawData.id;
		}

		std::string GetType() {
			return std::string(m_RawData.type, sizeof(m_RawData.type));
		}

		void W3ListIterator::refresh() {
			init(m_Address);
		}

		bool W3ListIterator::hasNext() {
			return m_RawData.next != 0;
		}

		bool W3ListIterator::next() {
			if (hasNext()) {
				init<T>(m_RawData.next - ptr_size);
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

		virtual W3ListIterator::~W3ListIterator() {
			delete m_pValue;
		}
	};
