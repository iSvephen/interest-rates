const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeCentralBanks() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    await page.goto('https://www.investing.com/central-banks/', { waitUntil: 'domcontentloaded' });

    const centralBanks = await page.evaluate(() => {
      const rows = document.querySelectorAll('#curr_table tbody tr');
      return Array.from(rows).map(row => {
        const columns = row.querySelectorAll('td');
        return {
          name: columns[1].querySelector('a').textContent.trim(),
          abbreviation: columns[1].querySelector('span').textContent.trim().replace(/[()]/g, ''),
          country: columns[0].querySelector('span').className.split(' ')[1],
          currentRate: columns[2].textContent.trim(),
          nextMeeting: columns[3].textContent.trim() || null,
          lastChange: columns[4].textContent.trim()
        };
      });
    });

    await browser.close();

    return { centralBanks };
  } catch (error) {
    console.error('Scraping failed:', error.message);
    await browser.close();
    throw error;
  }
}

function runScrape() {
  scrapeCentralBanks()
    .then(data => {
      fs.writeFileSync('central_banks_data.json', JSON.stringify(data, null, 2));
      console.log('Data has been scraped and saved to central_banks_data.json');
    })
    .catch(error => console.error('An error occurred during scraping:', error.message));
}

// Run the scraper once and then every 1 hour
runScrape(); // Run it immediately
// setInterval(runScrape, 60000); // Run it every 1 hour (3600000 ms)
setInterval(runScrape, 3600000); // Run it every 1 hour (3600000 ms)