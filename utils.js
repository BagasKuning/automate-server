export function waitForTimeout(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitForText(page, text, options = {}) {
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
