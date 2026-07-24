import { launch, Page } from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

const headlessMode = process.env.HEADLESS_MODE === 'true';
const username = process.env.USER_NAME;
const scrapMode = process.env.SCRAP_MODE;
const password = process.env.USER_PASSWORD;
const userAgent = process.env.BROWSER_USER_AGENT;
const timeout = process.env.DEFAULT_TIMEOUT;

export default async function scrapSubmittedTicket(page: Page) {
    await page.locator("a.MyCases").click();
}