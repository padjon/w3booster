function switchReforged()
    pressKey("O", 2000)
    pressKey("R", 500)
    click(300, 855, 100)

    -- click save
    click(685, 1000, 100)

    -- back to main screen
    pressKey(0x1b, 500)

    -- fix bug of being unresponsive after options screen
    click(1600, 50, 1000)
end

function scanReforgedOn()
    ms.nextScan(soExactValue, rtRounded, "1", "", false, false, false, false, false, '')
    ms.waitTillDone()
end

function scanReforgedOff()
    ms.nextScan(soExactValue, rtRounded, "0", "", false, false, false, false, false, '')
    ms.waitTillDone()
    wait(500)
    ms.nextScan(soExactValue, rtRounded, "0", "", false, false, false, false, false, '')
    ms.waitTillDone()
    wait(300)
    ms.nextScan(soExactValue, rtRounded, "0", "", false, false, false, false, false, '')
    ms.waitTillDone()
end

startSingleplayerGame()
ms.newScan()
ms.firstScan(soExactValue, vtDword , rtRounded, "0", "", 0x00000000, 0x00007fffffffffff, "+W-C", fsmAligned, "4", false, false, false, false) --change the last true to false if you do not wish case sensitivity
ms.waitTillDone()
scanReforgedOff()
log("1 Results " .. getFoundAddressCount())

addValueToCPPExport("W3STATE_GAME_SP", readInteger(w3stateAdress));

leaveGame()

while(multipleAdressesFound()) do
    switchReforged() -- enable reforged
    startSingleplayerGame() -- enabling activates
    wait(1000)
    pressKey(0x77) -- f8 - selects worker
    local scanRuns = 200
    while(scanRuns > 0 and getFoundAddressCount() > 1) do
        scanReforgedOn();

        wait(math.random(0,100));
        scanRuns = scanRuns - 1
    end
    log("3 Results " .. getFoundAddressCount())
    leaveGame()

    switchReforged() -- disable reforged
    startSingleplayerGame("Frostsabre") -- disabling activates
    scanReforgedOff()
    log("6 Results " .. getFoundAddressCount())
    leaveGame()
end

addAddressToCPPExport("REFORGED_MODE");

