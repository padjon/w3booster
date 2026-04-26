-- Game Version
local fileVer, fileVerTable = getFileVersion(enumModules()[1].PathToFile)
addValueToCPPExport("WC3_VERSION_BUILD", fileVerTable.build);

startMultiplayerGame("Pad m" .. math.random(1000,9999))
--mapname
ms.newScan()
ms.firstScan(soExactValue, vtString , rtRounded, "W3Booster Testmap", "0", 0x00000000, 0xffffffffffffffff, "", fsmAligned, "4", false, false, false, true) --change the last true to false if you do not wish case sensitivity
ms.waitTillDone()
addAddressToCPPExport("MAPNAME");


--gametime
ms.newScan()
ms.firstScan(soValueBetween, vtDword , rtRounded, "1000", "120000", 0x00000000, 0xffffffffffffffff, "", fsmAligned, "4", false, false, false, true) --change the last true to false if you do not wish case sensitivity
ms.waitTillDone()
for j=1, 3 do
    for i=1, 4 do
        wait(500)
        ms.nextScan(soIncreasedValue, rtRounded, "300", "5000", false, false, false, true, false, '')
        ms.waitTillDone()
    end

    wait(500)
    pauseGame()
    ms.nextScan(soIncreasedValue, rtRounded, "300", "2000", false, false, false, true, false, '')
    ms.waitTillDone()

    for i=1, 2 do
        wait(500)
        ms.nextScan(soUnchanged, rtRounded, "", "", false, false, false, true, false, '')
        ms.waitTillDone()
    end
    unpauseGame()
    if getFoundAddressCount() <= 1 then break end
    print(getFoundAddressCount())
    print(getFoundAbsoluteAddress(true, 0))
    print(getFoundAbsoluteAddress(true, 1))
end
addAddressToCPPExport("GAMETIME");

-- CHATBAR_STATE
ms.newScan()
ms.firstScan(soExactValue, vtDword , rtRounded, "0", "", 0x00000000, 0xffffffffffffffff, "", fsmAligned, "4", false, false, false, true) --change the last true to false if you do not wish case sensitivity
ms.waitTillDone()

while(multipleAdressesFound()) do
    pressKey(0x0D, math.random(100,500))
    ms.nextScan(soExactValue, rtRounded, "1", "", false, false, false, true, false, '')
    ms.waitTillDone()

    pressKey(0x0D, math.random(100,500))
    ms.nextScan(soExactValue, rtRounded, "0", "", false, false, false, true, false, '')
    ms.waitTillDone()
end
addAddressToCPPExport("CHATBAR_STATE");


-- TEAMCOLOR
ms.newScan()
ms.firstScan(soExactValue, vtDword , rtRounded, "0", "", 0x00000000, 0xffffffffffffffff, "", fsmAligned, "4", false, false, false, true) --change the last true to false if you do not wish case sensitivity
ms.waitTillDone()

while(multipleAdressesFound()) do
    for i=1, 4 do
        ms.nextScan(soExactValue, rtRounded, "0", "", false, false, false, true, false, '')
        ms.waitTillDone()
    end
    toggleTeamColorMode()
    toggleTeamColorMode()
    ms.nextScan(soExactValue, rtRounded, "1", "", false, false, false, true, false, '')
    ms.waitTillDone()
    toggleTeamColorMode()
    wait(math.random(100,500))
end
addAddressToCPPExport("COLORMODE")

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


-- W3State
ms.newScan()
ms.firstScan(soValueBetween, vtDword , rtRounded, "520", "580", 0x00000000, 0xffffffffffffffff, "", fsmAligned, "4", false, false, false, true) --change the last true to false if you do not wish case sensitivity
ms.waitTillDone()

for i=1, 4 do
    wait(math.random(100,500))
    pressKey(0x77) -- f8 - selects worker
    ms.nextScan(soUnchanged, rtRounded, "", "", false, false, false, true, false, '')
    ms.waitTillDone()
end

leaveGame()

---------------------------------------------------------
-- get w3state of singleplayer

startSingleplayerGame()

-- Replay =  MP state - 9
ms.nextScan(soDecreasedValueBy, rtRounded, "16", "", false, false, false, true, false, '')
ms.waitTillDone()

ms.nextScan(soValueBetween, rtRounded, "520", "580", false, false, false, true, false, '')
ms.waitTillDone()

for i=1, 4 do
    wait(math.random(100,500))
    ms.nextScan(soUnchanged, rtRounded, "", "", false, false, false, true, false, '')
    ms.waitTillDone()
end

addAddressToCPPExport("W3STATE")
w3stateAdress = getFoundAbsoluteAddress(false)
addValueToCPPExport("W3STATE_GAME_SP", readInteger(w3stateAdress))
pressKey(0x78, 500)
pressKey(0x1b, 500)
addValueToCPPExport("W3STATE_GAME_SP_QUEST_DIALOG", readInteger(w3stateAdress))

--wait for lastreplay in next step
wait(20000)

pressKey(0x0D, math.random(100,500))
typeText("SomebodySetUpUsTheBomb")
pressKey(0x0D, math.random(100,500))
addValueToCPPExport("W3STATE_GAME_SP_QUEST_DIALOG_LOST", readInteger(w3stateAdress))

leaveGame()



---------------------------------------------------------
-- CURRENTSLOT

startLastReplay()

addValueToCPPExport("W3STATE_REPLAY", readInteger(w3stateAdress));

ms.newScan()
ms.firstScan(soExactValue, vtDword , rtRounded, "22", "", 0x00000000, 0xffffffffffffffff, "", fsmAligned, "4", false, false, false, true) --change the last true to false if you do not wish case sensitivity
ms.waitTillDone()

while(multipleAdressesFound()) do
    pressKey(0x7A, math.random(100,500))
    ms.nextScan(soExactValue, rtRounded, "23", "", false, false, false, true, false, '')
    ms.waitTillDone()
    pressKey(0x7A, math.random(100,500))
    ms.nextScan(soExactValue, rtRounded, "22", "", false, false, false, true, false, '')
    ms.waitTillDone()
end
addAddressToCPPExport("CURRENTSLOT")

leaveGame()
