param(
    [string]$BaseUrl = "http://localhost:5088",
    [string]$EmailInput = "",
    [string]$Password = "TestPassword123!"
)

$ErrorActionPreference = "Stop"

$base = $BaseUrl.TrimEnd("/")
$rand = Get-Random -Minimum 1000 -Maximum 9999
$targetEmail = ""
$fullName = "Test Manga User"

function Write-Step([string]$message) {
    Write-Host "[..] $message" -ForegroundColor Cyan
}

function Write-Pass([string]$message) {
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Invoke-Json {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [int]$TimeoutSec = 180
    )

    $params = @{
        Uri = $Url
        Method = $Method
        Headers = $Headers
        ContentType = "application/json"
        TimeoutSec = $TimeoutSec
    }

    if ($null -ne $Body) {
        $jsonStr = $Body | ConvertTo-Json -Depth 10
        $params.Body = [System.Text.Encoding]::UTF8.GetBytes($jsonStr)
    }

    try {
        $data = Invoke-RestMethod @params
        return [pscustomobject]@{
            Ok = $true
            StatusCode = 200
            Body = $data
            BodyText = $null
        }
    }
    catch {
        $response = $_.Exception.Response
        if ($response) {
            $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
            $headersText = ""
            if ($response.Headers) {
                $headersText = ($response.Headers.AllKeys | ForEach-Object { "$_=$($response.Headers[$_])" }) -join "; "
            }
            return [pscustomobject]@{
                Ok = $false
                StatusCode = [int]$response.StatusCode
                Body = $null
                BodyText = "Headers=[$headersText] | Body=[$($reader.ReadToEnd())]"
            }
        }

        return [pscustomobject]@{
            Ok = $false
            StatusCode = 0
            Body = $null
            BodyText = $_.Exception.Message
        }
    }
}

try {
    $accessToken = $null
    $userId = $null

    if ([string]::IsNullOrWhiteSpace($EmailInput)) {
        $targetEmail = "test-manga-$rand@miniseries.com"
        Write-Step "1. Registering new test user: $targetEmail"
        $reg = Invoke-Json -Method Post -Url "$base/api/auth/register-profile" -Body @{
            email = $targetEmail
            password = $Password
            fullName = $fullName
        }
        if (-not $reg.Ok) {
            throw "Registration failed: $($reg.BodyText)"
        }
        $otpCode = $reg.Body.otpCode
        Write-Pass "Registration requested. OTP Code is: $otpCode"

        Write-Step "2. Verifying OTP"
        $verify = Invoke-Json -Method Post -Url "$base/api/auth/verify-otp" -Body @{
            email = $targetEmail
            otpCode = $otpCode
            fullName = $fullName
        }
        if (-not $verify.Ok) {
            throw "OTP verification failed: $($verify.BodyText)"
        }
        $accessToken = $verify.Body.accessToken
        $userId = $verify.Body.userId
        Write-Pass "OTP Verified. AccessToken received. User ID: $userId"
    } else {
        $targetEmail = $EmailInput
        Write-Step "1 & 2. Logging in existing user: $targetEmail"
        $login = Invoke-Json -Method Post -Url "$base/api/auth/login-profile" -Body @{
            email = $targetEmail
            password = $Password
        }
        if (-not $login.Ok) {
            throw "Login failed: $($login.BodyText)"
        }
        $accessToken = $login.Body.accessToken
        $userId = $login.Body.userId
        Write-Pass "Logged in successfully! AccessToken received. User ID: $userId"
    }

    $headers = @{ Authorization = "Bearer $accessToken" }

    Write-Step "3. Checking User Quota"
    $profile = Invoke-Json -Method Get -Url "$base/api/profile/$userId" -Headers $headers
    if (-not $profile.Ok) {
        throw "Profile check failed: Status=$($profile.StatusCode), Body=$($profile.BodyText)"
    }
    $mangaLimit = $profile.Body.mangaMonthlyLimit
    $usedManga = $profile.Body.usedMangaCount
    Write-Pass "Quota: Manga limit=$mangaLimit, Used=$usedManga"

    Write-Step "4. Creating Manga Lesson Draft"
    $draft = Invoke-Json -Method Post -Url "$base/api/lessons/drafts" -Headers $headers -Body @{
        title = "Du hanh thoi gian"
        rawContent = "Ke cau chuyen ve Nam di tham hiem hanh tinh Kepler trong 5 nam can toc do anh sang, khi quay ve Trai Dat Nam van tre con ban Nam la Minh da gia toc bac pho."
        creativeMode = 0
        creativeBrief = "Vui tuoi, sinh dong, de hieu cho tre em"
        generateVideo = $false
    }
    if (-not $draft.Ok) {
        throw "Draft creation failed: $($draft.BodyText)"
    }
    $lessonId = $draft.Body.id
    $overallScript = $draft.Body.overallScript
    Write-Pass "Draft created successfully! Lesson ID: $lessonId"
    Write-Host "Overall Script Preview:`n$overallScript" -ForegroundColor DarkGray

    Write-Step "5. Approving Lesson Script (Starting actual Manga parallel generation...)"
    $approve = Invoke-Json -Method Post -Url "$base/api/lessons/$lessonId/approve" -Headers $headers -Body @{
        overallScript = $overallScript
    }
    if (-not $approve.Ok) {
        throw "Approval failed: $($approve.BodyText)"
    }
    Write-Pass "Lesson approved! Background job started."

    Write-Step "6. Polling generation status"
    $completed = $false
    $attempts = 0
    $maxAttempts = 30 # Poll for up to 5 minutes

    while (-not $completed -and $attempts -lt $maxAttempts) {
        Start-Sleep -Seconds 10
        $attempts++
        
        $status = Invoke-Json -Method Get -Url "$base/api/lessons/$lessonId" -Headers $headers
        if (-not $status.Ok) {
            Write-Warning "Status poll failed: $($status.BodyText)"
            continue
        }

        $lesson = $status.Body
        $job = $lesson.generationJobs | Where-Object { $_.type -eq "MediaGeneration" -or $_.type -eq 2 } | Sort-Object createdAt -Descending | Select-Object -First 1

        if ($null -ne $job) {
            $step = $job.currentStep
            $jobStatus = $job.status
            $err = $job.errorMessage
            
            Write-Host "[$attempts] Job Status: $jobStatus | Current Step: $step" -ForegroundColor Yellow
            
            # Print last log if available
            if ($job.logs.Count -gt 0) {
                $lastLog = $job.logs | Sort-Object id -Descending | Select-Object -First 1
                Write-Host "   > Log: $($lastLog.message)" -ForegroundColor DarkGray
            }

            if ($jobStatus -eq "Completed" -or $jobStatus -eq 2) {
                $completed = $true
                Write-Pass "Manga Generation Job Completed Successfully!"
                
                # Print chapter media links
                Write-Host "`nGenerated Chapter Media URLs:" -ForegroundColor Green
                foreach ($c in $lesson.chapters) {
                    Write-Host "  Chapter $($c.order): $($c.summary)"
                    Write-Host "    - Image URL: $($c.mangaUrl)" -ForegroundColor Cyan
                }
                break
            }
            elseif ($jobStatus -eq "Failed" -or $jobStatus -eq 3) {
                throw "Job failed with error: $err"
            }
        }
        else {
            Write-Host "[$attempts] Waiting for job to register..." -ForegroundColor Yellow
        }
    }

    if (-not $completed) {
        throw "Timeout waiting for Manga generation to complete."
    }

    Write-Host "`nFull flow test PASSED!" -ForegroundColor Green
}
catch {
    Write-Host "`nFull flow test FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
