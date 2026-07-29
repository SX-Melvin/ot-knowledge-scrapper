import type { Page, Locator } from "playwright";
import dotenv from "dotenv";
import { createOKFMarkdownFile } from "./utils/createOKFYamlHeader.js";
import { createThreadFormat } from "./utils/createThreadFormat.js";
import { clickElement } from "./utils/clickElement.js";
import { mouseDownElement } from "./utils/mouseDownElement.js";
import { delay } from "./utils/delay.js";

dotenv.config();

const timeout: number = parseInt(
  process.env.DEFAULT_TIMEOUT ?? "30000"
);

export default async function scrapSubmittedTicket(page: Page) {
  console.log("Scraping submitted ticket...");

  const accountSelected: string[] = [];

  page.setDefaultTimeout(timeout);

  // =========================
  // Open My Cases
  // =========================

  const myCasesPage = page;

  console.log("My Cases opened:", myCasesPage.url());

  while (true) {
    await clickElement(myCasesPage, ".UserName.ng-binding");
    await clickElement(myCasesPage, ".selectAccount.ng-scope");
    await delay(2000);
    await mouseDownElement(myCasesPage, ".padStyle div.select2-container a.select2-choice");
    await myCasesPage.locator("div.select2-result-label").first().waitFor();

    // =========================
    // Find next account
    // =========================

    const account = await myCasesPage
      .locator("div.select2-result-label")
      .evaluateAll(
        (els, selectedAccounts) => {
          return (
            els.find(
              x =>
                !selectedAccounts.includes(
                  (x as HTMLElement).innerText.trim()
                )
            ) as HTMLElement | undefined
          )?.innerText.trim() ?? null;
        },
        accountSelected
      );

    if (!account) {
      console.log("All accounts have been scraped");
      break;
    }
    
    accountSelected.push(account);
    
    // =========================
    // Select account
    // =========================
    
    const accountOption = myCasesPage
    .locator("div.select2-result-label")
    .filter({ hasText: account })
    .first();
    
    await accountOption.waitFor();
    await accountOption.dispatchEvent("mousedown");
    await accountOption.click();

    console.log("Scraping account:", account);

    await clickElement(
      myCasesPage,
      ".accountButton"
    );

    await delay(3000);

    // =========================
    // Scrape ticket pages
    // =========================

    let hasNextPage = true;

    while (hasNextPage) {
      try {
        const ticketLinks = myCasesPage.locator(
          ".otTableFont.ng-scope .ng-binding[role='link']"
        );

        await ticketLinks.first().waitFor();

        const linkCount = await ticketLinks.count();

        console.log(`Found ${linkCount} tickets`);

        for (let i = 0; i < linkCount; i++) {
          // Re-query the link
          const ticketLink = myCasesPage
            .locator(
              ".otTableFont.ng-scope .ng-binding[role='link']"
            )
            .nth(i);

          // =========================
          // Prepare to catch new tab
          // =========================

          const ticketPagePromise =
            myCasesPage.context().waitForEvent("page");

          // Click ticket
          await ticketLink.click();

          // Wait for new tab
          const ticketPage = await ticketPagePromise;
          await ticketPage.bringToFront();
          console.log("Ticket opened:", ticketPage.url());

          // =========================
          // Scrape ticket
          // =========================

          const ticketName = await ticketPage
            .locator(".m-n.sd.ng-binding")
            .innerText()
            .catch(() => "untitled-ticket");
          
          const caseNumber = await ticketPage
            .locator(".ot-caseNumber.ng-binding")
            .innerText()
            .catch(() => "untitled-ticket-number");

          const ticketDescription =
            await ticketPage
              .locator(
                "[sn-atf-area='OT Case Description Ticket Tab']"
              )
              .innerText()
              .catch(() => "");

          // =========================
          // Scrape threads
          // =========================

          const threads: string[] = [];

          let threadNumber = 1;

          const timelines = ticketPage.locator("div.timeline-panel.timeline-border");

          const timelineCount =
            await timelines.count();

          for (
            let i = 0;
            i < timelineCount;
            i++
          ) {
            const timeline = timelines.nth(i);

            // Comments
            const paragraphs =
              await timeline
                .locator(
                  "div.timeline-panel-inner.default-comment p"
                )
                .allInnerTexts()
                .catch(() => []);

            const cleanedParagraphs =
              paragraphs
                .map(text => text.trim())
                .filter(
                  text => text.length > 0
                );

            // Author
            const author =
              await timeline
                .locator(
                  "div.timeline-title.h4.ng-binding"
                )
                .innerText()
                .catch(() => "Unknown");

            // Type
            const type =
              await timeline
                .locator(
                  "small.text-muted.journal-type.ng-binding"
                )
                .innerText()
                .catch(() => "");

            // Time
            const time =
              await timeline
                .locator("time")
                .evaluate(el => {
                  return (
                    el.getAttribute("title") ??
                    el
                      .querySelector(
                        ".sr-only.ng-binding"
                      )
                      ?.textContent
                      ?.trim() ??
                    "N/A"
                  );
                })
                .catch(() => "N/A");

            threads.push(
              createThreadFormat({
                author,
                type,
                comments: cleanedParagraphs,
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
              name: caseNumber,
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
          await myCasesPage
            .locator(
              ".otTableFont.ng-scope .ng-binding[role='link']"
            )
            .first()
            .waitFor();
        }

        // =========================
        // Pagination
        // =========================

        const nextBtn =
          myCasesPage.locator(
            '[aria-label="Next page "]'
          );

        const nextBtnExists =
          await nextBtn.count() > 0;

        if (!nextBtnExists) {
          hasNextPage = false;
          break;
        }

        const isDisabled =
          await nextBtn.isDisabled().catch(
            () => false
          );

        if (isDisabled) {
          console.log(
            "Reached last page."
          );

          hasNextPage = false;
        } else {
          console.log(
            "Navigating to next page..."
          );

          await nextBtn.click();

          await delay(3000);
        }

      } catch (error) {
        console.error(
          "Error scraping submitted tickets:",
          error
        );

        hasNextPage = false;
      }
    }
  }
}