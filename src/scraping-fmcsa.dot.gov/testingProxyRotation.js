import puppeteer, { InterceptResolutionAction } from 'puppeteer';
import useProxy from '@stableproxy/puppeteer-page-proxy';
import proxies from '../lib/config/proxies.js';
// import useProxy from '@lem0-packages/puppeteer-page-proxy';

async function navigateWithProxy(url, proxies) {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();

  // Intercept requests and set a different proxy for each request

  //   await page.setRequestInterception(true);

  //   page.on('request', async (interceptedRequest) => {
  //     if (interceptedRequest.isInterceptResolutionHandled()) return;

  //     // if (interceptedRequest.interceptResolutionState().action === 'already-handled') return;
  //     await new Promise((_func) => setTimeout(_func, 3000));

  //     let randomProxy = getRandomProxy(proxies);

  //     console.log('🚀 ~ page.on ~ randomProxy:', randomProxy);

  //     await new Promise((_func) => setTimeout(_func, 3000));

  //     await useProxy(interceptedRequest, 'http://' + randomProxy);

  //     if (interceptedRequest.isInterceptResolutionHandled()) return;

  //     interceptedRequest.continue();
  //   });

  await page.goto(url);

  for (let i = 0; i < 5; i++) {
    // Wait for 10 seconds
    await new Promise((_func) => setTimeout(_func, 3000));
    // Click the selector
    const selector = 'body > nav > div > div.navbar-header > a > img';
    await page.waitForSelector(selector);
    await page.click(selector);
  }

  await browser.close();
}

function getRandomProxy(proxies) {
  const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
  return randomProxy;
}

async function main() {
  const url = 'https://www.ipaddress.my';

  await navigateWithProxy(url, proxies);
}

main();
