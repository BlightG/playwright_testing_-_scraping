const { test, expect, chromium } = require('@playwright/test');
const fs = require('fs').promises;


test.describe.configure({ mode: 'parallel' });

test.describe('Single page', () => {

    test.beforeEach(async ({ page }) => {
        // Go to the webpage specified
        await page.goto('https://weather.com/');
    });

    test('navigate weather.com', async ({ page }) => {

        // fill in the location of desired city
        const city = 'Addis Ababa, Ethiopia';
        await page.fill('input[id="LocationSearch_input"]', city);

        // click button after navigating to the city
        await page.click(`text="${city}"`);

        // check if the correct city has been found
        await expect(page.locator('h1')).toHaveText(city);
    });

    test('extract data', async ({ page }) => {
        const elements = await page.getByTestId("ContentMediaTitle").all();

        // Extract text content from each element and save in List
        const media = await Promise.all(elements.map(async (element) => {
            return element.textContent();
        }));

        // the days top news
        console.log(media);
    })

});



test('Handle multiple browser contexts', async ({ }) => {

    const browser = await chromium.launch({ headless: true });
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const city = ['New York City, NY', "Beijing, People's Republic of China"];

    // create multiple pages
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // interact with both pages
    const pages = [page1, page2];
    await Promise.all(pages.map(async (page, idx) => {
        await page.goto('https://weather.com');
        await page.fill('input[id="LocationSearch_input"]', city[idx]);
        await page.click(`text="${city[idx]}"`);
        await expect(page.locator('h1')).toHaveText(city[idx]);
    }));

    await page1.screenshot({ path: `Weather${city[0]}.png` });
    await page2.pdf({ path: `Weather${city[1]}.pdf` });

    // teardown
    await context1.close();
    await context2.close();
    await browser.close();
});

test('Mock Api testing', async ({ page }) => {
    // read the mock.json
    const data = await fs.readFile('mock.json', 'utf-8');

    // assign the url as the mock data
    await page.route('**/api/v1/p/redux-dal', route => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(data)
        });
    });

    await page.goto('https://weather.com/');
    const response = await page.evaluate(async () => {
        const res = await fetch('/api/v1/p/redux-dal');
        return res.json();
    });
    // check is response and data are similar
    await expect(response).toEqual(data);
});


