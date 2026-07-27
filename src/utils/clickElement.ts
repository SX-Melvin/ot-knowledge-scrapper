import type { Page } from "puppeteer";

export async function clickElement(page: Page, selector: string) {
    await page.waitForSelector(selector);
    return await page.$eval(
      selector,
      (el) => (el as HTMLElement).click()
    );
} 