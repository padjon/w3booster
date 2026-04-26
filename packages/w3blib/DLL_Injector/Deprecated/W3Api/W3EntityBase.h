#pragma once
#include <Windows.h>
#include "../json.h"
#include "../TurnManager.h"

namespace w3api {

	template <class T>
	class W3EntityBase {

	public:
		W3EntityBase(const T& _rRaw) : $(_rRaw), m_Hash(-1), m_HasChanged(true), m_LastChangeCalculationTurn(CTurnManager::GetTurn()){
		}

		bool HasChanged(){
			UINT Turn = CTurnManager::GetTurn();
			if (Turn == m_LastChangeCalculationTurn) {
				return m_HasChanged;
			}
			else {
				m_LastChangeCalculationTurn = Turn;
				UINT64 lastHash = m_Hash;
				m_Hash = CalculateChangeDetectionHash();
				m_HasChanged = lastHash != m_Hash || DependencyHasChanged();
			}			
			return m_HasChanged;
		}

		const T* operator->() const {
			return &$;
		}

		std::string GetStringId() const {
			std::string Id = std::string((char*)&$.Id, 4);
			std::reverse(Id.begin(), Id.end());
			return Id;
		}

	protected:
		virtual UINT64 CalculateChangeDetectionHash() {
			return 0;
		};

		virtual bool DependencyHasChanged() {
			return false;
		}
		const T& $;

	private:
		UINT64 m_Hash;
		bool m_HasChanged;
		UINT m_LastChangeCalculationTurn;
	};
}