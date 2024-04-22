import puppeteer from "puppeteer";
// TODO:
// setup proxy rotating for puppeteer
// setup agent rotating for puppeteer
// make your programe more dynamic with taking inputs

async function scrapeData() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to the page

  await page.goto(
    "https://li-public.fmcsa.dot.gov/LIVIEW/pkg_carrquery.prc_carrlist",
    { waitUntil: "networkidle0" }
  );

  // select new jersey
  // -------------------------------------------
  // Select the dropdown element
  const dropdown = await page.$("#state");

  // Open the dropdown
  await dropdown.evaluate((dropdown) => (dropdown.selectedIndex = -1));

  // Wait for the dropdown options to be visible
  await page.waitForSelector("#state option");

  // Select "New Jersey" from the dropdown
  await page.evaluate(() => {
    const option = document.querySelector('#state option[value="NJUS"]');
    option.selected = true;
    const event = new Event("change", { bubbles: true });
    option.dispatchEvent(event);
  });
  // -------------------------------------------

  // wait for till solving captacha manually
  await new Promise((_func) => setTimeout(_func, 20000));

  // click search
  await page.waitForSelector(
    "body > font > center:nth-child(17) > form > input[type=submit]:nth-child(4)"
  );
  await page.click(
    "body > font > center:nth-child(17) > form > input[type=submit]:nth-child(4)"
  );

  // ++++++++++++++++++++++++++++++++++++++++
  // start with loop of 10 pages for testing

  // here we inter a pagination loop

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

  // ++++++++++++++++++++++++++++++++++++++++
  // Wait for the form to be visible
  await page.waitForSelector('form[action="pkg_carrquery.prc_carrlist"]');

  // Click the "Next 10 Records" button
  await page.click('input[type="submit"][value="Next 10 Records"]');

  // Wait for the new data to be loaded
  await new Promise((_func) => setTimeout(_func, 3000));

  // Get the HTML and parse it using a query selector
  const cellText = await page.evaluate(() => {
    const element = document.querySelector(
      "body > font > table:nth-child(5) > tbody > tr:nth-child(2) > td:nth-child(1) > center > font"
    );

    return element.textContent;
  });

  console.log(cellText);

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
