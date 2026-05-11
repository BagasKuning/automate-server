import express from "express";
import puppeteer from "puppeteer";
import { waitForTimeout } from "./utils.js";
import { findRowBySubject, searchOtpText } from "./puppeteer-function.js";
import { PROVIDERS } from "./constant/providers.js";

const app = express();
app.use(express.json());

// ===== CONFIG =====
const PORT = 3000;
const MAX_WORKERS = 4;

export const getProviderSubjects = (provider) => {
  switch (provider) {
    case "netflix":
      return [
        "Netflix: Kode masukmu",
        "Netflix: your sign-in code",
        // "Kode akses sementara Netflix-mu", // Perlu di cari tahu lagi tentang ini
      ];

    case "zoom":
      return ["Code for signing in to Zoom"];

    case "chatgpt":
      return ["Your temporary ChatGPT login code"];

    case "capcut":
      return [/^\d{4,6} is your verification code$/i];

    case "scribd":
      return [/^Your one-time passcode for Scribd is \d{4,6}$/i];

    case "freepik":
      return ["Your authentication code"]; // bukan dari gmail tapi

    default:
      return [];
  }
};

// ===== STATE =====
const queue = [];
let activeWorkers = 0;

// ===== API =====
app.post("/get-otp", (req, res) => {
  try {
    const requestId = Date.now();

    const { account, provider } = req.body;

    if (!account || !provider)
      throw new Error('Missing "account" or "provider" in req body.');

    if (!PROVIDERS.includes(provider))
      throw new Error("this provider is not availabale.");

    queue.push({ requestId, res, account, provider });

    console.log("📥 Job masuk:", requestId, "->", account);
  } catch (error) {
    console.error("[GET OTP] ", error?.message);
    res.status(400).json({ message: error?.message || "something wrong." });
  }
});

async function getOTP(page, provider) {
  try {
    const providerSubjects = getProviderSubjects(provider);

    if (!providerSubjects.length) {
      throw new Error("Provider subject not found.");
    }

    const row = await findRowBySubject(page, providerSubjects);

    if (!row) throw new Error("Inbox not found");

    await row.evaluate((el) => {
      el.closest("tr")?.click();
    });
    await waitForTimeout(2674);

    const otp = await searchOtpText(page, provider);

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

    const otp = await getOTP(page, job.provider);

    job.res.json({
      otp,
      provider: job.provider,
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
