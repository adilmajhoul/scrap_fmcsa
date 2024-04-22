import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { executablePath } from 'puppeteer';

async function login() {
  puppeteer.use(StealthPlugin());

  const browser = await puppeteer.launch({
    headless: false, // Change to true if you want to run in headless mode
    args: ['--no-sandbox'],
    ignoreHTTPSErrors: true,
    executablePath: executablePath(),
    timeout: 30000, // Set a timeout for browser launch (in milliseconds)
  });

  const page = await browser.newPage();

  page.setDefaultNavigationTimeout(0);

  const loginUrl = 'https://www.crunchbase.com/login';

  //   const username = process.env.USERNAME;
  //   const password = process.env.PASSWORD;

  await page.goto('https://www.crunchbase.com/login', {
    waitUntil: 'networkidle0',
  });

  //   await page.type('#mat-input-0', username);
  //   await page.type('#mat-input-1', password);
  await page.type('#mat-input-0', 'adil2mae@gmail.com');
  await page.type('#mat-input-1', 'Crunchbaseskhon1-');

  console.log('Login');

  const logingButton =
    '#mat-tab-content-0-0 > div > login > form > div.actions > button.login.mdc-button.mdc-button--raised.mat-mdc-raised-button.mat-primary.mat-mdc-button-base';
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle0' }),
    page.click(logingButton),
  ]);

  return { browser, page };
}

// -----------------------------
export async function randomWait(fixedMs, randomdMs) {
  let ms = Math.floor(Math.random() * randomdMs);
  ms = ms + fixedMs;

  await new Promise((_func) => setTimeout(_func, ms));
}
// --------------------------------

(async () => {
  const { browser, page } = await login();

  // Navigate to login page
  await page.goto('https://www.crunchbase.com/login', {
    waitUntil: 'networkidle0',
  });

  // Enter credentials and login

  // Navigate to OpenAI's company page
  await page.goto(
    'https://www.crunchbase.com/organization/openai/company_financials',
    { waitUntil: 'networkidle0' },
  );

  // Wait for the desired element to appear on the page
  await page.waitForSelector(
    '#mat-tab-nav-panel-0 > div > div > page-centered-layout.overview-divider.ng-star-inserted > div > row-card > div > div:nth-child(1) > profile-section > section-card > mat-card > div.section-content-wrapper > anchored-values > div:nth-child(6) > a > div > field-formatter > span',
  );

  // Get the HTML and parse it using a query selector
  const html = await page.evaluate(() => {
    const element = document.querySelector(
      '#mat-tab-nav-panel-0 > div > div > page-centered-layout.overview-divider.ng-star-inserted > div > row-card > div > div:nth-child(1) > profile-section > section-card > mat-card > div.section-content-wrapper > anchored-values > div:nth-child(6) > a > div > field-formatter > span',
    );

    return element.textContent;
  });

  console.log(html);

  // Close the browser
  await browser.close();
})();
