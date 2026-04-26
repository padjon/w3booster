--docs
-- firstScan(scanoption, vartype, roundingtype, input1, input2 ,startAddress ,stopAddress ,protectionflags ,alignmenttype ,"alignmentparam" ,isHexadecimalInput ,isNotABinaryString, isunicodescan, iscasesensitive);
-- scannext (scanoption, roundingtype, input1,input2, isHexadecimalInput, isNotABinaryString, isunicodescan, iscasesensitive, ispercentagescan, savedresultname OPTIONAL);
-- https://github.com/badeesindi/cheat-engine/blob/master/cheat-engine/cheatengine/bin/main.lua


log("start")
dofile(dir .. "exec/init.lua")
--dofile(dir .. "exec/scan-logpath.lua")
--dofile(dir .. "exec/scan-gamename.lua")
--dofile(dir .. "exec/scan-main.lua")
--dofile(dir .. "exec/scan-lists-and-player-and-units.lua")

-- HUD Scaling
setHudScalingIngame(100)
ms.newScan()
ms.firstScan(soExactValue, vtDword , rtRounded, "3CE7D567", "", 0x00000000, 0xffffffffffffffff, "", fsmAligned, "4", true, false, false, true) --change the last true to false if you do not wish case sensitivity
ms.waitTillDone()

while(multipleAdressesFound()) do
    setHudScalingIngame(0)
    ms.nextScan(soExactValue, rtRounded, "03C67D567", "", true, false, false, true, false, '')
    ms.waitTillDone()
    setHudScalingIngame(100)
    ms.nextScan(soExactValue, rtRounded, "3CE7D567", "", true, false, false, true, false, '')
    ms.waitTillDone()
end
addAddressToCPPExport("HUDSCALE")

--writeCPPExport()
log("end")

--    log(readInteger(baseAddress + 0x29a3810 ))

--shellExecute(dir .. "exec\\clumsy\\clumsy.bat")
--wait(50000)
--log("close")
--os.execute("TASKKILL /IM clumsy.exe /F")
-- dofile(dir .. "exec/scan-main.lua")
-- dofile(dir .. "exec/scan-is-reforged.lua")
-- 

--startMultiplayerGame(15)


--[[
enablePrivateScan()
ms.newScan()
ms.firstScan(soExactValue, vtString, rtRounded, "lgonOgre Lord", "0", 0x00000000, 0xffffffffffffffff, "", fsmNotAligned, "", false, false, false, true) --change the last true to false if you do not wish case sensitivity
ms.waitTillDone()

errorIf(not getFoundAddressCount() == 1, "unit OgreLord not distinctly found")
local address = getFoundAbsoluteAddress()
log(address)
log(table.concat(readBytes(address, 40, true)))
--readBytes('0018F6AC', 80, true)
disablePrivateScan()
log("end")
--]]