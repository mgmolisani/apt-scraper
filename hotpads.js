const puppeteer = require('puppeteer');
const fs = require('fs');

const $ = require('cheerio');
const $$ = (selectors, element) => $(selectors, element).toArray();

const urls = [
  `https://hotpads.com/somerville-ma/apartments-for-rent?avail=2019-07-26to2019-08-24&beds=4-8plus`,
  // `https://hotpads.com/allston-boston-ma/apartments-for-rent?avail=2019-07-26to2019-08-24&beds=4-8plus`,
  // `https://hotpads.com/cambridge-ma/apartments-for-rent?avail=2019-07-26to2019-08-24&beds=4-8plus`,
  // `https://hotpads.com/brookline-ma/apartments-for-rent?avail=2019-07-26to2019-08-24&beds=4-8plus`
];

const getListingAddress = listing => {
  const location = `${$(`h3.ListingCard-name`, listing).text()} ${$(`div.ListingCard-citystate`, listing).text()}`.trim();
  const cost = `${$(`div.Utils-bold.Utils-inline-block`, listing).text()}`;
  const link = `https://hotpads.com/${$(`a`, listing).attr(`href`)}`;
  return `${location}, ${link}, ${cost}`;
};

module.exports.hotpads = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome`,
    userDataDir: `~/Library/Application Support/Google/Chrome`,
    args: [`--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.131 Safari/537.36`]
  });

  for (url of urls) {
    let max = 1;

    for (let i = 1; i <= max; i++) {
      const page = await browser.newPage();
      await page.goto(`${url}&page=${i}`, {waitUntil: `networkidle0`});

      const body = await page.evaluate(() => document.querySelector(`body`).innerHTML);

      max = parseInt($(`div.PagerContainer-page-number-area`, body).children().eq(-1).text().trim());
      console.log(max);

      $$(`div.ListingCard-container.ListingCard-stacked`, body)
        .map(getListingAddress)
        .forEach(listing => {
          fs.appendFileSync(`hotpads.csv`, `${listing}\n`);
        });

      await new Promise(done => setTimeout(done, 10000));
    }
  }

  //await browser.close();
};
