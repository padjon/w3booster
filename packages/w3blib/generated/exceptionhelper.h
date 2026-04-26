#pragma once

#include <exception>

class FileNotFoundException : public std::exception
{
private:
    std::string msg;

public:
    FileNotFoundException(const std::string& message = "") : msg(message)
    {
    }

    const char * what() const throw()
    {
        return msg.c_str();
    }
};
