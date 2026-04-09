$mysqlBase = "C:\mullem\mysql-9.6.0-winx64"
$defaults = "C:\mullem\mysql.my.ini"
$dataDir = "C:\mullem\mysql-data"

if (!(Test-Path $mysqlBase)) {
  throw "MySQL base directory was not found: $mysqlBase"
}

if (!(Test-Path $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
}

$mysqld = Join-Path $mysqlBase "bin\mysqld.exe"
$mysqlAdmin = Join-Path $mysqlBase "bin\mysqladmin.exe"
$pidFile = Join-Path $dataDir "mysql.pid"

if (!(Test-Path (Join-Path $dataDir "mysql"))) {
  & $mysqld --defaults-file=$defaults --initialize-insecure --console
  if ($LASTEXITCODE -ne 0) {
    throw "MySQL initialization failed with exit code $LASTEXITCODE"
  }
}

$existing = Get-CimInstance Win32_Process -Filter "name = 'mysqld.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -like '*C:\mullem\mysql.my.ini*' }

if ($existing) {
  Write-Output "MySQL already running"
  exit 0
}

if (Test-Path $pidFile) {
  Remove-Item -LiteralPath $pidFile -Force -ErrorAction SilentlyContinue
}

$commandLine = "`"$mysqld`" --defaults-file=$defaults"
$result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
  CommandLine = $commandLine
  CurrentDirectory = $mysqlBase
}

if ($result.ReturnValue -ne 0) {
  throw "Failed to launch MySQL. Win32_Process.Create returned $($result.ReturnValue)."
}

for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1

  try {
    $connected = & $mysqlAdmin --protocol=TCP --host=127.0.0.1 --port=3306 --user=root ping 2>$null
    $connected = ($LASTEXITCODE -eq 0)
  } catch {
    $connected = $false
  }

  if ($connected) {
    Write-Output $result.ProcessId
    exit 0
  }
}

throw "MySQL server did not become ready on port 3306 in time."
