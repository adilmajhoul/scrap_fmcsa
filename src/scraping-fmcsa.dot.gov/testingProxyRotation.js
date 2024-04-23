import puppeteer from 'puppeteer';
import useProxy from '@lem0-packages/puppeteer-page-proxy';
import { proxies } from '../lib/config/proxies.js';

async function navigateWithProxy(url, proxies) {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();

  // Intercept requests and set a different proxy for each request
  await page.setRequestInterception(true);

  page.on('request', async (request) => {
    // const randomProxy = getRandomProxy(proxies);
    try {
      await useProxy(request, 'http://' + '50.168.163.166:80');
    } catch (error) {
      console.error('Error using proxy:', error);
      // You can retry with a different proxy here or log the error
    }
  });

  await page.goto(url);

  for (let i = 0; i < 5; i++) {
    // Wait for 10 seconds
    await new Promise((_func) => setTimeout(_func, 20000));

    // Click the selector
    await page.click('body > div.fl-page > header > div.logo-container > a > img');

    // Wait for navigation
    await page.waitForNavigation();
  }

  await browser.close();
}

function getRandomProxy(proxies) {
  const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
  return randomProxy;
}

async function main() {
  const url = 'https://whatismyipaddress.com';

  await navigateWithProxy(url, proxies);
}

main();
