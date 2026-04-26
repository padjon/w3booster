enablePrivateScan()

-- GAMENAME
ms.newScan()
ms.firstScan(soExactValue, vtByteArray , rtRounded,  "0x67 0x6E 0x70 0x61 0x64 0x31 0x32 0x33", "", 0x00000000, 0xffffffffffffffff, "", fsmAligned, "8", false, false, false, false) --change the last true to false if you do not wish case sensitivity
ms.waitTillDone()
print(getFoundAddressCount())
print(getFoundAbsoluteAddress(true, 0))
disablePrivateScan()