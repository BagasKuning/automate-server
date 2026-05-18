function waitForTimeout(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function withTimeout(fn, ms = 60000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("JOB_TIMEOUT_60S"));
    }, ms);

    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

async function waitForText(page, text, options = {}) {
  const {
    timeout = 30000,
    polling = 100,
    selector = "body",
    visible = false,
  } = options;

  return page.waitForFunction(
    ({ selector, text, visible }) => {
      const el = document.querySelector(selector);
      if (!el) return false;

      const hasText = el.innerText.includes(text);
      if (!hasText) return false;

      if (visible) {
        const style = window.getComputedStyle(el);
        const isVisible =
          style &&
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          el.offsetHeight > 0;

        return isVisible;
      }

      return true;
    },
    {
      timeout,
      polling,
    },
    { selector, text, visible },
  );
}

function getRandomInt({ min, max }) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export { waitForTimeout, waitForText, getRandomInt, withTimeout };
