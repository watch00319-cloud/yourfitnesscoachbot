# PowerShell script to add the WhatsApp Bot to Windows Startup
$BotPath = "$PSScriptRoot\run.bat"
$StartupPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$ShortcutPath = "$StartupPath\FitCoach_AI_Bot.lnk"

Write-Host "Creating startup shortcut..."
Write-Host "Target: $BotPath"

try {
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = "cmd.exe"
    $Shortcut.Arguments = "/c `"$BotPath`""
    $Shortcut.WorkingDirectory = "$PSScriptRoot"
    $Shortcut.Description = "Starts FitCoach AI WhatsApp Bot automatically"
    $Shortcut.WindowStyle = 7
    $Shortcut.Save()
    
    Write-Host "SUCCESS: Bot will now start automatically when Windows logs in." -ForegroundColor Green
    Write-Host "Saved to: $ShortcutPath"
} catch {
    Write-Host "ERROR: Could not create shortcut." -ForegroundColor Red
    $_.Exception.Message
}
