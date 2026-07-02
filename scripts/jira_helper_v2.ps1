[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$configPath = "C:\Users\USER\.gemini\antigravity-ide\brain\306d1c5f-4961-4f8e-bc18-e1e0c56f6458\scratch\jira_config.json"
if (-not (Test-Path $configPath)) {
    Write-Error "Jira Config file not found at $configPath. Please make sure the config exists."
    exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json
$email = $config.email
$token = $config.api_token
$boardId = $config.board_id
$projectKey = $config.project_key

$pair = $email + ":" + $token
$bytes = [System.Text.Encoding]::ASCII.GetBytes($pair)
$base64 = [Convert]::ToBase64String($bytes)
$headers = @{
    Authorization  = "Basic $base64"
    "Content-Type" = "application/json"
}

function Get-Issues {
    $uri = "https://thousandsunsilk.atlassian.net/rest/agile/1.0/board/$boardId/issue"
    $response = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
    $response.issues | ForEach-Object {
        [PSCustomObject]@{
            Key     = $_.key
            Summary = $_.fields.summary
            Status  = $_.fields.status.name
            Sprint  = $_.fields.sprint.name
        }
    }
}

function Create-Issue([string]$summary, [string]$description) {
    $body = @{
        fields = @{
            project     = @{ key = $projectKey }
            summary     = $summary
            description = $description
            issuetype   = @{ name = "Task" }
        }
    }
    
    $createUri = "https://thousandsunsilk.atlassian.net/rest/api/2/issue"
    $json = ConvertTo-Json $body -Depth 10 -Compress
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    
    try {
        $issue = Invoke-RestMethod -Uri $createUri -Headers $headers -ContentType "application/json" -Method Post -Body $bodyBytes
        Write-Host "Created issue: $($issue.key) - $summary"
        return $issue.key
    }
    catch {
        $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $streamReader.ReadToEnd()
        Write-Host "Error creating issue: $errBody"
        throw $_
    }
}

function Delete-Issue([string]$issueKey) {
    $uri = "https://thousandsunsilk.atlassian.net/rest/api/2/issue/$issueKey"
    try {
        Invoke-RestMethod -Uri $uri -Headers $headers -Method Delete
        Write-Host "Deleted issue: $issueKey"
    }
    catch {
        Write-Host "Failed to delete issue ${issueKey}: $_"
    }
}

function Get-Sprints {
    $uri = "https://thousandsunsilk.atlassian.net/rest/agile/1.0/board/$boardId/sprint"
    try {
        $res = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
        return $res.values
    }
    catch {
        Write-Host "Error getting sprints: $_"
        return @()
    }
}

function Create-Sprint([string]$name) {
    # Check if sprint already exists
    $existing = Get-Sprints | Where-Object { $_.name -eq $name }
    if ($existing) {
        Write-Host "Sprint '$name' already exists with ID: $($existing.id)"
        return $existing.id
    }

    $body = @{
        name          = $name
        originBoardId = $boardId
    }
    $uri = "https://thousandsunsilk.atlassian.net/rest/agile/1.0/sprint"
    $json = ConvertTo-Json $body -Depth 10 -Compress
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($json)

    try {
        $res = Invoke-RestMethod -Uri $uri -Headers $headers -ContentType "application/json" -Method Post -Body $bodyBytes
        Write-Host "Created Sprint: $($res.name) with ID: $($res.id)"
        return $res.id
    }
    catch {
        throw $_
    }
}

function Assign-Issues-To-Sprint([int]$sprintId, [string[]]$issueKeys) {
    $uri = "https://thousandsunsilk.atlassian.net/rest/agile/1.0/sprint/$sprintId/issue"
    $body = @{
        issues = $issueKeys
    }
    $json = ConvertTo-Json $body -Depth 10 -Compress
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($json)

    try {
        Invoke-RestMethod -Uri $uri -Headers $headers -ContentType "application/json" -Method Post -Body $bodyBytes
        Write-Host "Assigned issues to sprint ${sprintId}: $($issueKeys -join ', ')"
    }
    catch {
        $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $streamReader.ReadToEnd()
        Write-Host "Error assigning issues to sprint: $errBody"
        throw $_
    }
}

# Run action
$action = $args[0]
if ($action -eq "list") {
    Get-Issues | Format-Table -AutoSize
}
elseif ($action -eq "delete_range") {
    $start = [int]$args[1]
    $end = [int]$args[2]
    Write-Host "Deleting issues in range ${projectKey}-${start} to ${projectKey}-${end}..."
    for ($i = $start; $i -le $end; $i++) {
        Delete-Issue -issueKey "${projectKey}-${i}"
    }
    Write-Host "Cleanup completed."
}
elseif ($action -eq "create_sprint") {
    $sprintName = $args[1]
    if (-not $sprintName) { $sprintName = "Sprint 4" }
    Create-Sprint -name $sprintName
}
elseif ($action -eq "sync_mobile_tasks") {
    $sprintName = $args[1]
    if (-not $sprintName) { $sprintName = "Sprint 4" }

    $tasksJsonPath = Join-Path $PSScriptRoot "mobile_tasks.json"
    if (-not (Test-Path $tasksJsonPath)) {
        Write-Error "Tasks JSON file not found at $tasksJsonPath"
        exit 1
    }

    Write-Host "Initializing Sprint sync..."
    $sprintId = $null
    try {
        $sprintId = Create-Sprint -name $sprintName
    }
    catch {
        Write-Host "WARNING: Current board (ID $boardId) is a Kanban board and does not support sprints. Creating tasks directly on the board backlog."
    }

    Write-Host "Loading tasks from $tasksJsonPath..."
    # Read the file explicitly as UTF8 to preserve Vietnamese accents in PowerShell
    $tasks = Get-Content $tasksJsonPath -Raw -Encoding UTF8 | ConvertFrom-Json

    Write-Host "Creating tasks..."
    $keys = @()
    foreach ($task in $tasks) {
        $keys += Create-Issue -summary $task.summary -description $task.description
    }

    if ($sprintId) {
        Write-Host "Assigning tasks to Sprint..."
        try {
            Assign-Issues-To-Sprint -sprintId $sprintId -issueKeys $keys
        }
        catch {
            Write-Host "WARNING: Failed to assign tasks to sprint: $_"
        }
    }
    else {
        Write-Host "Tasks successfully created directly on the Kanban board backlog!"
    }
    Write-Host "Jira Sync Completed!"
}
Write-Host "Jira Sync Completed successfully!"
}
