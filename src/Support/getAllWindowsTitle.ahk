FileEncoding, CP65001
Sleep, 1500
WinGet windows, List
Loop %windows%
{
    id := windows%A_Index%
    WinGetTitle wt, ahk_id %id%
    FileAppend %wt% . `n , C:\Users\william\Desktop\Reinf\titulos.txt
}