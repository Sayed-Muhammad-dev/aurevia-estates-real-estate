$ErrorActionPreference = "Stop"

$Root = (Get-Location).Path
$OutputDir = Join-Path $Root "Portfolio-Screenshots"
$ChromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$Port = 9444
$BaseUrl = "http://127.0.0.1:3000"
$UserDataDir = Join-Path $Root ".tmp-chrome-screenshots-ps"

function Wait-Ms($Ms) {
  Start-Sleep -Milliseconds $Ms
}

function Invoke-Json($Url, $Method = "GET") {
  Invoke-RestMethod -Uri $Url -Method $Method
}

function Send-Cdp($Socket, [ref]$Id, $Method, $Params = @{}) {
  $Id.Value += 1
  $CallId = $Id.Value
  $Payload = @{ id = $CallId; method = $Method; params = $Params } | ConvertTo-Json -Depth 20 -Compress
  $Bytes = [System.Text.Encoding]::UTF8.GetBytes($Payload)
  $Segment = [ArraySegment[byte]]::new($Bytes)
  $Socket.SendAsync($Segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, [Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null

  while ($true) {
    $Buffer = New-Object byte[] 1048576
    $Stream = [System.IO.MemoryStream]::new()
    do {
      $Result = $Socket.ReceiveAsync([ArraySegment[byte]]::new($Buffer), [Threading.CancellationToken]::None).GetAwaiter().GetResult()
      if ($Result.MessageType -eq [System.Net.WebSockets.WebSocketMessageType]::Close) {
        throw "CDP WebSocket closed while waiting for $Method"
      }
      $Stream.Write($Buffer, 0, $Result.Count)
    } while (-not $Result.EndOfMessage)

    $Text = [System.Text.Encoding]::UTF8.GetString($Stream.ToArray())
    $Message = $Text | ConvertFrom-Json
    if ($Message.id -eq $CallId) {
      if ($Message.error) {
        throw ($Message.error | ConvertTo-Json -Compress)
      }
      return $Message.result
    }
  }
}

function Set-Viewport($Socket, [ref]$Id, $Viewport) {
  Send-Cdp $Socket $Id "Emulation.setDeviceMetricsOverride" @{
    width = $Viewport.width
    height = $Viewport.height
    deviceScaleFactor = 1
    mobile = [bool]$Viewport.mobile
  } | Out-Null
  Send-Cdp $Socket $Id "Emulation.setPageScaleFactor" @{ pageScaleFactor = 1 } | Out-Null
}

function Invoke-Evaluate($Socket, [ref]$Id, $Expression) {
  Send-Cdp $Socket $Id "Runtime.evaluate" @{
    expression = $Expression
    awaitPromise = $true
    userGesture = $true
  } | Out-Null
}

function Wait-ForPage($Socket, [ref]$Id) {
  Wait-Ms 900
  Invoke-Evaluate $Socket $Id @"
Promise.all([
  document.fonts ? document.fonts.ready : Promise.resolve(),
  new Promise((resolve) => {
    if (document.readyState === "complete") resolve(true);
    else window.addEventListener("load", () => resolve(true), { once: true });
  }),
  new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      const imgs = Array.from(document.images);
      const ready = imgs.every((img) => img.complete && img.naturalWidth > 0);
      if (ready || Date.now() - started > 4500) resolve(true);
      else setTimeout(tick, 150);
    };
    tick();
  })
])
"@
  Wait-Ms 500
}

function Go-To($Socket, [ref]$Id, $Url, $Viewport) {
  Set-Viewport $Socket $Id $Viewport
  Send-Cdp $Socket $Id "Page.navigate" @{ url = "$BaseUrl$Url" } | Out-Null
  Wait-ForPage $Socket $Id
}

function Save-Screenshot($Socket, [ref]$Id, $Name) {
  $Result = Send-Cdp $Socket $Id "Page.captureScreenshot" @{
    format = "png"
    fromSurface = $true
    captureBeyondViewport = $false
  }
  [System.IO.File]::WriteAllBytes((Join-Path $OutputDir $Name), [Convert]::FromBase64String($Result.data))
}

function Get-PngInfo($Path) {
  $Bytes = [System.IO.File]::ReadAllBytes($Path)
  [PSCustomObject]@{
    file = [System.IO.Path]::GetFileName($Path)
    width = [System.Net.IPAddress]::NetworkToHostOrder([BitConverter]::ToInt32($Bytes, 16))
    height = [System.Net.IPAddress]::NetworkToHostOrder([BitConverter]::ToInt32($Bytes, 20))
    bytes = $Bytes.Length
  }
}

$Desktop = @{ width = 1920; height = 1080; mobile = $false }
$Laptop = @{ width = 1440; height = 900; mobile = $false }
$Tablet = @{ width = 768; height = 1024; mobile = $true }
$Mobile = @{ width = 390; height = 844; mobile = $true }

$Shots = @(
  @{ name = "01-home.png"; url = "/"; viewport = $Desktop },
  @{ name = "02-listings.png"; url = "/listings"; viewport = $Desktop },
  @{ name = "03-listings-filters-search.png"; url = "/listings?query=Miami&mode=buy&location=Miami"; viewport = $Desktop },
  @{ name = "04-property-detail.png"; url = "/properties/serenity-cliffside-villa-malibu"; viewport = $Desktop },
  @{ name = "05-agents.png"; url = "/agents"; viewport = $Desktop },
  @{ name = "06-agent-profile.png"; url = "/agents/elena-marchetti"; viewport = $Desktop },
  @{ name = "07-mortgage-calculator.png"; url = "/mortgage"; viewport = $Desktop },
  @{ name = "08-booking-calendar-form.png"; url = "/booking?property=serenity-cliffside-villa-malibu"; viewport = $Desktop },
  @{ name = "09-contact-form.png"; url = "/contact?property=serenity-cliffside-villa-malibu"; viewport = $Desktop },
  @{ name = "10-saved-properties.png"; url = "/saved"; viewport = $Desktop },
  @{ name = "11-search-page.png"; url = "/search"; viewport = $Desktop },
  @{ name = "12-login.png"; url = "/login"; viewport = $Desktop },
  @{ name = "13-register.png"; url = "/register"; viewport = $Desktop },
  @{ name = "14-mobile-dashboard.png"; url = "/"; viewport = $Mobile },
  @{ name = "15-tablet-dashboard.png"; url = "/"; viewport = $Tablet },
  @{ name = "16-navigation-open.png"; url = "/"; viewport = $Mobile; prepare = "document.querySelector('button[aria-label=""Toggle menu""]')?.click(); true;" },
  @{ name = "17-navigation-desktop.png"; url = "/"; viewport = $Desktop },
  @{ name = "18-modal.png"; url = "/booking"; viewport = $Desktop; prepare = @"
(async () => {
  const fields = Array.from(document.querySelectorAll("label"));
  const setByLabel = (text, value) => {
    const label = fields.find((entry) => entry.textContent.includes(text));
    const el = label?.querySelector("input, textarea, select");
    if (!el) return;
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };
  setByLabel("Name", "Sayed Muhammad");
  setByLabel("Email", "client@example.com");
  setByLabel("Phone", "+1 555 010 3344");
  setByLabel("Preferred date", "2026-08-15");
  setByLabel("Preferred time", "14:30");
  setByLabel("Message", "Portfolio screenshot booking flow.");
  document.querySelector('form button[type="submit"]')?.click();
  await new Promise((resolve) => setTimeout(resolve, 700));
  return true;
})();
"@ },
  @{ name = "19-dropdown-menu.png"; url = "/"; viewport = $Mobile; prepare = "document.querySelector('button[aria-label=""Toggle menu""]')?.click(); true;" },
  @{ name = "20-responsive-laptop.png"; url = "/"; viewport = $Laptop },
  @{ name = "21-dark-mode-home.png"; url = "/"; viewport = $Desktop; prepare = "localStorage.setItem('aurevia-theme', 'dark'); document.documentElement.classList.add('dark'); true;" },
  @{ name = "22-light-mode-components.png"; url = "/listings"; viewport = $Desktop; prepare = "localStorage.setItem('aurevia-theme', 'light'); document.documentElement.classList.remove('dark'); true;" },
  @{ name = "23-property-gallery-modal.png"; url = "/properties/serenity-cliffside-villa-malibu"; viewport = $Desktop; prepare = "Array.from(document.querySelectorAll('button')).find((b) => b.textContent.includes('View gallery') || b.getAttribute('aria-label')?.includes('Open'))?.click(); true;" },
  @{ name = "24-responsive-tablet-listings.png"; url = "/listings"; viewport = $Tablet },
  @{ name = "25-responsive-mobile-listings.png"; url = "/listings"; viewport = $Mobile }
)

Remove-Item -LiteralPath $UserDataDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

$Args = @(
  "--headless=new",
  "--remote-debugging-port=$Port",
  "--remote-debugging-address=127.0.0.1",
  "--remote-allow-origins=*",
  "--user-data-dir=$UserDataDir",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-extensions",
  "--disable-sync",
  "--disable-background-networking",
  "about:blank"
)
$Process = Start-Process -FilePath $ChromePath -ArgumentList $Args -PassThru -WindowStyle Hidden

try {
  for ($i = 0; $i -lt 40; $i++) {
    try {
      Invoke-Json "http://127.0.0.1:$Port/json/version" | Out-Null
      break
    } catch {
      Wait-Ms 250
    }
  }

  $Target = Invoke-Json "http://127.0.0.1:$Port/json/new?about:blank" "PUT"
  $Socket = [System.Net.WebSockets.ClientWebSocket]::new()
  $Socket.ConnectAsync([Uri]$Target.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult()
  $Id = 0
  Send-Cdp $Socket ([ref]$Id) "Page.enable" | Out-Null
  Send-Cdp $Socket ([ref]$Id) "Runtime.enable" | Out-Null

  foreach ($Shot in $Shots) {
    Go-To $Socket ([ref]$Id) $Shot.url $Shot.viewport
    if ($Shot.prepare) {
      Invoke-Evaluate $Socket ([ref]$Id) $Shot.prepare
      Wait-ForPage $Socket ([ref]$Id)
    }
    Save-Screenshot $Socket ([ref]$Id) $Shot.name
    Write-Host "captured $($Shot.name)"
  }

  $Socket.Dispose()
  $Report = Get-ChildItem -Path $OutputDir -Filter *.png | Sort-Object Name | ForEach-Object { Get-PngInfo $_.FullName }
  $Report | ConvertTo-Json -Depth 4 | Set-Content -Path (Join-Path $OutputDir "screenshot-report.json")
  $Report | Format-Table -AutoSize
} finally {
  if ($Process -and -not $Process.HasExited) {
    Stop-Process -Id $Process.Id -Force
  }
}
