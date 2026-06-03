param(
    [string]$BaseUrl = "http://localhost:5137",
    [string]$Email = "luonghoangthong@gmail.com",
    [string]$Password = $env:MINISERIES_TEST_PASSWORD,
    [decimal]$PaymentAmount = 12345,
    [string]$PlanName = "Basic",
    [int]$Generations = 30,
    [switch]$KeepServer
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$base = $BaseUrl.TrimEnd("/")
$uri = [Uri]$base
$port = $uri.Port
$startedServer = $false

function Write-Step([string]$message) {
    Write-Host "[..] $message" -ForegroundColor Cyan
}

function Write-Pass([string]$message) {
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Assert-True([bool]$condition, [string]$message) {
    if (-not $condition) {
        throw $message
    }
}

function Invoke-Json {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [int]$TimeoutSec = 30
    )

    $params = @{
        Uri = $Url
        Method = $Method
        Headers = $Headers
        ContentType = "application/json"
        TimeoutSec = $TimeoutSec
    }

    if ($null -ne $Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
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
            return [pscustomobject]@{
                Ok = $false
                StatusCode = [int]$response.StatusCode
                Body = $null
                BodyText = $reader.ReadToEnd()
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

function Test-ServerReady {
    try {
        $response = Invoke-WebRequest -Uri "$base/home.html" -UseBasicParsing -TimeoutSec 5
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

function Get-ServerProcessId {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
        Where-Object { $_.State -eq "Listen" } |
        Select-Object -First 1

    if ($conn) {
        return $conn.OwningProcess
    }

    return $null
}

try {
    if ([string]::IsNullOrWhiteSpace($Password)) {
        throw "Missing test password. Pass -Password or set MINISERIES_TEST_PASSWORD."
    }

    if (-not (Test-ServerReady)) {
        Write-Step "Starting MiniSeries.WebAPI on $base"
        $out = Join-Path $repoRoot "mini-webapi.out.log"
        $err = Join-Path $repoRoot "mini-webapi.err.log"

        Start-Process -FilePath "dotnet" `
            -ArgumentList @("run", "--project", "MiniSeries.WebAPI", "--launch-profile", "http") `
            -WorkingDirectory $repoRoot `
            -RedirectStandardOutput $out `
            -RedirectStandardError $err `
            -WindowStyle Hidden | Out-Null

        $startedServer = $true

        $ready = $false
        for ($i = 0; $i -lt 30; $i++) {
            Start-Sleep -Seconds 2
            if (Test-ServerReady) {
                $ready = $true
                break
            }
        }

        if (-not $ready) {
            if (Test-Path $err) {
                Get-Content $err | Select-Object -Last 80
            }
            throw "Server did not become ready at $base."
        }
    }
    else {
        Write-Step "Using already running server at $base"
    }

    Write-Step "Checking static home page"
    Assert-True (Test-ServerReady) "home.html did not return 200."
    Write-Pass "home.html returns 200"

    Write-Step "Checking protected endpoint without token"
    $anonymousLessons = Invoke-Json -Method Get -Url "$base/api/lessons/my"
    Assert-True ($anonymousLessons.StatusCode -eq 401) "Expected /api/lessons/my without token to return 401."
    Write-Pass "protected endpoint returns 401 without token"

    Write-Step "Logging in test customer"
    $login = Invoke-Json -Method Post -Url "$base/api/auth/login-profile" -Body @{
        email = $Email
        password = $Password
    }
    Assert-True $login.Ok "Login failed: $($login.BodyText)"
    Assert-True (-not [string]::IsNullOrWhiteSpace($login.Body.accessToken)) "Login response did not include accessToken."
    Assert-True (-not [string]::IsNullOrWhiteSpace($login.Body.userId)) "Login response did not include userId."
    Write-Pass "login succeeded for $Email"

    $headers = @{ Authorization = "Bearer $($login.Body.accessToken)" }
    $userId = $login.Body.userId

    Write-Step "Checking profile quota"
    $profile = Invoke-Json -Method Get -Url "$base/api/profile/$userId" -Headers $headers
    Assert-True $profile.Ok "Profile request failed: $($profile.BodyText)"
    Assert-True ($profile.Body.email -eq $Email) "Profile email mismatch."
    Assert-True ($null -ne $profile.Body.remainingGenerationCount) "Profile did not return remainingGenerationCount."
    Write-Pass "profile quota returned plan=$($profile.Body.planName), remaining=$($profile.Body.remainingGenerationCount)"

    Write-Step "Checking owned lesson history"
    $myLessons = Invoke-Json -Method Get -Url "$base/api/lessons/my" -Headers $headers
    Assert-True $myLessons.Ok "GET /api/lessons/my failed: $($myLessons.BodyText)"
    Write-Pass "GET /api/lessons/my returned $(@($myLessons.Body).Count) item(s)"

    Write-Step "Checking missing lesson returns 404"
    $missingLesson = Invoke-Json -Method Get -Url "$base/api/lessons/00000000-0000-0000-0000-000000000001" -Headers $headers
    Assert-True ($missingLesson.StatusCode -eq 404) "Expected missing lesson to return 404."
    Write-Pass "missing lesson returns 404"

    Write-Step "Creating mock payment invoice"
    $invoice = Invoke-Json -Method Post -Url "$base/api/payment/create-invoice" -Headers $headers -Body @{
        amount = $PaymentAmount
        tokens = $Generations
        planName = $PlanName
    }
    Assert-True $invoice.Ok "Create invoice failed: $($invoice.BodyText)"
    Assert-True (-not [string]::IsNullOrWhiteSpace($invoice.Body.paymentCode)) "Invoice did not include paymentCode."
    $paymentCode = $invoice.Body.paymentCode
    Write-Pass "created invoice orderId=$($invoice.Body.orderId), code=$paymentCode, status=$($invoice.Body.status)"

    Write-Step "Checking invoice pending status"
    $pending = Invoke-Json -Method Get -Url "$base/api/payment/check-status?code=$paymentCode" -Headers $headers
    Assert-True $pending.Ok "Pending status check failed: $($pending.BodyText)"
    Assert-True (-not [bool]$pending.Body.isPaid) "Expected invoice to be pending before webhook."
    Write-Pass "invoice is pending before webhook"

    Write-Step "Calling mock bank webhook"
    $webhook = Invoke-Json -Method Post -Url "$base/api/payment/bank-webhook" -Body @{
        content = "SMOKE TEST PAYMENT $paymentCode MiniSeries"
        transferAmount = $PaymentAmount
        amount = $PaymentAmount
    }
    Assert-True $webhook.Ok "Bank webhook failed: $($webhook.BodyText)"
    Assert-True ($webhook.Body.status -eq "Paid") "Webhook did not mark order as Paid."
    Write-Pass "bank webhook marked order as Paid"

    Write-Step "Checking paid status"
    $paid = Invoke-Json -Method Get -Url "$base/api/payment/check-status?code=$paymentCode" -Headers $headers
    Assert-True $paid.Ok "Paid status check failed: $($paid.BodyText)"
    Assert-True ([bool]$paid.Body.isPaid) "Expected invoice to be paid after webhook."
    Write-Pass "invoice is paid after webhook"

    Write-Host ""
    Write-Host "Smoke test passed." -ForegroundColor Green
}
catch {
    Write-Host ""
    Write-Host "Smoke test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    if ($startedServer -and -not $KeepServer) {
        $pidToStop = Get-ServerProcessId
        if ($pidToStop) {
            Stop-Process -Id $pidToStop -Force
            Write-Host "Stopped server process $pidToStop" -ForegroundColor DarkGray
        }
    }
}
