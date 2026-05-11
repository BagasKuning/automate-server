export async function findRowBySubject(page, matchers, options = {}) {
  const { timeout = 30000 } = options;

  // unopen selector: "tr.zA.zE"
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
    unreadRows
      .slice(0, 10)
      .map((row) => row.$eval("span.bog", (el) => el.innerText)),
  );

  for (const m of matchers) {
    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      const lower = subject.toLowerCase();

      const isMatch =
        m instanceof RegExp ? m.test(subject) : lower.includes(m.toLowerCase());

      if (isMatch) {
        return unreadRows[i];
      }
    }
  }

  throw new Error("INBOX_ROW_NOT_FOUND");
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
    await page.waitForSelector("td[style*='letter-spacing']", {
      timeout: 10000,
    });
  } catch (err) {
    console.error(err);
  }

  const otp = await page.evaluate(() => {
    const candidates = document.querySelectorAll("td[style*='letter-spacing']");

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
