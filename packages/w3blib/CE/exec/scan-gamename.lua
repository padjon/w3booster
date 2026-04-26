enablePrivateScan()
-- GAMENAME
ms.newScan()
local iteration = 0
while(multipleAdressesFound() or iteration < 1) do
    local gamename="gnpad" .. iteration
    wait(1000)
    local query = "0x67 0x6E 0x70 0x61 0x64 0x3"..iteration
    if iteration == 0 then
        createMultiplayerGame(gamename)
        ms.firstScan(soExactValue, vtByteArray , rtRounded,  query, "", 0x00000000, 0xffffffffffffffff, "", fsmAligned, "8", false, false, false, false) --change the last true to false if you do not wish case sensitivity
        ms.waitTillDone()
        abortLobby()
    else
        startMultiplayerGame(gamename)
        ms.nextScan(soExactValue, rtRounded, query, "", false, false, false, true, false, '')
        ms.waitTillDone()
        leaveGame()
    end

    ms.nextScan(soExactValue, rtRounded, "0x00 0x00 0x00 0x00 0x00 0x00", "", false, false, false, true, false, '')
    wait(200)
    ms.nextScan(soExactValue, rtRounded, "0x00 0x00 0x00 0x00 0x00 0x00", "", false, false, false, true, false, '')
    wait(300)
    ms.nextScan(soExactValue, rtRounded, "0x00 0x00 0x00 0x00 0x00 0x00", "", false, false, false, true, false, '')
    ms.waitTillDone()
    iteration = iteration + 1
    print(getFoundAbsoluteAddress(true, 0))
    print(getFoundAbsoluteAddress(true, 1))
    print(getFoundAddressCount(true, 0))
end
local offset = 74*8

addValueToCPPExport("GAMENAME_SEARCHPATTERN",  readQword(getFoundAbsoluteAddress(true, 0) - offset ) - baseAddress)
addValueToCPPExport("GAMENAME_PATTERN_OFFSET",  offset)
disablePrivateScan()