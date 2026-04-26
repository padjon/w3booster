startMultiplayerGame("Pad m" .. math.random(1000,9999), nil, 23)

addValueToCPPExport("W3STATE_GAME_MP", readInteger(w3stateAdress))

enablePrivateScan()

ms.newScan()
ms.firstScan(soExactValue, vtString, rtRounded, "fda^fda^", "0", 0x00000000, 0xffffffffffffffff, "", fsmNotAligned, "",
    false, false, false, true) -- change the last true to false if you do not wish case sensitivity
ms.waitTillDone()

for index=0, getFoundAddressCount()-1 do
    local listEntry = tonumber(getFoundAbsoluteAddress(true, index));
    local listTypeValue = readInteger(listEntry + 8 + 4)
    local listStartAddress = readPointer(listEntry + 16 * 8)
    if(listStartAddress ~= 0) then
        local listTypeAddress = listStartAddress + 28
        local listTypeName = readString(listTypeAddress, 4) 
        addValueToCPPExport("LISTID_" .. listTypeName:reverse():gsub('+','_'):gsub('%.','_'):gsub('-','_'):upper(),  string.format("0x%x", listTypeValue))
    end
end

ms.newScan()
ms.firstScan(soExactValue, vtString, rtRounded, "lga+ylp+", "0", 0x00000000, 0xffffffffffffffff, "", fsmNotAligned, "",
    false, false, false, true) -- change the last true to false if you do not wish case sensitivity
ms.waitTillDone()

local listEntry = tonumber(getFoundAbsoluteAddress(true, 22));
local profileAddress = readPointer(listEntry + 15 * 8)

local searchAddressStart = profileAddress
local searchAddressEnd = profileAddress + 8 * 7 * 24

local resultStruct = ""

for index, value in ipairs({
    [1] = { variable = "playerState", bytes = "x0B x00 x00 x00 x00 x00 x00 x00", valueType = types.uint64},
    [2] = { variable = "slotId", bytes = "0x00 0x00 0x00 0x16", valueType = types.byteArr4},
    [3] = { variable = "CustomGamesNameObject_limitedTo15Chars", valueType = types.ptr},
    [4] = { variable = "nameObject", valueType = types.ptr},
    [5] = { variable = "groupsObject", valueType = types.ptr},
    [6] = { variable = "colorId", bytes = "0x17 0x00 0x00 0x00", valueType = types.uint32},
    [7] = { variable = "isAI", valueType = types.uint32},
    [8] = { variable = "slotState", bytes = "0x01 0x00 0x00 0x00", valueType = types.uint32},
    [9] = { variable = "team", valueType = types.uint32},
    [10] = { variable = "randomIndicator", bytes = "0x60 0x00 0x00 0x00", valueType = types.uint32},
    [11] = { variable = "raceId", valueType = types.uint32},
}) do
    local offset = 0
    local foundAddress = 0

    if (value.variable == "CustomGamesNameObject_limitedTo15Chars") then
        local results = findPointers(searchAddressStart, searchAddressEnd)
        foundAddress = results[1]
    elseif(value.variable == "nameObject") then
        local results = findPointers(searchAddressStart, searchAddressEnd)
        for index, value in ipairs(results) do
            if(readString(readPointer(value), 8, false) == "Pad#22587") then
                foundAddress = value
                break
            end
        end
    elseif(value.variable == "groupsObject") then
        local results = findPointers(searchAddressStart, searchAddressEnd)
        for index, value in ipairs(results) do
            local isFound = false
            for unitSelectionCount = 1, 3 do
                -- select workers 2 times to reset selection
                pressKey(0x77,250) -- f8 - selects worker
                pressKey(0x77,1000) -- f8 - selects worker
                --add aditional workers
                keyDown(0x10) --shift
                for additions = 1, unitSelectionCount - 1 do
                    pressKey(0x77,1000) -- f8 - selects worker
                end
                keyUp(0x10) --shift

                local selectedInMem = readInteger(readPointer(value) + 4*8);
                if selectedInMem ~= unitSelectionCount then --not the right address
                    break
                elseif selectedInMem == 3 then
                    isFound = true
                end
            end

            if isFound == true then
                foundAddress = value
                break
            end
        end
    elseif(value.bytes == nil) then
        foundAddress = searchAddressStart
    else
        ms.newScan()
        ms.firstScan(soExactValue, vtByteArray, nil, value.bytes, "", searchAddressStart, searchAddressEnd, "",
            fsmNotAligned, "", false, false, false, true) -- change the last true to false if you do not wish case sensitivity
        ms.waitTillDone()

        errorIf(getFoundAddressCount() == 0, "Player attrib not found " .. value.variable)
        foundAddress = tonumber(getFoundAbsoluteAddress(true))
    end


    errorIf(foundAddress == nil, "Player attrib not found " .. value.variable)
    offset = foundAddress - searchAddressStart
    errorIf(offset < 0, "Player attrib not found " .. value.variable)
    
    if offset > 0 then
        resultStruct = resultStruct .. "\tbyte unknown_" .. searchAddressStart  .. "[" .. offset .. "];\n"
    end
    resultStruct = resultStruct .. "\t" .. string.format(value.valueType, value.variable) .. ";\n"

    if value.valueType == types.uint32 or value.valueType == types.byteArr4 then
        searchAddressStart = foundAddress + 4
    else
        searchAddressStart = foundAddress + 8
    end
end

addStructToCPPExport("W3PlayerRawData", resultStruct)
disablePrivateScan()
leaveGame()
