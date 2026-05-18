import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";
import { waitForTimeout } from "./utils.js";
import { findRowBySubject, searchOtpText } from "./puppeteer-function.js";
import { PROVIDERS, getProviderSubjects } from "./data/providers.js";

import dotenv from "dotenv";
import { ACCOUNTS, validateAccount } from "./data/accounts.js";
dotenv.config();

// CONFIG
const PORT = 3000;
const MAX_WORKERS = 4;

// STATE
const queue = [];
let activeWorkers = 0;

// API
const API_KEY = process.env.SERVER_API_KEY;

const app = express();
app.use(express.json());

app.use(cors());
app.use((req, res, next) => {
  const userKey = req.headers["x-api-key"];

  if (userKey && userKey === API_KEY) {
    return next(); // client masi gagal kirim "x-api-key"
  }

  return res.status(401).json({ message: "Unauthorized: Invalid API Key" });
});

app.post("/get-otp", (req, res) => {
  try {
    const requestId = Date.now();

    const { account, provider, password } = req.body;

    if (!account || !provider)
      throw new Error('Missing "account" or "provider" in req body.');
    else if (!account.includes("gmail.com") && !password) {
      throw new Error('"password" must be filled.');
    } else if (!PROVIDERS.includes(provider))
      throw new Error("this provider is not availabale.");
    else if (!validateAccount(account)) {
      throw new Error("ACCOUNT_NOT_ALLOWED");
    }

    queue.push({ requestId, res, account, provider, password });

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

    const row = await findRowBySubject(page, providerSubjects, provider);

    if (!row) throw new Error("Inbox not found");

    await row.evaluate((el, provider) => {
      const target =
        provider === "freepik" ? el.querySelector("a") : el.closest("tr") || el;

      target?.click();
    }, provider);
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

// RUN JOB
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

    const pages = await browser.pages();
    const page = pages[0];

    if (job.account.includes("xyz")) {
      await page.goto("https://srv101.niagahoster.com:2096", {
        waitUntil: "networkidle2",
      });

      await page.waitForSelector("#user", { timeout: 30000 });
      await page.waitForSelector("#pass", { timeout: 30000 });

      const userInput = await page.$("#user");
      const passwordInput = await page.$("#pass");
      const submitButton = await page.$("#login_submit");

      // clear input (lebih clean)
      await userInput.click({ clickCount: 3 });
      await page.keyboard.press("Backspace");

      await passwordInput.click({ clickCount: 3 });
      await page.keyboard.press("Backspace");

      // isi ulang
      await userInput.type(job.account, { delay: 20 });
      await passwordInput.type(job.password, { delay: 20 });

      await submitButton.click();

      // =========================
      // WAIT LOGIN RESULT
      // =========================
      await page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      const currentUrl = page.url();

      const success =
        currentUrl.includes("/cpsess") || currentUrl.includes("roundcube");

      if (!success) {
        throw new Error("LOGIN_FAILED_XYZ");
      }

      console.log("✅ Login XYZ berhasil:", currentUrl);
    } else {
      await page.goto("https://mail.google.com", {
        waitUntil: "networkidle2",
      });
    }

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

// QUEUE PROCESSOR
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

// START
(async () => {
  processQueue();

  app.listen(PORT, () => {
    console.log(`🚀 Server jalan di http://localhost:${PORT}`);
  });
})();
