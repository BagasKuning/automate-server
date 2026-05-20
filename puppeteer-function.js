import { waitForTimeout } from "./utils.js";

export async function findRowBySubject(
  page,
  matchers,
  provider = null,
  options = {},
) {
  const { timeout = 20000, retries = 3, refreshDelay = 2000 } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // FREEPIK / ROUNDCUBE
      if (provider === "freepik") {
        await page.waitForSelector("tr.message", { timeout });

        const rows = await page.$$("tr.message");

        const subjects = await Promise.all(
          rows.slice(0, 10).map(async (row) => {
            try {
              return await row.$eval("span.subject a span", (el) =>
                el.innerText.trim(),
              );
            } catch {
              return "";
            }
          }),
        );

        for (const m of matchers) {
          for (let i = 0; i < subjects.length; i++) {
            const subject = subjects[i];
            const lower = subject.toLowerCase();

            const isMatch =
              m instanceof RegExp
                ? m.test(subject)
                : lower.includes(m.toLowerCase());

            if (isMatch) {
              return rows[i];
            }
          }
        }

        throw new Error("INBOX_ROW_NOT_FOUND");
      }

      // DEFAULT GMAIL
      await page.waitForSelector("tr.zA", { timeout });

      const newestRows = await page.$$("tr.zA");
      const unreadRows = [];

      for (const row of newestRows) {
        const className = await row.evaluate((el) => el.className);

        if (className.includes("zE")) {
          unreadRows.push(row);
        }
      }

      const subjects = await Promise.all(
        newestRows
          .slice(0, 10)
          .map((row) => row.$eval("span.bog", (el) => el.innerText)),
      );

      for (const m of matchers) {
        for (let i = 0; i < subjects.length; i++) {
          const subject = subjects[i];
          const lower = subject.toLowerCase();

          const isMatch =
            m instanceof RegExp
              ? m.test(subject)
              : lower.includes(m.toLowerCase());

          if (isMatch) {
            return newestRows[i];
          }
        }
      }

      throw new Error("INBOX_ROW_NOT_FOUND");
    } catch (err) {
      console.log(`[findRowBySubject] attempt ${attempt} failed:`, err.message);

      if (attempt === retries) {
        throw new Error("INBOX_ROW_NOT_FOUND");
      }

      // =========================
      // REFRESH STRATEGY
      // =========================
      await page.reload({
        waitUntil: "networkidle2",
      });

      await waitForTimeout(refreshDelay);
    }
  }
}

export async function searchOtpText(page, provider = null) {
  // scribd
  if (provider === "scribd") {
    try {
      await page.waitForSelector("table p", {
        timeout: 10000,
      });
    } catch (err) {
      console.error(err);
    }

    const otp = await page.evaluate(() => {
      const candidates = document.querySelectorAll("table p");

      for (const el of candidates) {
        const text = el.innerText.trim();

        // hanya angka 4-6 digit
        if (/^\d{4,6}$/.test(text)) {
          return text;
        }
      }

      return null;
    });

    if (!otp) {
      throw new Error("OTP_NOT_FOUND");
    }

    return otp;
  }

  // default provider
  try {
    await page.waitForSelector("[style*='letter-spacing']", {
      timeout: 10000,
    });
  } catch (err) {
    console.error(err);
  }

  const otp = await page.evaluate(() => {
    const candidates = document.querySelectorAll("[style*='letter-spacing']");

    for (const el of candidates) {
      const text = el.innerText.trim();

      if (/^\d{4,6}$/.test(text)) {
        return text;
      }
    }

    return null;
  });

  if (!otp) {
    throw new Error("OTP_NOT_FOUND");
  }

  return otp;
}

// // case capcut
// export async function extractOTPFromSubject(row) {
//   const subject = await row.$eval("span.bog", (el) => el.innerText);

//   const match = subject.match(/\d{4,6}/);

//   return match ? match[0] : null;
// }
