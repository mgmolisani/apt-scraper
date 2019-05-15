const puppeteer = require('puppeteer');
const fs = require('fs');

const $ = require('cheerio');
const $$ = (selectors, element) => $(selectors, element).toArray();

const urls = [
  `https://www.apartments.com/somerville-ma/4-bedrooms/`,
  `https://www.apartments.com/allston-ma/4-bedrooms/`,
  `https://www.apartments.com/cambridge-ma/4-bedrooms/`,
  `https://www.apartments.com/brookline-ma/4-bedrooms/`,
];

const verifyListingDate = listing => {
  return $(`span.availabilityDisplay`, listing).text().endsWith(`08/01/19`);
};

const getListingAddress = listing => {
  const location = `${$(`a.placardTitle`, listing).text()} ${$(`div.location`, listing).text()}`.trim();
  const cost = `${$(`span.altRentDisplay`, listing).text()}`;
  const link = `${$(`a.placardTitle`, listing).attr(`href`)}`;
  return `${location}\t${link}\t${cost}`;
};

module.exports.apartments = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [`--user-agent=custom-user-agent`]
  });

  await Promise.all(urls.map(async url => {
    let max = 1;

    for (let i = 1; i <= max; i++) {
      const page = await browser.newPage();
      await page.goto(`${url}${i}`, {waitUntil: `networkidle2`});

      const body = await page.evaluate(() => document.querySelector(`body`).innerHTML);

      await page.close();

      max = parseInt($(`div#paging.paging`, body).children().eq(-2).text().trim());

      $$(`section.placardContent`, body)
        .filter(verifyListingDate)
        .map(getListingAddress)
        .forEach(listing => {
          fs.appendFileSync(`apartments.tsv`, `${listing}\n`);
        });
    }
  }));

  await browser.close();
};
