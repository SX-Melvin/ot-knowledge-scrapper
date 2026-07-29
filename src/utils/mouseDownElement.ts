import type { Page } from "playwright";

export async function mouseDownElement(
  page: Page,
  selector: string
): Promise<void> {
  await page.locator(selector).first().evaluate((element) => {
    element.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        view: window
      })
    );
  });
}