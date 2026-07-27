import { launch, Page } from 'puppeteer';
import dotenv from 'dotenv';
import scrapSubmittedTicket from './scrap_submitted_ticket.js';
import scrapPublicTicket from './scrap_public_ticket.js';
import { ScrapMode } from './types/ScrapMode.js';

dotenv.config();

const headless: boolean = process.env.HEADLESS_MODE === 'true';
const username: string = process.env.USER_NAME ?? "";
const password: string = process.env.USER_PASSWORD ?? "";
const scrapMode: ScrapMode = ScrapMode[process.env.SCRAP_MODE as keyof typeof ScrapMode];
const userAgent: string = process.env.BROWSER_USER_AGENT ?? "";
const executablePath: string | undefined = process.env.EXECUTEABLE_PATH;
const userDataDir: string | undefined = process.env.USER_DATA_DIR;
const timeout: number = parseInt(process.env.DEFAULT_TIMEOUT ?? "30000");
const url: string = scrapMode == ScrapMode.SUBMITTED_TICKET ? 'https://support.opentext.com/csm?id=csm_my_cases' : 'https://support.opentext.com/csm';

(async () => {
    const browser = await launch({
        ...(executablePath ? { executablePath } : {}),
        ...(userDataDir ? { userDataDir } : {}),
        headless,
        defaultViewport: null,
        args: [
            '--disable-http2', 
            '--disable-blink-features=AutomationControlled', // Hides the navigator.webdriver flag
            '--no-sandbox'
        ]
    });

    try {
        const page = await browser.newPage();
        if(userAgent.length > 0) {
            await page.setUserAgent(userAgent);
        }
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        });
        page.setDefaultTimeout(timeout);
        console.log('Opening:', url);

        await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        // // Check cookie button
        // try {
        //     console.log('Checking cookies button...');
        //     await page.locator('#onetrust-accept-btn-handler').click();
        //     console.log('Cookies accepted');
        // } catch (error) {
        //     console.log('Cookies already accepted');
        // }
        
        try {
            // Fill credentials + login
            await new Promise(resolve => setTimeout(resolve, 8000));
            await page.locator('#user').fill(username);
            await page.locator('#password').fill(password);
            console.log('Credentials filled');
            
            await page.locator('#signon').click();
            console.log('Signing in...');
        } catch (error) {
            console.log("Already logged in");            
        }
        
        // // Check cookie button
        // try {
        //     console.log('Checking another cookies button...');
        //     await page.locator('#onetrust-accept-btn-handler').click();
        //     console.log('Cookies accepted');
        //     await new Promise(resolve => setTimeout(resolve, 3000));
        // } catch (error) {
        //     console.log('Cookies already accepted');
        // }
        
        if(scrapMode == ScrapMode.SUBMITTED_TICKET) {
            scrapSubmittedTicket(page);
        } else if(scrapMode == ScrapMode.PUBLIC_TICKET) {
            scrapPublicTicket(page);
        }
    } catch (error) {
        console.error('Scraping failed:', error);
        if (!headless) {
            await new Promise(() => {});
        }
    } finally {
        if (headless) {
            await browser.close();
        }
    }
})();