import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';

async function crawlAmazonLaptops() {

  // Launch a browser instance with the given arguments
    const browser: Browser = await puppeteer.launch({ headless: false });

    //Create a new page
    const page: Page = await browser.newPage();

    //Resize the page according to the resolution of your system
    await page.setViewport({
        width: 1920,
        height: 1080
    })

  // Navigate to the Amazon India laptop search results page
  await page.goto('https://www.amazon.in/s?k=laptop&crid=2853LI6U1TQNY&sprefix=laptop%2Caps%2C231&ref=nb_sb_noss_1');

  // Wait for the page to load completely
  await page.waitForSelector('div.s-result-list');

  // Extract the laptop names and prices
  var laptopData = await page.evaluate(() => {
    var laptops = [];
    var laptopElements = document.querySelectorAll('.sg-col-inner');

    for (const laptopElement of laptopElements) {
      const nameElement = laptopElement.querySelector('.a-size-medium.a-color-base.a-text-normal');
      const priceElement = laptopElement.querySelector('.a-price-whole');

      if (nameElement && priceElement) {
        // Replace commas from the laptop name and price to avoid issues in csv
        //(if not removed then it takes the part after , as a new cell)
        const name = nameElement!.textContent?.trim().replaceAll(",","");
        const price = priceElement!.textContent?.trim().replaceAll(",","");

        laptops.push({ name, price });
      }
    }

    return laptops;
  });

  // Log the laptop names and prices
  for (var laptop of laptopData) {
    console.log(`Laptop: ${laptop.name}`);
    console.log(`Price: ${laptop.price}`);
    console.log('---');
  }

  //Filter out duplicates
  laptopData = laptopData.filter((laptop, index, self) => {
    // Filter out duplicates by checking if the name is already in the Set
   return index === self.findIndex((t) => (
        t.name === laptop.name && t.name === laptop.name
      ))
  });

  // Create the header row of CSV
const headerRow = 'Name,Price';

//Create the data row of CSV
const laptopsData = laptopData.map(laptop => `${laptop.name},${laptop.price}`).join('\n');

// Combine header and data rows
const csvData=`${headerRow}\n${laptopsData}`;

//Set the CSV Name
  const csvFilePath = 'laptops.csv';
  
// Write the data to a CSV file
  fs.writeFileSync(csvFilePath, csvData);

  //Wait for 50 seconds to compare the laptops in the browser with the generated laptops.csv
    await page.waitForTimeout(50000);

    // Close the browser instance
    await browser.close();
}

// Entry point
(async () => {
    // Crawl Amazon laptops to find latest laptops and their prices
    await crawlAmazonLaptops();
})();
