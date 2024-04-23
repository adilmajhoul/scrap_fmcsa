import puppeteer from 'puppeteer';

// ***********************
// constants

const TABLE_SELECTOR = 'body > font > table:nth-child(5)';
const NEXT_PAGE_BUTTON_SELECTOR = 'input[type="submit"][value="Next 10 Records"]';
const SEARCH_BUTTON_SELECTOR = 'body > font > center:nth-child(17) > form > input[type=submit]:nth-child(4)';
// ***********************

// TODO:
// setup proxy rotating for puppeteer
// setup agent rotating for puppeteer
// make your programe more dynamic with taking inputs
// setup a logger

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// UTIL FUNCTIONS:
// convert these fucntions to a class
/*
async function waitForSelector(selector) {
  await page.waitForSelector(selector);
}

async function clickSelector(selector) {
  await page.click(selector);
}

async function clickNext(page) {
  await waitForSelector(NEXT_PAGE_BUTTON_SELECTOR);

  await clickSelector(NEXT_PAGE_BUTTON_SELECTOR);
}

async function clickSearch(page) {
  await page.waitForSelector(SEARCH_BUTTON_SELECTOR);
  await page.click(SEARCH_BUTTON_SELECTOR);
}

async function processAllMatchingSelector(selector, html, processEachElementCallback) {
  const $ = cheerio.load(html);

  const elements = $('li'); // Select all 'li' elements
  const elementsArray = elements.toArray(); // Convert the Cheerio object to an array

  elementsArray.forEach((element) => {
    processEachElementCallback(element);
  });
}
async function getAllMatchingSelector(selector, html, processEachElementCallback) {
  const $ = cheerio.load(html);

  const elements = $('li'); // Select all 'li' elements
  const elementsArray = elements.toArray(); // Convert the Cheerio object to an array

  return elementsArray;
}
*/
class PageProcessor {
  constructor(page) {
    this.page = page;
  }

  async waitForSelector(selector) {
    await this.page.waitForSelector(selector);
  }

  async clickSelector(selector) {
    await this.page.click(selector);
  }

  createCheerioObject(html) {
    return cheerio.load(html);
  }

  async getCurrentPageHtml() {
    const html = await this.page.content();
    return html;
  }
  async getCurrentPageBody() {
    const bodyHtml = await this.page.evaluate(() => document.querySelector('body').innerHTML);
    return bodyHtml;
  }

  async getElementHtmlBySelector(selector) {
    const bodyHtml = await this.page.evaluate(() => document.querySelector(selector).innerHTML);
    return bodyHtml;
  }

  async clickNext() {
    await this.waitForSelector(NEXT_PAGE_BUTTON_SELECTOR);
    await this.clickSelector(NEXT_PAGE_BUTTON_SELECTOR);
  }

  async clickSearch() {
    await this.page.waitForSelector(SEARCH_BUTTON_SELECTOR);
    await this.page.click(SEARCH_BUTTON_SELECTOR);
  }

  async processAllMatchingSelector(selector, html, processEachElementCallback) {
    const $ = createCheerioObject(html);
    const elementsArray = $(selector).toArray();

    elementsArray.forEach((element) => {
      processEachElementCallback(element);
    });
  }

  async getAllMatchingSelector(selector, html) {
    const $ = cheerio.load(html);
    const elementsArray = $(selector).toArray();

    return elementsArray;
  }

  async getPageTableData(tableHtml) {
    const $ = this.createCheerioObject(tableHtml);

    const pageTableData = [];

    $('tbody tr').each((i, element) => {
      if (i === 0) return; // skip the header row

      const row = $(element);
      const company = getTableRow(row);

      pageTableData.push(company);
    });

    return pageTableData;
  }
}
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

async function scrapeData() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to the page

  await page.goto('https://li-public.fmcsa.dot.gov/LIVIEW/pkg_carrquery.prc_carrlist', {
    waitUntil: 'networkidle0',
  });

  // select new jersey
  // -------------------------------------------
  // Select the dropdown element
  const dropdown = await page.$('#state');

  // Open the dropdown
  await dropdown.evaluate((dropdown) => (dropdown.selectedIndex = -1));

  // Wait for the dropdown options to be visible
  await page.waitForSelector('#state option');

  // Select "New Jersey" from the dropdown
  await page.evaluate(() => {
    const option = document.querySelector('#state option[value="NJUS"]');
    option.selected = true;
    const event = new Event('change', { bubbles: true });
    option.dispatchEvent(event);
  });
  // -------------------------------------------

  // wait for till solving captacha manually
  await new Promise((_func) => setTimeout(_func, 25000));

  // click search
  await clickSearch(page);

  // Create a new PageProcessor instance
  const pageProcessor = new PageProcessor(page);

  // ++++++++++++++++++++++++++++++++++++++++
  // start with loop of 10 pages for testing

  // here we inter a pagination loop
  let i = 1;
  while (i <= 10) {
    console.log(`scraping page: ${i} ...`);

    // wait for table
    await pageProcessor.waitForSelector(TABLE_SELECTOR);

    // get table html
    const tableHtml = await pageProcessor.getElementHtmlBySelector(TABLE_SELECTOR);

    const $ = await pageProcessor.createCheerioObject(tableHtml);

    // const get full page table as array of objects
    const pageTableData = await pageProcessor.getPageTableData(tableHtml);

    // apend pageTableData to a xlsm file

    console.log(`scraped page: ${i} ✅`);

    // go to next page

    // -------------

    // handle none ok response
    // wait for table selector
    // get table html with puppeteer
    // and parse it using cheerio:
    //--------- pass each row to function
    //--------- parse each row and store it to an an array of objects
    //--------- after finishing the table parsing store the whole array of objects to xlsm
    //--------- set scraped page to scrapedPages++
    // wait for next
    // click next
    // repeat
    i++;
  }
  // ++++++++++++++++++++++++++++++++++++++++
  // Wait for the next form input button

  // Wait for the new data to be loaded
  // await new Promise((_func) => setTimeout(_func, 3000));

  // Get the HTML and parse it using a query selector
  // const cellText = await page.evaluate(() => {
  //   const element = document.querySelector(
  //     'body > font > table:nth-child(5) > tbody > tr:nth-child(2) > td:nth-child(1) > center > font',
  //   );

  //   return element.textContent;
  // });

  // console.log(cellText);

  // Cheerio
  // Extract the data using Cheerio or any other method

  // Close the browser
  await browser.close();
}

scrapeData().catch(console.error);

// -------------

// handle 304
// handle keeping track of the current page scraped and the 304 pages

// fucntion that get state as its argument with state type

function getTableRow(row) {
  const name = row.eq(0).text().trim();
  const site = row.eq(1).text().trim();
  const industry = row.eq(2).text().trim();
  const country = row.eq(3).text().trim();
  const fundingAmount = row.eq(4).text().trim();
  const fundingType = row.eq(5).text().trim();
  const fundingDate = row.eq(6).text().trim();

  const company = {
    name,
    site,
    industry,
    country,
    fundingAmount,
    fundingType,
    fundingDate,
  };

  return company;
}
// -------------

// -------------

// -------------

// -------------
