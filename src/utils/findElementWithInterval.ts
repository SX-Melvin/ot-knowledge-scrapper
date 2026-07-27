import type { Page } from "puppeteer";
import dotenv from 'dotenv';

dotenv.config();

const defaultTimeout: number = parseInt(process.env.DEFAULT_TIMEOUT ?? "30000");

export async function findElementWithInterval(page: Page, selector: string, timeout: number | null = null, retryCount: number = 10): Promise<Element | null> {
    let result: Element | null = null;
    timeout ??= defaultTimeout;
  
    for (let i = 0; i < retryCount; i++) {
        try {
            result = await page.$eval(selector, el => el);
            console.log(result);
            if (result) {
                break;
            }
        } catch {
            console.error('error', result);
            // Element not available yet
        }

        await new Promise(resolve => setTimeout(resolve, timeout / retryCount));
    }

    return result;
}