#pragma once
#include <Windows.h>

class CTurnManager {
public:
	static UINT GetTurn() {
		return s_CurrentTurn;
	}

	static void NextTurn() {
		s_CurrentTurn++;
	}

private:
	static UINT s_CurrentTurn;


};