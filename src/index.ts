import { chromium } from "playwright";
import type { BrowserContext, Page } from "playwright";
import dotenv from "dotenv";
import scrapSubmittedTicket from "./scrap_submitted_ticket.js";
import scrapPublicTicket from "./scrap_public_ticket.js";
import { ScrapMode } from "./types/ScrapMode.js";
import { constructPublicTicketUrl } from "./utils/constructPublicTicketUrl.js";

dotenv.config();

const headless: boolean = process.env.HEADLESS_MODE === "true";
const username: string = process.env.USER_NAME ?? "";
const password: string = process.env.USER_PASSWORD ?? "";

const scrapMode: ScrapMode =
    ScrapMode[process.env.SCRAP_MODE as keyof typeof ScrapMode];

const userAgent: string = process.env.BROWSER_USER_AGENT ?? "";
const executablePath: string | undefined = process.env.EXECUTEABLE_PATH;
const userDataDir: string = process.env.USER_DATA_DIR ?? "./chrome-profile";

const timeout: number = parseInt(
    process.env.DEFAULT_TIMEOUT ?? "30000"
);

const url =
    scrapMode === ScrapMode.SUBMITTED_TICKET
        ? "https://support.opentext.com/csm?id=csm_my_cases"
        : constructPublicTicketUrl();

(async () => {
    let browser: BrowserContext | undefined;

    try {
        /*
         * Playwright persistent context.
         *
         * IMPORTANT:
         * userDataDir is the FIRST argument.
         */
        browser = await chromium.launchPersistentContext(
            userDataDir,
            {
                headless,

                ...(executablePath
                    ? { executablePath }
                    : {}),

                ...(userAgent
                    ? { userAgent }
                    : {}),

                // Playwright equivalent of Puppeteer's defaultViewport: null
                viewport: null,

                args: [
                    "--disable-http2",
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox"
                ]
            }
        );

        // Playwright automatically creates the first page for a
        // persistent browser context.
        const pages = browser.pages();

        const page: Page | undefined =
            pages.length > 0
                ? pages[0]
                : await browser.newPage();

        if(page) {

            page.setDefaultTimeout(timeout);
    
            console.log("Opening:", url);
    
            await page.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: 60000
            });
    
            /*
             * Login
             */
            try {
                console.log("Checking login...");
    
                await page
                    .locator("button#sitenav-login-button")
                    .waitFor({
                        state: "visible",
                        timeout: 10000
                    });
    
                await page.locator("#user").fill(username);
                await page.locator("#password").fill(password);
    
                console.log("Credentials filled");
    
                await page.locator("#signon").click();
    
                console.log("Signing in...");
            } catch (error) {
                console.log("Already logged in");
            }
    
            /*
             * Scrape
             */
            if (scrapMode === ScrapMode.SUBMITTED_TICKET) {
                await scrapSubmittedTicket(page);
            } else if (scrapMode === ScrapMode.PUBLIC_TICKET) {
                await scrapPublicTicket(page);
            }
        }
    } catch (error) {
        console.error("Scraping failed:", error);

        if (!headless) {
            // Keep browser open for debugging
            await new Promise(() => {});
        }

    } finally {
        if (headless && browser) {
            await browser.close();
        }
    }
})();