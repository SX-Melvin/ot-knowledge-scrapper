import type { BrowserContext, Page } from "playwright";
import dotenv from 'dotenv';
import { createOKFMarkdownFile } from './utils/createOKFYamlHeader.js';
import { delay } from "./utils/delay.js";
import { extractTicketSectionInnerText } from "./utils/extractTicketSectionInnerText.js";
import { createTicketSectionFormat } from "./utils/createTicketSectionFormat.js";
import { createListSection } from "./utils/createListSection.js";

dotenv.config();

const timeout: number = parseInt(
  process.env.DEFAULT_TIMEOUT ?? "30000"
);

export default async function scrapPublicTicket(page: Page) {
    page.setDefaultTimeout(timeout);

    while(true) {
        const links = await page.locator(".knowledge-articles .kb-article-summary a").all();

        for(const link of links) {
            const newPagePromise = page.context().waitForEvent("page");

            await link.click({
                modifiers: ["Control"] // Use "Meta" on macOS
            });

            const newPage = await newPagePromise;

            await newPage.bringToFront();

            const header = await newPage.locator("h2.widget-header").innerText();
            const summary = await extractTicketSectionInnerText(newPage, "Summary");
            const cause = await extractTicketSectionInnerText(newPage, "Cause");
            const resolution = await extractTicketSectionInnerText(newPage, "Resolution");
            const additionalInformation = await extractTicketSectionInnerText(newPage, "Additional Information");
            const caseNumber = await newPage.locator(".kb-number-info .ng-binding").first().innerText();
            const appliesTo = await newPage
            .locator("h3.ng-binding")
            .evaluateAll((elements) => {
                const heading = elements.find(el => (el as HTMLElement).innerText.trim() === "Applies to");
                
                const paragraphs = heading
                ?.parentElement
                ?.parentElement
                ?.querySelectorAll(
                    "section.ng-binding.ng-scope p"
                );
                
                return [...(paragraphs ?? [])].map(p => {
                    const clone = p.cloneNode(true) as HTMLElement;

                    clone.querySelectorAll("span").forEach(span => span.remove());
                    
                    return clone.innerText.trim();
                });
            });
            
            const sections: string[] = [
                createTicketSectionFormat({
                    section: 'Summary',
                    text: summary,
                }, false),
                createTicketSectionFormat({
                    section: 'Cause',
                    text: cause
                }),
                createTicketSectionFormat({
                    section: 'Resolution',
                    text: resolution
                }),
                createTicketSectionFormat({
                    section: 'Additional Information',
                    text: additionalInformation
                }),
                createListSection("Applies to", appliesTo)
            ];
            
            newPage.close();
            
            await createOKFMarkdownFile(
                {
                    profile: "knowledge-base-article",
                    name: caseNumber,
                    title: header,
                    description: summary
                },
                sections.join("\n\n")
            );
        }

        const parent = page
            .locator(".page-link[aria-label='Next']")
            .first()
            .locator("..");
        const isDisabled = await parent.locator(".disabled").count() > 0;
    
        if(isDisabled) {
            break;
        }

        await page.locator(".page-link[aria-label='Next']").click();
    }

    console.log("All tickets scrapped");
}