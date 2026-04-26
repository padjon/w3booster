#include "W3Settings.h"
#include "Logger.h"
#include "W3MemoryUtils.h"

CW3Settings* CW3Settings::s_pInstance(nullptr);
CW3Settings& CW3Settings::getInstance() {
	if (s_pInstance == nullptr) {
		s_pInstance = new CW3Settings();
	}
	return *s_pInstance;
}

CW3Settings::CW3Settings() : m_Settings() {

}

bool CW3Settings::InitializeSettings() {
	ReloadSettings();
	return m_Settings.size() > 0;
}

void CW3Settings::ReloadSettings() {
	std::map<std::string, std::string> Settings;
	SIZE_T readChunkBytes;
	ptr pLogPathAddress = CW3MemoryUtils::GetInstance().GetSequence(CW3MemoryUtils::ESequence::WAR3LOG_TXT_PATH).address;
	char LogPath[1000] = { 0 };
	std::string Path;
	ReadProcessMemory(CW3Process::GetInstance().GetProcessHandle(), (void*)pLogPathAddress, &LogPath, sizeof(LogPath), &readChunkBytes);
	LogPath[sizeof(LogPath) - 1] = '\0';
	Path = LogPath;

	if (!Path.empty()) {
		Path = Path.substr(0, Path.length() + 1 - strlen("/Logs/War3Logs.txt")) + "/War3Preferences.txt";
		std::ifstream file(Path);
		std::string str;
		std::string settingsPrefix = "";
		while (std::getline(file, str))
		{
			if (!str.empty()) {
				if (str[0] == '[') {
					settingsPrefix = str.substr(1, str.length() - 2);
				}
				else if (!settingsPrefix.empty()) {
					size_t delimiter = str.find_first_of('=');
					if (delimiter != str.npos && delimiter > 0) {
						auto key = (settingsPrefix + "_" + str.substr(0, delimiter));
						std::transform(key.begin(), key.end(), key.begin(), ::toupper);
						Settings[key] = str.substr(delimiter + 1);
					}
				}
			}
		}
	}

	if (Settings.size() > 0) {
		m_Settings = Settings;
	}
	else {
		CLogger::Log << "Was unable to (re)-load settings. Path: " << Path << CLogger::END;
	}
}

void CW3Settings::dbgPrintSettings() {
	CLogger::Log << "DBG Detected Settings:" << CLogger::END;
	auto it = m_Settings.begin();
	for (it; it != m_Settings.end(); it++) {
		CLogger::Log << it->first << ":" << it->second << CLogger::END;
	}
}

bool CW3Settings::Has(const std::string& rSettingKey) {
	return m_Settings.count(rSettingKey) > 0;
}


const static std::string EMPTY_RESPONSE = "";
const std::string& CW3Settings::Get(const std::string& rSettingKey) {
	return  (Has(rSettingKey) ? m_Settings[rSettingKey] : EMPTY_RESPONSE);
}

