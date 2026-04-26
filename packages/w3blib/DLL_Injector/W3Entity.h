#pragma once
#include <cstdint>
#include <string>
#include <unordered_set>
#include "W3MemoryUtils.h"
#include <assert.h>
#include "Logger.h"

typedef uint64_t THash;



class W3EntityPersistentDataRegistry {
public:
	struct PersistentData {
		THash LastHash = -1;
		THash CurrentHash = -1;
		std::unordered_map<std::string, int64_t> Data;
	};
	typedef std::unordered_map<uint64_t, PersistentData> PersistentDataMap;

public:
	static W3EntityPersistentDataRegistry& GetInstance() {
		static W3EntityPersistentDataRegistry instance;
		return instance;
	}

public:
	W3EntityPersistentDataRegistry() : m_PersistentDataRegistry() {
		m_PersistentDataRegistry.clear();
	}

public:
	PersistentDataMap* Register() {
		PersistentDataMap* pDataMap = new PersistentDataMap();
		m_PersistentDataRegistry.push_back(pDataMap);
		return pDataMap;
	}

	void FlushPersistentData() {
		for (auto& pData : m_PersistentDataRegistry) {
			pData->clear();
		}
	}

private:
	std::vector<PersistentDataMap*> m_PersistentDataRegistry;
};

template <class T> class W3Entity {
public:
	W3Entity() : m_Address(0), m_Type(), m_RawData(), m_pPersistentData(nullptr), m_Id(0), m_CleanedUp(true), m_TypeAsInt(0) {
	}

	void InitEntity(ptr _Address) {
		m_Address = _Address;
		Refresh();
	}

	void CleanUpEntity() {
		CleanUp();
		m_CleanedUp = true;
	}


	void Refresh() {
		CleanUpEntity();
		CW3MemoryUtils::GetInstance().GetW3Object<T>(m_Address, m_RawData);
		m_TypeAsInt = (*(uint32_t*)&InitGetType());
		m_Type = std::string(InitGetType(), 4);
		m_Id = InitGetId();
		std::reverse(m_Type.begin(), m_Type.end());
		m_pPersistentData = &(*s_pClassPersistentDataMap)[GetIdent()];
		Init();

		PostInit();
		m_CleanedUp = false;
	}

	ptr GetAddress() {
		return m_Address;
	}

	uint64_t GetIdent() {
		return m_Id;
	}
	
	const std::string& GetType() {
		return m_Type;
	}

	uint32_t GetTypeAsInt() {
		return m_TypeAsInt;
	}
	
	T& GetRawData() {
		return m_RawData;
	}

	THash GetHash() {
		return (m_pPersistentData != nullptr) ? m_pPersistentData->CurrentHash : 0;
	}

	virtual bool HasChanged() {
		if (m_pPersistentData == nullptr) {
			return false;
		}
		bool hasChanged = m_pPersistentData->LastHash != m_pPersistentData->CurrentHash;
		m_pPersistentData->LastHash = m_pPersistentData->CurrentHash;
		return hasChanged;
	}

public:
	virtual ~W3Entity() = 0 {
		assert(m_CleanedUp == true);
	};

protected:
	void PostInit() {
		THash Hash = CalculateHash();
		if (Hash != m_pPersistentData->CurrentHash) {
			m_pPersistentData->LastHash = m_pPersistentData->CurrentHash;
			m_pPersistentData->CurrentHash = Hash;
		}
	}

	uint64_t ToId(uint64_t a, uint32_t b) {
		return (uint64_t)a << 32 | b;
	}

protected:
	typedef const char char_array[4];
	virtual char_array& InitGetType() = 0;
	virtual uint64_t InitGetId() = 0;
	virtual THash CalculateHash() = 0;
	virtual void Init() = 0;
	virtual void CleanUp() = 0;

protected:
	ptr m_Address;
	std::string m_Type;
	T m_RawData;
	typename W3EntityPersistentDataRegistry::PersistentData* m_pPersistentData;

private:
	static W3EntityPersistentDataRegistry::PersistentDataMap* s_pClassPersistentDataMap;

private:
	uint64_t m_Id;
	bool m_CleanedUp;
	uint32_t m_TypeAsInt;

};

template <class T>
W3EntityPersistentDataRegistry::PersistentDataMap* W3Entity<T>::s_pClassPersistentDataMap = W3EntityPersistentDataRegistry::GetInstance().Register();
