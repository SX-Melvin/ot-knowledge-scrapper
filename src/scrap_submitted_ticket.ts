import { ElementHandle, Page } from 'puppeteer';
import dotenv from 'dotenv';
import { createOKFMarkdownFile } from './utils/createOKFYamlHeader.js';
import { createThreadFormat } from './utils/createThreadFormat.js';
import { findElementWithInterval } from './utils/findElementWithInterval.js';
import { setTimeout as wait} from 'node:timers/promises';
import { clickElement } from './utils/clickElement.js';
import { mouseDownElement } from './utils/mouseDownElement.js';

dotenv.config();

const timeout: number = parseInt(process.env.DEFAULT_TIMEOUT ?? "30000");

export default async function scrapSubmittedTicket(page: Page) {
  console.log("Scrapping submitted ticket...");
  var accountSelected: string[] = [];

  // document.querySelector(".select2-results .select2-result .select2-result-label").innerText
  page.setDefaultTimeout(timeout);

  // =========================
  // Open My Cases
  // =========================

  const myCasesPage = page;
  console.log("My Cases opened:", myCasesPage.url());
  
  while(true) {
    await clickElement(myCasesPage, '.UserName.ng-binding');
    await clickElement(myCasesPage, '.selectAccount.ng-scope');
    await mouseDownElement(myCasesPage, '.select2-choice');
  
    const account = await myCasesPage.$$eval(
      "div.select2-result-label",
      (els, selectedAccounts) => {
        return els.find(
          x => !selectedAccounts.includes(x.innerText.trim())
        )?.innerText.trim() ?? null;
      },
      accountSelected
    );

    if(!account) {
      console.log("All account has been scrapped");
      break;
    }

    accountSelected.push(account);

    await myCasesPage.$$eval(
      "div.select2-result-label",
      (els, accountName) => {
        const element = els.find(
          x => x.innerText.trim() === accountName
        );

        if (element) {
          (element as HTMLElement).click();
        }
      },
      account
    );

    console.log("Scraping account:", account);
    await clickElement(myCasesPage, '.accountButton');

    let hasNextPage = true;
    while (hasNextPage) {
      try {
        const readyState = await myCasesPage.evaluate(() => document.readyState);
        console.log("Ready state:", readyState);

        await myCasesPage.waitForSelector(".otTableFont.ng-scope .ng-binding[role='link']");
        console.log(`1`);
        const linkCount = await myCasesPage.$$eval(".otTableFont.ng-scope .ng-binding[role='link']", els => els.length);

        console.log(`Found ${linkCount} tickets`);
        
        for (let i = 0; i < linkCount; i++) {
          // Re-query links
          const links = await myCasesPage.$$(".otTableFont.ng-scope .ng-binding[role='link']");
          if (!links[i]) {
            continue;
          }

          // =========================
          // Prepare to catch new tab
          // =========================
  
          const ticketPagePromise = new Promise<Page>(resolve => {
            myCasesPage.browser().once("targetcreated", async target => {
              const newPage = await target.page();
  
              if (newPage) {
                resolve(newPage);
              }
            });
          });
  
          // Click ticket
          await links[i]!.click();
  
          // Wait for ticket tab
          const ticketPage = await ticketPagePromise;
  
          await ticketPage.bringToFront();
  
          console.log("Ticket opened:", ticketPage.url());
  
          await ticketPage.waitForNetworkIdle();
  
          // =========================
          // Scrape ticket
          // =========================
          
          let ticketName = "untitled-ticket";
          const ticketElement = await findElementWithInterval(ticketPage, '.m-n.sd.ng-binding');

          if(ticketElement != null) {
            ticketName = (ticketElement as HTMLElement).innerText.trim();
          }
    
            for (let i = 0; i < 8; i++) {
              try {
                ticketName = await ticketPage.$eval(
                  ".m-n.sd.ng-binding",
                  el => (el as HTMLElement).innerText.trim()
                );
    
                if (ticketName) {
                  break;
                }
              } catch {
                // Element not available yet
              }
    
              await new Promise(resolve => setTimeout(resolve, 500));
            }
  
          const ticketDescription = await ticketPage.$eval(
            "[sn-atf-area='OT Case Description Ticket Tab']",
            el => (el as HTMLElement).innerText.trim()
          ).catch(() => "");
  
          const threads: string[] = [];
          let threadNumber = 1;
  
          await ticketPage.waitForSelector(
            "div.timeline-panel-inner.default-comment"
          );
  
          const timelines: ElementHandle<HTMLDivElement>[] =
            await ticketPage.$$("div.timeline-panel.timeline-border");
  
          for (const timeline of timelines) {
            const paragraphs = await timeline.$eval(
              "div.timeline-panel-inner.default-comment",
              el =>
                Array.from(el.querySelectorAll("p"))
                  .map(p => (p as HTMLElement).innerText.trim())
                  .filter(text => text.length > 0)
            ).catch(() => []);
  
            const author = await timeline.$eval(
              "div.timeline-title.h4.ng-binding",
              el => (el as HTMLElement).innerText.trim()
            ).catch(() => "Unknown");
  
            const type = await timeline.$eval(
              "small.text-muted.journal-type.ng-binding",
              el => (el as HTMLElement).innerText.trim()
            ).catch(() => "");
  
            const time = await timeline.$eval(
              "time",
              el =>
                el.getAttribute("title") ??
                (el.querySelector(
                  ".sr-only.ng-binding"
                ) as HTMLElement | null)?.innerText ??
                "N/A"
            ).catch(() => "N/A");
  
            threads.push(
              createThreadFormat({
                author,
                type,
                comments: paragraphs,
                threadNumber,
                time
              })
            );
  
            threadNumber++;
          }
  
          // =========================
          // Save ticket
          // =========================
  
          await createOKFMarkdownFile(
            {
              name: ticketName,
              title: ticketName,
              description: ticketDescription,
              contributors: [],
              licenses: [],
              resources: [],
              version: "1.0.0"
            },
            threads.join("\n\n")
          );
  
          // =========================
          // Close ticket tab
          // =========================
  
          await ticketPage.close();
          await myCasesPage.bringToFront();
  
          // Wait for list page again
          await myCasesPage.waitForSelector(
            ".otTableFont.ng-scope .ng-binding[role='link']"
          );
        }
  
        // =========================
        // Pagination
        // =========================
  
        const nextBtnSelector =
          ".btn-toolbar .tableFooter.btn-group .btn.btn-default:last-child";
  
        const nextBtn = await myCasesPage.$(nextBtnSelector);
  
        if (!nextBtn) {
          hasNextPage = false;
          break;
        }
  
        const isDisabled = await myCasesPage.$eval(
          nextBtnSelector,
          el =>
            el.hasAttribute("disabled") ||
            el.getAttribute("disabled") === "disabled"
        );
  
        if (isDisabled) {
          console.log("Reached last page.");
          hasNextPage = false;
        } else {
          console.log("Navigating to next page...");
  
          await Promise.all([
            myCasesPage.waitForNetworkIdle(),
            nextBtn.click()
          ]);
        }
      } catch (error) {
        console.error("Error scraping submitted tickets:", error);
        hasNextPage = false;
      }
    }
  }
}