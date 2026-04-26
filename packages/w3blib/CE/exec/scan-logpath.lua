ms.newScan()
ms.firstScan(soExactValue, vtString , rtRounded, "War3Log.txt", "", 0x00000000, 0x00007fffffffffff, "+W-C", fsmNotAligned , "4", false, false, false, false) --change the last true to false if you do not wish case sensitivity
ms.waitTillDone()
log("6 Results " .. getFoundAddressCount())
local stringlen = 120
local bytes = readBytes(getFoundAbsoluteAddress() - stringlen,stringlen, true);
local war3LogTxtPath = "this/path/is/not/yet/initialized/War3Log.txt"
for i = 1, stringlen do
    if(bytes[stringlen - i] == 0) then
        war3LogTxtPath = readString(getFoundAbsoluteAddress()- i, stringlen)
       break 
    end
end

ms.newScan()
ms.firstScan(soExactValue, vtString , rtRounded, war3LogTxtPath, "", 0x00000000, 0x00007fffffffffff, "+W-C", fsmNotAligned , "4", false, false, false, false) --change the last true to false if you do not wish case sensitivity
ms.waitTillDone()
addAddressToCPPExport("WAR3LOG_TXT_PATH")
