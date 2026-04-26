#pragma once
#include <string>
#include "json.h"

class CSettings {
public:
	static CSettings& GetInstance();

	template <class T> 
	T GetSetting(std::string key, T defaultValue);

	void SetSettings(std::ifstream& rSettings);
	void SetSettings(std::string& rSettings);
	nlohmann::json& GetSettings();

private:
	static CSettings* s_pInstance;

private:
	nlohmann::json m_Settings;
};

template<class T>
inline T CSettings::GetSetting(std::string key, T defaultValue)
{
	{
		try {
			return m_Settings[key];
		}
		catch (...) {
		}
		return defaultValue;
	}
}
