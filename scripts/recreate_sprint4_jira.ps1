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
    Authorization = "Basic $base64"
    "Content-Type" = "application/json"
}

function Create-JiraIssue([string]$summary, [string]$description, [string]$issueType, [string]$parentKey) {
    $body = @{
        fields = @{
            project   = @{ key = $projectKey }
            summary   = $summary
            description = $description
            issuetype = @{ name = $issueType }
        }
    }
    if (-not [string]::IsNullOrEmpty($parentKey)) {
        $body.fields.Add("parent", @{ key = $parentKey })
    }
    
    $createUri = "https://thousandsunsilk.atlassian.net/rest/api/2/issue"
    $json = ConvertTo-Json $body -Depth 10 -Compress
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    
    try {
        $response = Invoke-RestMethod -Uri $createUri -Headers $headers -ContentType "application/json" -Method Post -Body $bodyBytes
        Write-Host "Created ${issueType}: $($response.key) - $summary"
        return $response.key
    } catch {
        $streamReader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $streamReader.ReadToEnd()
        Write-Host "Error creating issue '$summary': $errBody"
        throw $_
    }
}

function Delete-JiraIssue([string]$issueKey) {
    $uri = "https://thousandsunsilk.atlassian.net/rest/api/2/issue/$issueKey"
    try {
        Invoke-RestMethod -Uri $uri -Headers $headers -Method Delete
        Write-Host "Deleted issue: $issueKey"
    } catch {
        Write-Host "Failed to delete issue ${issueKey}: $_"
    }
}

# --- STEP 1: CLEANUP OLD CORRUPTED ISSUES ---
Write-Host "Cleaning up old corrupted issues..."
# Delete KAN-43 to KAN-79 (Covers all previous Sprint 4 Epic, Tasks, and Subtasks)
for ($i = 43; $i -le 79; $i++) {
    Delete-JiraIssue -issueKey "KAN-$i"
}

# --- STEP 2: LOAD ACCENTED DATA ---
$sprint4TasksPath = Join-Path $PSScriptRoot "sprint4_tasks.json"
$mobileTasksPath = Join-Path $PSScriptRoot "mobile_tasks.json"

$sprint4Data = Get-Content $sprint4TasksPath -Raw -Encoding UTF8 | ConvertFrom-Json
$mobileData = Get-Content $mobileTasksPath -Raw -Encoding UTF8 | ConvertFrom-Json

# --- STEP 3: CREATE EPIC ---
Write-Host "`nCreating Epic..."
$epicKey = Create-JiraIssue -summary $sprint4Data.epic.summary `
                            -description $sprint4Data.epic.description `
                            -issueType "Epic" `
                            -parentKey $null

# --- STEP 4: CREATE TASKS UNDER EPIC ---
Write-Host "`nCreating Tasks under Epic ${epicKey}..."
$mobileAppTaskKey = $null

foreach ($task in $sprint4Data.mainTasks) {
    $taskKey = Create-JiraIssue -summary $task.summary `
                                -description $task.description `
                                -issueType "Task" `
                                -parentKey $epicKey
    
    if ($task.isMobileApp) {
        $mobileAppTaskKey = $taskKey
    }
}

# --- STEP 5: CREATE MOBILE SUBTASKS ---
if ($mobileAppTaskKey) {
    Write-Host "`nCreating Mobile Subtasks under parent Task ${mobileAppTaskKey}..."
    foreach ($subtask in $mobileData) {
        Create-JiraIssue -summary $subtask.summary `
                         -description $subtask.description `
                         -issueType "Subtask" `
                         -parentKey $mobileAppTaskKey
    }
} else {
    Write-Warning "Mobile App Task Key was not found. Skipping Subtasks."
}

Write-Host "`nSprint 4 rebuild completed successfully!"
