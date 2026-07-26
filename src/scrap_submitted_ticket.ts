import { ElementHandle, Page } from 'puppeteer';
import dotenv from 'dotenv';
import { createOKFMarkdownFile } from './utils/createOKFYamlHeader.js';
import { createThreadFormat } from './utils/createThreadFormat.js';

dotenv.config();

const timeout: number = parseInt(process.env.DEFAULT_TIMEOUT ?? "30000");

export default async function scrapSubmittedTicket(page: Page) {
  console.log("Scrapping submitted ticket...");

  page.setDefaultTimeout(timeout);

  // =========================
  // Open My Cases
  // =========================

  await page.locator("a.MyCases").click();

  const myCasesPage = page;

  console.log("My Cases opened:", myCasesPage.url());

  let hasNextPage = true;

  while (hasNextPage) {
    try {
      await myCasesPage.waitForSelector(
        ".otTableFont.ng-scope .ng-binding[role='link']"
      );

      const linkCount = await myCasesPage.$$eval(
        ".otTableFont.ng-scope .ng-binding[role='link']",
        els => els.length
      );

      for (let i = 0; i < linkCount; i++) {
        // Re-query links
        const links = await myCasesPage.$$(
          ".otTableFont.ng-scope .ng-binding[role='link']"
        );

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

        const ticketName = await ticketPage.$eval(
          ".m-n.sd.ng-binding",
          el => (el as HTMLElement).innerText.trim()
        ).catch(() => "untitled-ticket");

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

        console.log(await createOKFMarkdownFile(
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
        ));

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