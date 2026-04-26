-- general
function click(x, y, sleepTime)
    local screenPosX = 0
    local screenPosY = 0
    setMousePos(screenPosX + x, screenPosY + y)
    mouse_event(MOUSEEVENTF_LEFTDOWN)
    wait(20)
    mouse_event(MOUSEEVENTF_LEFTUP)
    wait(sleepTime)
end

function pressKey(key, sleepTime)
    sleepTime = sleepTime or 0
    doKeyPress(key)
    wait(sleepTime)
end

function typeText(text)
    for i = 1, #text do
        local c = text:sub(i, i)
        pressKey(string.upper(c), 20)
    end
end

function wait(time)
    -- request 2 times because sometimes isKeyPressed returns true at the first call after doKeyPress was executed
    if (isKeyPressed(0x1b) and isKeyPressed(0x1b)) then
        log("abort by esc")
        exit()
    else
        sleep(time)
    end
end

function disablePrivateScan()
    local s = getSettings()
    s.Value['MEM_PRIVATE'] = 0
    s.Value['MEM_IMAGE'] = 1
    s.Value['MEM_MAPPED'] = 1
    reloadSettingsFromRegistry()
    s.destroy()
end

function enablePrivateScan()
    local s = getSettings()
    s.Value['MEM_PRIVATE'] = 1
    s.Value['MEM_IMAGE'] = 1
    s.Value['MEM_MAPPED'] = 1
    reloadSettingsFromRegistry()
    s.destroy()
end

function startSingleplayerGame(mapName)
    mapName = mapName or "W3Booster Testmap"
    
    -- Single Player Button
    click(1545, 415, 2000)

    -- Custom Games Button
    click(1545, 390, 2000)

    selectMapInLobby(mapName)

    -- create game
    click(1650, 850, 2000)

    -- start game
    click(1650, 850, 10000)

    -- Click in the wait screen
    click(760, 880, 500)
end


function createMultiplayerGame(gameName, mapName)

    mapName = mapName or "W3Booster Testmap"

    -- MultiPlayer Button
    click(1545, 520, 2000)

    -- Custom Games Button
    click(700, 80, 2000)

    -- Press Create Button
    click(1130, 900, 2000)

    typeText(gameName)

    -- make game private
    click(600, 270, 100)

    selectMapInLobby(mapName)

    -- create game
    click(1650, 850, 4000)
end

function abortLobby()
    -- abort lobby
    pressKey(0x1b, 1000)
    pressKey(0x1b, 1000)
    pressKey(0x1b, 1000)
    pressKey(0x1b, 1000)
end

-- race 0RDM, 1H, 2O, 3U, 4N 
function startMultiplayerGame(gameName, mapName, color, race)

    mapName = mapName or "W3Booster Testmap"
    color = color or 0
    race = race or 0

    createMultiplayerGame(gameName, mapName)

    if color ~= 0 then
        click(165, 270, 500)
        click(165 + 36 * (color%6) , 320 + 35 * math.floor(color/6), 500)
    end

    if race ~= 0 then
        click(490, 275, 500)
        click(490, 315 + 38 * race , 500)
    end

    -- select computer
    click(820, 275, 500)
    click(820, 360, 500)

    -- start game
    click(1650, 850, 15000)
end

function selectMapInLobby(mapName)
    --prevent "level up" map structure bug by going into dir and back
    click(1050, 280, 100)
    click(1650, 850, 2000)
    click(1050, 230, 100)
    click(1650, 850, 2000)

    -- filter by mapname
    click(1150, 150, 100)
    typeText(mapName)

    --select filtered mapend
    click(1050, 230, 100)
end

function startLastReplay()
    pressKey("R", 2000)
    pressKey("W", 10000)
end

function leaveGame()
    keyDown(0x12)
    wait(100)
    pressKey(0x51, 100)
    pressKey(0x51, 100)
    keyUp(0x12)
    wait(1000)
    pressKey(0x1b, 2000)
    pressKey(0x1b, 2000)
    pressKey(0x1b, 1000)
    pressKey(0x1b, 1000)
end

function setHudScalingIngame(scalingLevel)
    click(50,10, 50)
    pressKey(0x79, 200)
    pressKey("O", 1000)
    pressKey("G", 800)
    -- 90 = 0; 470 = 100
    local dragbarStart = 114
    local dragbarEnd = 450
    click((dragbarEnd - dragbarStart) * (scalingLevel/100) + dragbarStart, 890, 200)

    -- click save
    click(685, 1000, 500)

    -- back to options screen
    pressKey(0x1b, 1000)

    --back to game
    pressKey(0x1b, 1000)
end

function pauseGame()
    pressKey(0x79, 50)
    pressKey("M", 50)
    pressKey("R", 50)
end

function unpauseGame()
    pauseGame()
end

function toggleTeamColorMode()
    keyDown(0x12)
    wait(100)
    doKeyPress(0x41)
    wait(100)
    keyUp(0x12)
end

function multipleAdressesFound()
    return getFoundAddressCount() > 1
end

function getFoundAddressCount()
    foundlist_initialize(fl)
    local res = foundlist_getCount(fl)
    foundlist_deinitialize(fl)
    return res
end

function getFoundAbsoluteAddress(withHexPrefix, index)
    index = index or 0
    if withHexPrefix == nil then
        withHexPrefix = true
    end
    foundlist_initialize(fl)
    local saddress = getAddress(fl.getAddress(index)) -- get the first address
    local res = string.format("%x", saddress)
    foundlist_deinitialize(fl)
    if withHexPrefix then
        return "0x" .. res
    else
        return res
    end
end

function getFoundAddress(withHexPrefix, index)
    index = index or 0
    if withHexPrefix == nil then
        withHexPrefix = true
    end
    foundlist_initialize(fl)
    local saddress = getAddress(fl.getAddress(index)) -- get the first address
    local res = string.format("%x", saddress - baseAddress)
    foundlist_deinitialize(fl)
    if withHexPrefix then
        return "0x" .. res
    else
        return res
    end
end

function findPointers(searchAddressStartAsNumber, searchAddressEndAsNumber)
    local searchAddressStartAsString = string.format("%016x", searchAddressStartAsNumber)
    local searchPattern = ""
    for i = 1, (#searchAddressStartAsString / 2), 2 do
        if i+2 >= (#searchAddressStartAsString / 2) then 
            searchPattern = "x" .. searchAddressStartAsString:sub(i, i ) .."? " .. searchPattern
        else
            searchPattern = "x" .. searchAddressStartAsString:sub(i, i+1 ) .." " .. searchPattern
        end
    end
    local searchPattern = "?? ?? ?? ?? " .. searchPattern
    ms.newScan()
    ms.firstScan(soExactValue, vtByteArray, nil, searchPattern, "", searchAddressStartAsNumber, searchAddressEndAsNumber, "", fsmAligned, "",
        false, false, false, true) -- change the last true to false if you do not wish case sensitivity
    ms.waitTillDone()
    foundlist_initialize(fl)
    local res = {}
    local resultCount = foundlist_getCount(fl)
    for i = 1, resultCount do
      res[i] = getAddress(fl.getAddress(i - 1))
    end
    foundlist_deinitialize(fl)
    return res
end

local fileOutput = ""
function addAddressToCPPExport(memoryName)
    if getFoundAddressCount() ~= 1 then
        log(memoryName .. ": FOUND not one unique result! " .. getFoundAddressCount())
        exit()
    else
        log("OFFSET_" .. memoryName .. " = " .. getFoundAddress())
        fileOutput = fileOutput .. "\tconstexpr uint64_t OFFSET_" .. memoryName .. " = " .. getFoundAddress() .. ";" ..
                         "\n"
    end
end

function addValueToCPPExport(memoryName, value)
    log("VALUE_" .. memoryName .. " = " .. value)
    fileOutput = fileOutput .. "\tconstexpr uint64_t VALUE_" .. memoryName .. " = " .. value .. ";" .. "\n"
end

function addStructToCPPExport(structName, structContent)
    log("STRUCT " .. structName .. " created")
    fileOutput = fileOutput .. "#pragma pack(push, 1)\nstruct " .. structName .. " {\n" .. structContent .. "};\n#pragma pack(pop)\n"
end

function writeCPPExport()
    io.open(dir .. "..\\DLL_Injector\\W3Reverse.h", "w+"):write(
        "#ifndef W3REVERSE_H\n#define W3REVERSE_H\n#include <cstdint>\n#include \"W3MemoryUtils.h\"\nnamespace W3REVERSE {\n\t#ifdef WC3X86\n\t\ttypedef uint32_t ptr;\n\t\tconst int ptr_size = sizeof(uint32_t);\n\t#else\n\t\ttypedef uint64_t ptr;\n\t\tconst int ptr_size = sizeof(uint64_t);\n\t#endif\n" .. fileOutput ..
            "};\n#endif"):close()
end

function logHex(value)
    log(string.format("0x%x", value))
end

function toLogString(o)
    if type(o) == 'table' then
       local s = '{ '
       for k,v in pairs(o) do
          if type(k) ~= 'number' then k = '"'..k..'"' end
          s = s .. '['..k..'] = ' .. toLogString(v) .. ','
       end
       return s .. '} '
    else
       return tostring(o)
    end
 end

io.open(dir .. "\\log\\log.txt", "w+"):close()
function log(text)
    text = toLogString(text)
    logFile = io.open(dir .. "\\log\\log.txt", "a+")
    logFile:write(text .. "\r")
    logFile:close()
    print("log: " .. text)
end



function errorIf(expression, text)
    if (expression) then
        log("ERROR:")
        log(text)
        exit()
    end
end

types = {
    byteArr4 = "byte %s [4]",
    uint32 = "uint32_t %s",
    uint64 = "uint64_t %s",
    ptr = "ptr %s"
}