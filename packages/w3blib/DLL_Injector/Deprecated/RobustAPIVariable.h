#pragma once
#include <Windows.h>
#include <list>

namespace w3api
{
    template<typename T>
    class CRobustAPIVariable
    {

    private:
        T m_Value;
        std::list<T> m_LastValues;
        T m_Tolerance;
        UINT m_LastTurn;
    public:

        CRobustAPIVariable(T _InitialValue, T _Tolerance) : m_Value(_InitialValue),m_Tolerance(_Tolerance), m_LastTurn(CTurnManager::GetTurn()) {
            int x = 5;
        }

        const T GetValue() const {
            return m_Value;
        }

        const T GetValue(T _Value) const {
            return (const_cast<CRobustAPIVariable<T>*>(this))->GetValueNonConst(_Value);
        }

    private: 
        const T GetValueNonConst(T _Value) {
            UINT Turn = CTurnManager::GetTurn();
            if (Turn != m_LastTurn) {
                T Value = _Value;
                T Delta = Value - m_Value;
                if (Delta < 0) {
                    Delta *= -1;
                }

                if ((Value != 0 && Delta <= m_Tolerance) || (Value != 0 && m_Value == 0)) {
                    m_Value = Value;
                    m_LastValues.clear();
                }
                else {
                    m_LastValues.push_back(Value);
                    if (m_LastValues.size() >= 3) {
                        int nr = 0;
                        int seen = 0;
                        for (auto it = m_LastValues.rbegin(); it != m_LastValues.rend(); it++) {
                            if (*it == Value) {
                                seen += 1;
                            }
                            if (++nr >= 3) {
                                break;
                            }
                        }

                        if (seen >= 3) {
                            m_Value = Value;
                            m_LastValues.clear();
                        }
                    }
                }
            }

            return m_Value;
        }
    };
};