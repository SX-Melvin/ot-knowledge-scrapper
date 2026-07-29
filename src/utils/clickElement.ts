import type { Page } from "playwright";

export async function clickElement(
    page: Page,
    selector: string
) {
    await page
        .locator(selector)
        .first()
        .evaluate((el) => {
            (el as HTMLElement).click();
        });
}