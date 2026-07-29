import type { BrowserContext, Page } from "playwright";
import dotenv from 'dotenv';
import { createOKFMarkdownFile } from './utils/createOKFYamlHeader.js';

dotenv.config();

const headlessMode = process.env.HEADLESS_MODE === 'true';
const username = process.env.USER_NAME;
const scrapMode = process.env.SCRAP_MODE;
const password = process.env.USER_PASSWORD;
const userAgent = process.env.BROWSER_USER_AGENT;
const timeout = process.env.DEFAULT_TIMEOUT;

export default async function scrapPublicTicket(page: Page) {
    while(true) {
        const links = await page.$$(".knowledge-articles .kb-article-summary a");

        for(const link of links) {
            await link.click();

            // const headers = await page.$$eval("h2.widget-header", elements => elements.map(el => (el as HTMLElement).innerText.trim()));

            // await createOKFMarkdownFile(
            //     {
            //     name: ticketName,
            //     title: ticketName,
            //     description: ticketDescription,
            //     contributors: [],
            //     licenses: [],
            //     resources: [],
            //     version: "1.0.0"
            //     },
            //     threads.join("\n\n")
            // );
        }
    }
}