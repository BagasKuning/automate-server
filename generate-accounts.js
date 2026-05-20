
import fs from "fs";

const DATA_DIR = String.raw`C:\Google Chrome Portable\GoogleChromePortable\Data`;

// Ambil semua folder di dalam Data
const entries = fs
  .readdirSync(DATA_DIR, { withFileTypes: true })
  .filter((item) => item.isDirectory())
  .map((item) => item.name)
  .sort((a, b) => a.localeCompare(b));

// Generate isi file accounts.js
const output = `const ACCOUNTS = new Set([
${entries.map((name) => `  "${name}",`).join("\n")}
]);

function validateAccount(account) {
  return ACCOUNTS.has(account.toLowerCase().trim());
}

export { ACCOUNTS, validateAccount };
`;

// Pastikan folder ./data ada
fs.mkdirSync("./data", { recursive: true });

// Simpan ke ./data/accounts.js
fs.writeFileSync("./data/accounts.js", output);

console.log("✓ ./data/accounts.js generated successfully!");