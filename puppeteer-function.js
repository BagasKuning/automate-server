export async function findRowBySubject(page, subject, options = {}) {
  const { timeout = 30000, exact = false } = options;

  await page.waitForSelector("tr.zA", { timeout });

  const rows = await page.$$("tr.zA");

  for (const row of rows) {
    const text = await row.$eval("span.bog", (el) =>
      el.innerText.toLowerCase(),
    );

    // normalize input
    const subjects = Array.isArray(subject)
      ? subject.map((s) => s.toLowerCase())
      : [subject.toLowerCase()];

    const isMatch = subjects.some((s) =>
      exact ? text === s : text.includes(s),
    );

    if (isMatch) {
      return row;
    }
  }

  throw new Error("ROW_NOT_FOUND");
}

export async function getNetflixOTP(page) {
  await page.waitForSelector("td[style*='letter-spacing']", {
    timeout: 10000,
  });

  const otp = await page.evaluate(() => {
    const candidates = document.querySelectorAll("td[style*='letter-spacing']");

    for (const el of candidates) {
      const text = el.innerText.trim();

      // harus pure angka 4-6 digit
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
