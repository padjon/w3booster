getMainForm().Caption = 'Test Engine'
getApplication().Title = 'Test Engine'

-- set warcraft window position
local BORDER_SIZE_PX=10
local TITLEBAR_SIZE_PX=40
local hwnd=executeCodeLocalEx('FindWindowA', 0, 'Warcraft III')
executeCodeLocalEx('SetWindowPos', hwnd, 0, -BORDER_SIZE_PX , -TITLEBAR_SIZE_PX, 1920 + 2*BORDER_SIZE_PX, 1080 + TITLEBAR_SIZE_PX+ BORDER_SIZE_PX, 0)

disablePrivateScan()
openProcess("Warcraft III.exe")
click(0,0, 1000)
click(1020,50, 1000)

ms=createMemScan()
fl=createFoundList(ms)
baseAddress = getAddress("Warcraft III.exe")
math.randomseed(os.time())
