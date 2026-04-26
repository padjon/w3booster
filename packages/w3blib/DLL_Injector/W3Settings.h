#pragma once
#include <string>
#include <map>

class CW3Settings {
public:
	static CW3Settings& getInstance();


public:
	bool InitializeSettings();
	void ReloadSettings();
	void dbgPrintSettings();
	bool Has(const std::string& rSettingKey);
	const std::string& Get(const std::string& rSettingKey);

private:
	CW3Settings();

private:
	static CW3Settings* s_pInstance;

private:
	std::map<std::string, std::string> m_Settings;
};

