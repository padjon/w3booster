#include "DataPipeWriter.h"
#include "openssl/aes.h"
#include <openssl/bio.h>
#include <openssl/pem.h>
#include <openssl/rsa.h>
#include <openssl/err.h>
#include "Logger.h"

CDataPipeWriter* CDataPipeWriter::s_pInstance(nullptr);

bool CDataPipeWriter::Initialize(std::string& rPipeName)
{
	s_pInstance = new CDataPipeWriter(rPipeName);
	return s_pInstance->m_hPipe != INVALID_HANDLE_VALUE;
}

CDataPipeWriter& CDataPipeWriter::GetInstance()
{
	return *s_pInstance;
}

CDataPipeWriter::CDataPipeWriter(std::string& rPipeName) : m_PipeName(rPipeName)
{
	m_hPipe = CreateFile(TEXT(std::string("\\\\.\\pipe\\" + rPipeName).c_str()), GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
	ConnectNamedPipe(m_hPipe, NULL);
}

void CDataPipeWriter::Send(EMessageType _rMessageType, const std::string& _rData)
{
	std::string Data = _rData;
	if (_rMessageType == EMessageType::GAMEDATA) {
		Data = "";
		std::string decryptedData = _rData;
		while (decryptedData.length() > 0) {
			int len = min(180, decryptedData.length());
			Data += Encrypt(decryptedData.substr(0,len));
			decryptedData = decryptedData.substr(len);
		}
	}

	SIZE_T DataLength = Data.length();
	std::string message;
	message.append((char*)& _rMessageType, 1);
	message.append((char*) &DataLength, 4);
	message.append(Data);
	DWORD numWritten;
	if (!WriteFile(m_hPipe, message.c_str(), message.length(), &numWritten, NULL)) {
		m_hPipe = CreateFile(TEXT(std::string("\\\\.\\pipe\\" + m_PipeName).c_str()), GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
		ConnectNamedPipe(m_hPipe, NULL);
		WriteFile(m_hPipe, message.c_str(), message.length(), &numWritten, NULL);
	}
}

void CDataPipeWriter::Send(EMessageType _rMessageType, const BYTE* _rData, const SIZE_T _DataLength)
{
	const SIZE_T BufferSize = _DataLength + 5;
	BYTE* pBuffer = new BYTE[BufferSize];
	memcpy(pBuffer, (char*)& _rMessageType, 1);
	memcpy(pBuffer + 1, (char*)& _DataLength, 4);
	memcpy(pBuffer + 5, _rData, _DataLength);
	DWORD numWritten;
	if (!WriteFile(m_hPipe, pBuffer, BufferSize, &numWritten, NULL)) {
		m_hPipe = CreateFile(TEXT(std::string("\\\\.\\pipe\\" + m_PipeName).c_str()), GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
		ConnectNamedPipe(m_hPipe, NULL);
		WriteFile(m_hPipe, pBuffer, BufferSize, &numWritten, NULL);
	}
	delete[] pBuffer;
}



std::string CDataPipeWriter::Encrypt(const std::string& _rMessage)
{
	std::string key = "-----BEGIN PUBLIC KEY-----\n"\
		"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsEkMrOCRfgexjd9VarXi\n"\
		"P+J5nZ3QTn0c2YdNIM9upufbU6ItGEEQBaxMHJD2ijRXVdfY9dv9eooiCzHTgzkC\n"\
		"wiiO5S9oFuDIQbmlCRMHIvv5LgyfYICwCfys7ZmVReIiNnBsGWfPN24FZV5hUKkr\n"\
		"uvdNsees1hpXHRXa85I/QyxTqjHu8yJWVUp6Fi3paTfLH/OuCwD13Bk/4c/ityBD\n"\
		"erI3h0SZ/yO0Pj2cRL7GFC4djW2l8cdFm51g5bzSO/9DsB2xbdXbUYpcagFdd604\n"\
		"GIfD8M1sToasjYw2ZVb8RhvSOY90fw9xA05as1zCN0DZsM10DwriW9qu+ei1U8Tj\n"\
		"/QIDAQAB\n"\
		"-----END PUBLIC KEY-----\n";

	RSA* rsa = NULL;
	BIO* keybio;
	const char* c_string = key.c_str();
	keybio = BIO_new_mem_buf((void*)c_string, -1);
	if (keybio == NULL) {
		return "";
	}
	rsa = PEM_read_bio_RSA_PUBKEY(keybio, &rsa, NULL, NULL);
	if (rsa == NULL) {
		BIO_free(keybio);
		return "";
	}

	// Encrypt the message
	unsigned char* encrypt = (unsigned char*)malloc(RSA_size(rsa));
	int encrypt_len;
	std::string result = "";
	if ((encrypt_len = RSA_public_encrypt(_rMessage.length(), (const unsigned char*)_rMessage.c_str(), (unsigned char*)encrypt, rsa, RSA_PKCS1_OAEP_PADDING)) == -1) {
		CLogger::Log << "Unable to write gamedata (unable to convert data)" << CLogger::END;
	}
	else {
		result = Base64Encode(encrypt, RSA_size(rsa));
	}
	free(encrypt);
	RSA_free(rsa);
	BIO_free(keybio);
	return result;
}

static const std::string base64_chars =
"ABCDEFGHIJKLMNOPQRSTUVWXYZ"
"abcdefghijklmnopqrstuvwxyz"
"0123456789+/";
std::string CDataPipeWriter::Base64Encode(unsigned char const* bytes_to_encode, unsigned int in_len) {
	std::string ret;
	int i = 0;
	int j = 0;
	unsigned char char_array_3[3];
	unsigned char char_array_4[4];

	while (in_len--) {
		char_array_3[i++] = *(bytes_to_encode++);
		if (i == 3) {
			char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
			char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
			char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
			char_array_4[3] = char_array_3[2] & 0x3f;
			for (i = 0; (i < 4); i++)
				ret += base64_chars[char_array_4[i]];
			i = 0;
		}
	}

	if (i)
	{
		for (j = i; j < 3; j++)
			char_array_3[j] = '\0';
		char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
		char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
		char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);

		for (j = 0; (j < i + 1); j++)
			ret += base64_chars[char_array_4[j]];

		while ((i++ < 3))
			ret += '=';
	}
	return ret;
}
