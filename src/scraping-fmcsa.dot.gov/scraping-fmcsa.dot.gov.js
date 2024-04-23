import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { writeDataToJson } from '../scraping-rei.com';

import * as fs from 'fs';
import * as Excel from 'exceljs';

async function appendDataToExcelFile(data, fileName) {
  const workbook = new Excel.Workbook();

  // Check if the file exists
  if (fs.existsSync(fileName)) {
    // If the file exists, read it
    await workbook.xlsx.readFile(fileName);
    const worksheet = workbook.getWorksheet(1); // Get the first worksheet

    // Add new rows to the worksheet
    for (const row of data) {
      worksheet.addRow([
        row.usdot_number,
        row.prefix,
        row.docket_number,
        row.legal_name,
        row.dba_name,
        row.city,
        row.state,
      ]);
    }
  } else {
    // If the file doesn't exist, create a new worksheet and add the header row
    const worksheet = workbook.addWorksheet('Sheet1');

    const header = ['usdot_number', 'prefix', 'docket_number', 'legal_name', 'dba_name', 'city', 'state'];

    worksheet.addRow(header);
    for (const row of data) {
      worksheet.addRow([
        row.usdot_number,
        row.prefix,
        row.docket_number,
        row.legal_name,
        row.dba_name,
        row.city,
        row.state,
      ]);
    }
  }

  // Save the workbook to the file
  await workbook.xlsx.writeFile(fileName);
}

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
    const bodyHtml = await this.page.evaluate((selector) => document.querySelector(selector).innerHTML, selector);
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
    const $ = this.createCheerioObject(html);

    const elementsArray = $(selector).toArray();

    return elementsArray;
  }

  getTableRow(row) {
    const usdot_number = row.eq(0).text().trim();
    const prefix = row.eq(1).text().trim();
    const docket_number = row.eq(2).text().trim();
    const legal_name = row.eq(3).text().trim();
    const dba_name = row.eq(4).text().trim();
    const city = row.eq(5).text().trim();
    const state = row.eq(6).text().trim();

    const company = {
      usdot_number,
      prefix,
      docket_number,
      legal_name,
      dba_name,
      city,
      state,
    };

    return company;
  }

  async getPageTableData(html) {
    const $ = this.createCheerioObject(html);

    const pageTableData = [];

    $('tbody tr').each((i, element) => {
      if (i === 0) return; // skip the header row

      const row = $(element).find('td');

      const company = this.getTableRow(row);

      // Check if USDOT_Number is valid before adding to pageTableData
      if (company.usdot_number.match(/^\d+$/) || company.docket_number.match(/^\d+$/)) {
        pageTableData.push(company);
      }
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
  await new Promise((_func) => setTimeout(_func, 20000));

  // Create a new PageProcessor instance
  const pageProcessor = new PageProcessor(page);

  // click search
  await pageProcessor.clickSearch();

  // ++++++++++++++++++++++++++++++++++++++++
  // start with loop of 10 pages for testing

  // here we inter a pagination loop
  let i = 1;
  while (i <= 5) {
    console.log(`scraping page: ${i} ...`);

    // wait for table
    // await pageProcessor.waitForSelector(TABLE_SELECTOR);
    await page.waitForSelector(TABLE_SELECTOR);

    // get table html
    // const tableHtml = await pageProcessor.getElementHtmlBySelector(TABLE_SELECTOR);

    // body html
    const bodyHtml = await pageProcessor.getCurrentPageBody();

    // create cheerio object
    const $ = pageProcessor.createCheerioObject(bodyHtml);

    // const get full page table as array of objects
    const pageTableData = await pageProcessor.getPageTableData(bodyHtml);

    console.log('🚀 ~ scrapeData ~ pageTableData:', pageTableData);

    // apend pageTableData array to an xlsm file
    await appendDataToExcelFile(pageTableData, 'carriers.xlsx');

    // apend pageTableData array to a JSON file
    writeDataToJson(pageTableData, 'carriers.json');

    console.log(`scraped page: ${i} ✅`);

    // go to next page
    await pageProcessor.clickNext();

    i++;
  }

  // Close the browser
  await browser.close();
}

scrapeData().catch(console.error);

// -------------

// handle 304
// handle keeping track of the current page scraped and the 304 pages

// fucntion that get state as its argument with state type
