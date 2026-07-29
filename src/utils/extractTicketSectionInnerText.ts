import type { Page } from "playwright";

export async function extractTicketSectionInnerText(
  page: Page,
  section: string,
  timeout: number = 1500
): Promise<string> {
  const locator = page
    .locator(".ng-binding.ng-scope")
    .filter({ hasText: section })
    .first()
    .locator("..")
    .locator(".kb-para");

  try {
    await locator.waitFor({
      state: "attached",
      timeout
    });

    return await locator.innerText();
  } catch {
    return "";
  }
}