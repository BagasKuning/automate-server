simple flow: Client → API Server → Queue → Worker (Puppeteer) → Gmail → Ambil OTP → Response

setup profile by cli( PowerShell ):
```js
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir="C:\Google Chrome Portable\GoogleChromePortable\Data\name@mail.com"
```

sync whitelist profile:
```js
node generate-accounts.js
```