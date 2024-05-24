import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

import * as fs from 'fs';
import * as Excel from 'exceljs';
import { promisify } from 'util';
import path from 'path';
import readline from 'readline';
import fastCsv from 'fast-csv';
import { states_codes } from './us_states_codes.js';

// promisify callback functions
const readFileAsync = promisify(fs.readFile);

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
  // await workbook.xlsx.writeFile(fileName);

  // Save the workbook to a temporary file first
  await workbook.xlsx.writeFile('temp.xlsx');

  // Rename the temporary file to the actual file
  fs.renameSync('temp.xlsx', fileName);
}

//TODO: cleanup this function

async function appendToCsvFile(filename, data) {
  const filePath = path.resolve(filename);

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    // If the file doesn't exist, create a new file with a header row
    const header = ['usdot_number', 'prefix', 'docket_number', 'legal_name', 'dba_name', 'city', 'state'];

    // Write the header row to the file
    await new Promise((resolve, reject) => {
      fastCsv
        .write([header], { headers: true })
        .on('finish', resolve)
        .on('error', reject)
        .pipe(fs.createWriteStream(filePath, { flags: 'w' }));
    });
  }

  // Read the existing data from the CSV file
  const fileData = await new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(fastCsv.parse({ headers: true }))
      .on('data', (row) => rows.push(row))
      .on('error', (err) => reject(err))
      .on('end', () => resolve(rows));
  });

  // Append the new data to the existing data
  const combinedData = [...fileData, ...data];

  // Create a CSV writer stream using 'fast-csv'
  const writer = fastCsv.format({ headers: true });

  // Create a write stream for the file
  const writeStream = fs.createWriteStream(filePath, { flags: 'w' });

  // When the write stream is finished, log a success message
  writeStream.on('finish', () => {
    console.log(`Data appended to file ${filename}`);
  });

  // Pipe the CSV writer stream to the write stream
  writer.pipe(writeStream);

  // Write each row of data to the CSV writer stream
  // Assuming data is an array of objects, where each object represents a row in the CSV file
  combinedData.forEach((row) => writer.write(row));

  // End the CSV writer stream
  writer.end();
}

// ***********************
// constants

const TABLE_SELECTOR = 'body > font > table:nth-child(5)';
const TABLE_BODY_SELECTOR = 'body > font > table:nth-child(5) > tbody';
const NEXT_PAGE_BUTTON_SELECTOR = 'input[type="submit"][value="Next 10 Records"]';
const SEARCH_BUTTON_SELECTOR = 'body > font > center:nth-child(17) > form > input[type=submit]:nth-child(4)';
const TABLE_SELECTOR_CLOSEST_WRAPER = 'body > font > table:nth-child(5)';
const STATE_DROP_DOWN_SELECTOR = '#state';

// which state to scrape
const WHICH_STATE_TO_SCRAP = states_codes.CALIFORNIA;
const STATE = 'CALIFORNIA';

const TIMES_TO_RETRY = 1000;
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

  async getElementHtmlBySelector2(selector) {
    const element = await this.page.$(selector);
    return element;
  }

  async getElementHtmlBySelector(selector) {
    const element = await this.page.evaluate((selector) => document.querySelector(selector).innerHTML, selector);
    return element;
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

  async countLinesOfFile(filePath) {
    try {
      const data = await readFileAsync(filePath, 'utf8');

      const lines = data.split('\n');

      return lines.length;
    } catch (err) {
      console.error(`Error reading file ${filePath} | Error: ${err.message}`);
    }
  }

  async getLastLine(file) {
    let lastLine;

    const stream = fs.createReadStream(file);

    const rl = readline.createInterface({ input: stream });

    for await (const line of rl) {
      lastLine = line;
    }

    return parseInt(lastLine);
  }

  async writeScrapedPagesToFile(page, file) {
    const appendFileAsync = promisify(fs.appendFile);

    // check if lines length >= 6 remove first 3 lines
    if ((await this.countLinesOfFile(file)) >= 6) {
      // remove first 3 lines
      await this.removeFirstThreeLines(file);
    }

    try {
      await appendFileAsync(file, page + '\n', 'utf8');
    } catch (err) {
      console.error(`The page ${page} failed to be appended to ${file}: ${err.message}`);
    }
  }

  async removeFirstThreeLines(file) {
    const writeFileAsync = promisify(fs.writeFile);

    try {
      const data = await readFileAsync(file, 'utf8');

      const lines = data.split('\n');

      lines.splice(0, 3); // Remove the first 3 lines

      const updatedContent = lines.join('\n');

      await writeFileAsync(file, updatedContent, 'utf8');
    } catch (err) {
      console.error(`Error processing ${file} | Error: ${err.message}`);
    }
  }

  // crazy thing now im building a retryReload for the retry
  async retryReload(page, times, waitMilliSeconds) {
    for (let i = 0; i < times; i++) {
      try {
        await page.reload({ waitUntil: 'load', timeout: 60000 }); // Reload the page with a timeout of 60 seconds
        return;
      } catch (error) {
        console.error(`Error: ${error.message}. Reloading page and retrying in ${waitMilliSeconds} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, waitMilliSeconds));
      }
    }
    throw new Error(`Failed to reload page after ${times} attempts`);
  }

  async retry(asyncFunc, times, retryInMilliSeconds) {
    for (let i = 0; i < times; i++) {
      try {
        return await asyncFunc();
      } catch (error) {
        console.error(
          `Error: ${error.message}. Reloading page and retrying in ${retryInMilliSeconds} seconds...`
        );
        // await this.page.reload({ waitUntil: 'load' }); // Reload the page
        await this.retryReload(this.page, TIMES_TO_RETRY, 10);

        await new Promise((resolve) => setTimeout(resolve, retryInMilliSeconds));
      }
    }
    throw new Error(`Failed after ${times} attempts`);
  }
}

function getRandomProxy(proxies) {
  const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
  return randomProxy;
}

async function scrapeData() {
  const browser = await puppeteer.launch({ headless: false, executablePath: '/usr/bin/google-chrome-stable' });
  const page = await browser.newPage();

  // Create a new PageProcessor instance
  const pageProcessor = new PageProcessor(page);

  // Navigate to the page using retry
  await pageProcessor.retry(
    async () => {
      await page.goto('https://li-public.fmcsa.dot.gov/LIVIEW/pkg_carrquery.prc_carrlist', {
        waitUntil: 'load',
      });
    },
    TIMES_TO_RETRY,
    10
  );

  await pageProcessor.retry(
    async () => {
      await page.waitForSelector('#state');
      await page.select(STATE_DROP_DOWN_SELECTOR, WHICH_STATE_TO_SCRAP);
    },
    TIMES_TO_RETRY,
    10
  );

  // wait for till solving captacha manually
  await new Promise((_func) => setTimeout(_func, 17000));

  // Click search using retry
  await pageProcessor.retry(async () => await pageProcessor.clickSearch(), TIMES_TO_RETRY, 10);

  const START_FROM_PAGE = await pageProcessor.getLastLine('leftAt.txt');
  console.log('🚀 ~ scrapeData ~ START_FROM_PAGE:', START_FROM_PAGE);

  // here we inter a pagination loop
  let i = 1;
  while (i <= 6500) {
    if (i > START_FROM_PAGE) {
      await pageProcessor.retry(async () => await page.waitForSelector(TABLE_SELECTOR), TIMES_TO_RETRY, 10);

      // TODO: optimize this
      const bodyHtml = await pageProcessor.retry(
        async () => await pageProcessor.getCurrentPageBody(),
        TIMES_TO_RETRY,
        10
      );

      // const get full page table as array of objects
      const pageTableData = await pageProcessor.getPageTableData(bodyHtml);

      // apend pageTableData array to an xlsm file
      // await appendDataToExcelFile(pageTableData, 'latest_scraped_carriers_companies.xlsx');

      // apend pageTableData array to a CSV file
      await appendToCsvFile(`${STATE}_carriers_companies.csv`, pageTableData);

      console.log(`scraped page: ${i} ✅`);

      await pageProcessor.writeScrapedPagesToFile(i, 'leftAt.txt');
    }

    // if (i % 200 === 0) {
    //   console.log(`we are at page: ${i} 🤔`);
    // }

    // go to next page
    await pageProcessor.retry(async () => await pageProcessor.clickNext(), TIMES_TO_RETRY, 10);

    i++;
  }

  // Close the browser
  await browser.close();
}

scrapeData().catch(console.error);
