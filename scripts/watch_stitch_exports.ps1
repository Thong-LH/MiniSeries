[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$sourceDir = "C:\Users\USER\antigravity"
$targetDir = "c:\Users\USER\.gemini\antigravity\scratch\MiniSeries\MiniSeries-Studio"

Write-Host "Starting Stitch Export Watcher on $sourceDir..."
Write-Host "Monitoring for new folders and syncing to $targetDir..."

# Initial cleanup of any trailing slash issues and sync of the latest folder
$latestFolder = Get-ChildItem -Path $sourceDir -Directory -Filter "MiniSeries-Studio-*" | 
                Sort-Object LastWriteTime -Descending | 
                Select-Object -First 1

if ($latestFolder) {
    Write-Host "Syncing initial state from latest folder: $($latestFolder.FullName)"
    Copy-Item -Path "$($latestFolder.FullName)\*" -Destination $targetDir -Recurse -Force
}

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $sourceDir
$watcher.Filter = "MiniSeries-Studio-*"
$watcher.EnableRaisingEvents = $true

$onCreated = Register-ObjectEvent $watcher -EventName "Created" -Action {
    $path = $EventArgs.FullPath
    Write-Host "`n[Watcher] New export detected: $path"
    
    # Wait briefly for the browser/Stitch to finish writing the files
    Start-Sleep -Milliseconds 800
    
    try {
        Copy-Item -Path "$path\*" -Destination $targetDir -Recurse -Force
        Write-Host "[Watcher] Successfully synced new export to workspace!"
    } catch {
        Write-Host "[Watcher] Error syncing files: $_"
    }
}

# Keep the script running to listen to events
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Unregister-Event -SourceIdentifier $onCreated.Name
    $watcher.Dispose()
    Write-Host "Watcher stopped."
}
