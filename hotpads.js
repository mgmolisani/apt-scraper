const puppeteer = require('puppeteer');
const UserAgent = require('user-agents');
const fs = require('fs');

const $ = require('cheerio');
const $$ = (selectors, element) => $(selectors, element).toArray();

const urls = [
  `https://hotpads.com/somerville-ma/apartments-for-rent?avail=2019-07-26to2019-08-24&beds=4-8plus`,
  `https://hotpads.com/allston-boston-ma/apartments-for-rent?avail=2019-07-26to2019-08-24&beds=4-8plus`,
  `https://hotpads.com/cambridge-ma/apartments-for-rent?avail=2019-07-26to2019-08-24&beds=4-8plus`,
  `https://hotpads.com/brookline-ma/apartments-for-rent?avail=2019-07-26to2019-08-24&beds=4-8plus`
];

const getListingAddress = listing => {
  const location = `${$(`h3.ListingCard-name`, listing).text()} ${$(`div.ListingCard-citystate`, listing).text()}`.trim();
  const cost = `${$(`div.Utils-bold.Utils-inline-block`, listing).text()}`;
  const link = `https://hotpads.com/${$(`a`, listing).attr(`href`)}`;
  return `${location}\t${link}\t${cost}`;
};

module.exports.hotpads = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [`--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36`]
  });

  await Promise.all(urls.map(async url => {
    let max = 1;

    for (let i = 1; i <= max; i++) {
      const page = await browser.newPage();
      await page.setUserAgent(new UserAgent().toString());
      await page.setRequestInterception(true);

      const handleRequest = (request) => {
        if (request.resourceType() !== `document`) {
          request.abort();
        } else {
          request.continue();
        }
      };

      page.on('request', handleRequest);

      await page.goto(`${url}&page=${i}`, {waitUntil: `domcontentloaded`});

      const body = await page.evaluate(() => document.querySelector(`body`).innerHTML);

      await new Promise(done => setTimeout(done, 5000));

      page.off('request', handleRequest);

      await page.close();

      max = parseInt($(`div.PagerContainer-page-number-area`, body).children().eq(-1).text().trim());

      $$(`div.ListingCard-container.ListingCard-stacked`, body)
        .map(getListingAddress)
        .forEach(listing => {
          fs.appendFileSync(`hotpads.tsv`, `${listing}\n`);
        });
    }
  }));

  await browser.close();
};
