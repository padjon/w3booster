#include "Settings.h"
#include <fstream>

CSettings* CSettings::s_pInstance(nullptr);

CSettings& CSettings::GetInstance()
{
	if (s_pInstance == nullptr) {
		s_pInstance = new CSettings();
	}
	return *s_pInstance;
}

void CSettings::SetSettings(std::ifstream& rSettings)
{
	rSettings >> m_Settings;
}

void CSettings::SetSettings(std::string& rSettings)
{
	m_Settings = nlohmann::json::parse(rSettings);
}


nlohmann::json& CSettings::GetSettings()
{
	return m_Settings;
}
