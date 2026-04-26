#include "W3API.h"

W3API* W3API::s_pInstance(nullptr);
HANDLE W3API::s_hAPIFileMapping(nullptr);
std::string W3API::DBG_lastResult("");