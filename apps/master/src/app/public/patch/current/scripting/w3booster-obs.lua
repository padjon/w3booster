local ffi =require("ffi")
local json = require "json"
local obs = obslua

local w3blib
local w3blibPath
local w3blibSourcePath

local updateTimer

local x = {}
x.customers = {}
table.insert(x.customers, "Hello")
table.insert(x.customers, "World")

local result = json.encode(x);

ffi.cdef[[
   const char* GetOBSCommands();
   void SendOBSResults(const char* );
   bool SetDllDirectoryA(char* lpPathName);
]]

function file_exists(name)
   local f=io.open(name,"r")
   if f~=nil then io.close(f) return true else return false end
end

function copyFile(from, to)
  os.execute(string.format('copy "%s" "%s" >nul 2>nul', from, to))
end

function script_load()
    print "W3Booster Script 1.0 initializing"
    local path = script_path()
    w3blibPath = path.. "working\\"
    w3blibSourcePath = path.. "app\\current\\"
    os.execute("mkdir " .. w3blibPath .. " >nul 2>nul")
    
    local cpath = ffi.new("char[?]", #w3blibSourcePath)
    ffi.copy(cpath, w3blibSourcePath)
    ffi.C.SetDllDirectoryA(cpath)
    
    if not (obslua == nil) then
      updateTimer = obslua.timer_add(onUpdate, 1000)
    end
end

function script_unload()
  obslua.timer_remove(updateTimer)
end


function onUpdate()
  i = 0
    if w3blib == nil then
      local source = w3blibSourcePath
      local target = w3blibPath .."w3blib.dll"
      if(os.getenv"PROCESSOR_ARCHITECTURE" == "x86") then
        source = source .."w3blib.x86.dll"
      else
        source = source .."w3blib.dll"
      end          
      copyFile(source, target)
      w3blib=ffi.load(target)
      getSources()
    else 
      commands = nil
      commands = ffi.string(w3blib.GetOBSCommands())
      if(#commands > 0) then
        for rawCommand in commands:gmatch("[^\r\n]+") do
          print("incoming event: " .. rawCommand)
          local command = json.decode(rawCommand);
          if(command.command == "SWITCH_SCENE") then 
            switchScene(command.scene)
          elseif (command.command == "SHOW_SOURCE") then
            setSourceVisibility(command.scene, command.id, true)
          elseif (command.command == "HIDE_SOURCE") then
            setSourceVisibility(command.scene, command.id, false)
          end
          --local cmdExec = loadstring("getSources()")
          --cmdExec()
        end
      end
    end
  end


function getSources()
  local result = {}
  local sceneSources = obs.obs_frontend_get_scenes()
  for _, sceneSource in ipairs(sceneSources) do
    local scene = obs.obs_scene_from_source(sceneSource)
    local scenename = obs.obs_source_get_name(sceneSource)
    local jsonScene = {}
    jsonScene.name=scenename
    jsonScene.sources = {}
    local sceneitems = obs.obs_scene_enum_items(scene)
    if sceneitems ~= nil then
      for _, sceneitem in ipairs(sceneitems) do
        local source = obs.obs_sceneitem_get_source(sceneitem)
        local name = obs.obs_source_get_name(source)
        local jsonSource = {}
        jsonSource.name = name
        jsonSource.id = obs.obs_sceneitem_get_id(sceneitem)
        table.insert(jsonScene.sources, jsonSource)
      end
    end
    table.insert(result, jsonScene)
    obs.sceneitem_list_release(sceneitems)
  end
  
  print("detected scenes and sources:")
  print(json.encode(result))
  w3blib.SendOBSResults(json.encode(result))
  obs.source_list_release(sceneSources)
end

function findSourceByName(source_list, name)
  for i, source in pairs(source_list) do
    source_name = obs.obs_source_get_name(source)
    if source_name == name then
      return source
    end
  end
  return nil
end

function switchScene(targetSceneName)
  local scenes = obs.obs_frontend_get_scenes()
  local switch_scene = findSourceByName(scenes, targetSceneName)
  obs.obs_frontend_set_current_scene(switch_scene)
  obs.source_list_release(scenes)
end


function setSourceVisibility(targetSceneName, targetSourceId, visibility)
  local scenes = obs.obs_frontend_get_scenes()
  local sceneSource = findSourceByName(scenes, targetSceneName)
  local scene = obs.obs_scene_from_source(sceneSource)
  
  local sceneitems = obs.obs_scene_enum_items(scene)
  if sceneitems ~= nil then
    for _, sceneitem in ipairs(sceneitems) do
      local source = obs.obs_sceneitem_get_source(sceneitem)
      local name = obs.obs_source_get_name(source)
      if (obs.obs_sceneitem_get_id(sceneitem) == targetSourceId) then
        obs.obs_sceneitem_set_visible(sceneitem, visibility)
        obs.obs_source_set_enabled(source, true)
      end
    end
  end

  obs.sceneitem_list_release(sceneitems)
  obs.source_list_release(scenes)
end

-- debug stuff in IDE
if(script_path == nil) then
    function script_path() 
      return "C:\\Users\\Padjo.DEVSHEEP-TOWER\\AppData\\Roaming\\W3Booster\\"
    end
    script_load()
    onUpdate()
    onUpdate()
end

