import type { Page } from "puppeteer";

export async function mouseDownElement(
  page: Page,
  selector: string
) {
  await page.waitForSelector(selector);

  return await page.$eval(
    selector,
    (el) =>
      (el as HTMLElement).dispatchEvent(
        new MouseEvent("mousedown", {
          bubbles: true,
          cancelable: true,
          view: window
        })
      )
  );
}