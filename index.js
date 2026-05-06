import express from "express";
import puppeteer from "puppeteer";
import { waitForTimeout } from "./utils.js";
import { findRowBySubject, getNetflixOTP } from "./puppeteer-function.js";

const app = express();
app.use(express.json());

// ===== CONFIG =====
const PORT = 3000;
const MAX_WORKERS = 2;

const ACCOUNTS = [
  "amrinahafidza@gmail.com",
  "mmie64812@gmail.com",
  "mnasi2528@gmail.com",
  "dwibagaskara66@gmail.com",
];

// ===== STATE =====
const queue = [];
let activeWorkers = 0;

// ===== API =====
app.post("/get-otp", (req, res) => {
  const requestId = Date.now();

  const account = req.body.account;
  if (!account) throw new Error('Missing "account" in req body.');

  queue.push({ requestId, res, account });

  console.log("📥 Job masuk:", requestId, "->", account);
});

async function getOTP(page) {
  try {
    const row = await findRowBySubject(page, [
      "Netflix: Kode masukmu",
      // "Kode akses sementara Netflix-mu",
    ]);

    if (!row) throw new Error("Inbox not found");

    await row.evaluate((el) => {
      el.closest("tr")?.click();
    });

    const otp = await getNetflixOTP(page);

    return otp;
  } catch (err) {
    if (err.name === "TimeoutError") {
      throw new Error("GMAIL_TIMEOUT");
    }
    throw err;
  }
}

// ===== RUN JOB =====
async function runJob(job) {
  // limit concurrency
  while (activeWorkers >= MAX_WORKERS) {
    await waitForTimeout(200);
  }

  activeWorkers++;

  let browser;

  try {
    console.log(`🚀 Start ${job.requestId} | ${job.account}`);

    browser = await puppeteer.launch({
      headless: false,
      executablePath: String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
      userDataDir: `C:/puppeteer-profiles/${job.account}`,
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto("https://mail.google.com");

    const otp = await getOTP(page);

    job.res.json({
      otp,
      account: job.account,
    });
  } catch (err) {
    job.res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
    activeWorkers--;
  }
}

// ===== QUEUE PROCESSOR =====
async function processQueue() {
  while (true) {
    if (queue.length === 0) {
      await waitForTimeout(200);
      continue;
    }

    const job = queue.shift();

    // jalanin async (parallel)
    runJob(job);
  }
}

// ===== START =====
(async () => {
  processQueue();

  app.listen(PORT, () => {
    console.log(`🚀 Server jalan di http://localhost:${PORT}`);
  });
})();
