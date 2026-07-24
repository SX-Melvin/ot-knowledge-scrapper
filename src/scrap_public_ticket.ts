import { launch, Page } from 'puppeteer';
import dotenv from 'dotenv';

dotenv.config();

const headlessMode = process.env.HEADLESS_MODE === 'true';
const username = process.env.USER_NAME;
const scrapMode = process.env.SCRAP_MODE;
const password = process.env.USER_PASSWORD;
const userAgent = process.env.BROWSER_USER_AGENT;
const timeout = process.env.DEFAULT_TIMEOUT;

export default async function scrapPublicTicket(page: Page) {
    // Go to product page
    await page.locator("h2[title='Content Server'] + a").click();
    console.log('Redirecting to product page');
    
    // Go to knowledge page
    await page.locator("a.ot-list-links.ot-more.ot-white-arrow-bold").click();
    console.log('Redirected to knowledge page');
}