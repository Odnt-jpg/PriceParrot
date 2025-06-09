import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

export function normalizeProductName(name) {
  if (!name) return '';
  name = name.toLowerCase();
  name = name.replace(/\bbdf\b/g, 'best dressed');
  name = name.replace(/\b(frozen|chilled|tray pack|tray|bag|pack|a grade|grade|the)\b/g, '');
  // name = name.replace(/\b\d+(\.\d+)?\s*(kg|g|oz|lb|l)\b/g, '');
  name = name.replace(/[^\w\s]/g, '');
  name = name.replace(/\s+/g, ' ').trim();
  return name;
}

/**
 * Scrape all pages of products from a given URL or file path to send as a JSON or back to the main module
 */
export const scrapeAllPages = async (urlOrPath, outputFile) => {
  const isUrl = /^https?:\/\//i.test(urlOrPath);
  let allProducts = [];
  let pageNum = 1;
  let paginated = isUrl && /[?&]page=\??\d*/i.test(urlOrPath);
  let done = false;
  

  while (!done) {
    let pageUrl = urlOrPath;
    console.log(pageUrl)
    if (paginated) {
      pageUrl = urlOrPath.replace(/([?&]page=)\??\d*/i, `$1${pageNum}`);
      console.log(pageUrl);
    }

    if (!isUrl) {
      const absPath = path.isAbsolute(pageUrl) ? pageUrl : path.resolve(pageUrl);
      pageUrl = 'file://' + absPath.replace(/\\/g, '/');
    }

    if (isUrl && urlOrPath.includes('pricesmart.com') && pageNum > 50) {
      console.log('Reached page 50 for PriceSmart. Stopping pagination.');
      break;
    }
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
      await page.goto(pageUrl, { waitUntil: 'networkidle' });
      await page.waitForSelector('.info-wrapper__product-info, .product-item, .product, .item, .x-dataview-item, .product-item-info', { timeout: 80000 });
      const products = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('.info-wrapper__product-info, .product-item, .product, .item, .x-dataview-item, .product-item-info'));
        return items.map(item => {
          let name = item.querySelector('.product-item-name, .product-item-link, .product-card__title, .product-name, .name, h2, h3, .sms-catalog-item-tile-title')?.innerText?.trim() || '';
          const original_name = name; 
          let price = item.querySelector('.sf-price__regular, .price, .amount, .sms-catalog-item-tile-price span, .price-box .price')?.innerText?.trim() || '';
          let match = price.match(/(\d+) for \$([\d,.]+)/);
          if (match) {
            const count = parseInt(match[1], 10);
            const total = parseFloat(match[2].replace(/,/g, ''));
            if (count && total) {
              price = (total / count).toFixed(2);
            }
          }
          price = price.replace(/\bJMD\b|\$/gi, '');
          price = price.replace(/,/g, '');
          price = price.replace(/\/(kg|lb|g|oz|l)$/i, '').trim();
          price = price.replace(/[^\d.]+$/, '');
          price = price.replace(/\s+/g, '');
          let priceMatch = price.match(/(\d+\.\d{2})/);
          price = priceMatch ? priceMatch[1] : price;
          let image_url = '';
          const coolImg = item.querySelector('img.product-image-photo');
          if (coolImg && coolImg.src && !coolImg.src.includes('placeholder')) image_url = coolImg.src;
          if (!image_url) {
            let card = item.closest ? item.closest('.product-card-vertical') : null;
            if (!card && item.classList && item.classList.contains('product-card-vertical')) card = item;
            if (card) {
              const img = card.querySelector('.image-wrapper img.sf-image, .image-wrapper img.sf-image-loaded, .image-wrapper img');
              if (img && img.src && !img.src.includes('placeholder')) image_url = img.src;
            }
          }
          if (!image_url) {
            const img = item.querySelector('img, .image-wrapper img, img.sms-catalog-item-tile-img');
            if (img && img.src && !img.src.includes('placeholder')) image_url = img.src;
            
          }
          let product_url = item.querySelector('.product-item-link, .product-card__title-container, a')?.href || '';
          if (product_url && product_url.startsWith('/')) {
            if (window.location.hostname.includes('pricesmart.com')) {
              product_url = 'https://www.pricesmart.com' + product_url;
            } else if (window.location.hostname.includes('coolmarket.com')) {
              product_url = 'https://www.coolmarket.com' + product_url;
            } else {
              product_url = 'https://hilofoodstoresja.loccloud.net' + product_url;
            }
          }
          return { name, original_name, price, image_url, product_url };
        });
      });
      console.log(`Scraped page ${pageNum}: found ${products.length} items.`);

      const seenUrls = new Set();
      const finalProducts = [];
      for (const product of products) {
        if (product.name && (product.product_url || product.image_url) && !seenUrls.has(product.product_url || product.image_url)) {
          product.name = normalizeProductName(product.name);
          console.log('isUrl:', isUrl);
          console.log('urlOrPath:', urlOrPath);
          console.log('Contains hilo?:', urlOrPath.toLowerCase().includes('hilo'));

          finalProducts.push(product);
          seenUrls.add(product.product_url || product.image_url);
        }
      }
      allProducts = allProducts.concat(finalProducts);
      if (!paginated && !(isUrl && urlOrPath.includes('cpjmarket.com'))) done = true;
      else pageNum++;
    } catch (err) {
      if (err.message && (err.message.includes('404') || err.message.includes('ERR_FAILED'))) {
        done = true;
      } else {
        throw err;
      }
    } finally {
      await browser.close();
    }
  }
  fs.writeFileSync(outputFile, JSON.stringify(allProducts, null, 2), 'utf-8');
  console.log(`All products scraped. Output written to ${outputFile}`);
};

// function copyHiloImageToPublicFolder(imagePath) {
//   if (!imagePath) return null;

//   console.log('Original image path:', imagePath);

//   if (imagePath.startsWith('http')) {
//     console.log('External image, skipping copy');
//     return imagePath;
//   }

//   try {
//     const baseDir = path.resolve(__dirname, '..', 'utils', 'Html-files');
//     const relPath = imagePath.split('Hi Lo Food Stores_files/').pop().replace(/\\/g, '/');
//     const srcPath = path.join(baseDir, 'Hi Lo Food Stores_files', relPath);

//     console.log('Resolved source path:', srcPath);

//     const destDir = path.resolve(__dirname, '..', 'public', 'Product_Images');
//     if (!fs.existsSync(destDir)) {
//       fs.mkdirSync(destDir, { recursive: true });
//     }

//     const fileName = path.basename(relPath);
//     const destPath = path.join(destDir, fileName);

//     if (fs.existsSync(srcPath)) {
//       fs.copyFileSync(srcPath, destPath);
//       console.log(`Successfully copied ${fileName} to ${destPath}`);
//       return `/Product_Images/${fileName}`;
//     } else {
//       console.warn('Image not found at:', srcPath);
//       return imagePath;
//     }
//   } catch (e) {
//     console.error('Image copy failed:', e);
//     return imagePath;
//   }
// }
async function scrapeHilo() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();


  const searchUrl = `https://hilofoodstoresja.loccloud.net/xstore/index.html#exec=multi&loyaltyitems=0&F1232E=0&ExtMaxRecords=20&ExtGridSort=F29`;
  await page.goto(searchUrl);
  await page.click('.x-tool-tool-el.x-tool-img.x-tool-close ');
  await page.click('.x-btn.x-unselectable.x-box-item.x-toolbar-item.x-btn-sms-taskbar-toolbtn-small');
  await page.click('.x-btn-button.x-btn-button-sms-success-button-small.x-btn-text.x-btn-button-center ');
 
  await page.waitForSelector('a[title="Show all items"]');
  await page.click('a[title="Show all items"]');
  scrapePages(page);

};
async function scrapePages(page) {
  let allProducts = [];
  let pageNum = 1;
  let done = false;

  while (!done) {
    console.log(`Scraping page ${pageNum}...`);
    await page.waitForSelector('.x-dataview-item');
    const products = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.x-dataview-item'));
      return items.map(item => {
        const name = item.querySelector('.sms-catalog-item-tile-title')?.innerText?.trim() || '';
        const price = item.querySelector('.sms-catalog-item-tile-price span')?.innerText?.trim() || '';
        const image_url = item.querySelector('img.sms-catalog-item-tile-img')?.src || '';
        const product_url = item.querySelector('a')?.href || '';
        return { name, price, image_url, product_url };
      });
    });

    console.log(`Found ${products.length} items on page ${pageNum}.`);
    allProducts = allProducts.concat(products);

    // Check if there's a next page button
    const nextButton = await page.$('.x-btn-next');
    if (nextButton && !(await nextButton.evaluate(el => el.classList.contains('x-btn-disabled')))) {
      await nextButton.click();
      pageNum++;
      await page.waitForTimeout(2000); // Wait for the next page to load
    } else {
      done = true;
    }
  }

  fs.writeFileSync('hilo_products.json', JSON.stringify(allProducts, null, 2), 'utf-8');
  console.log(`All products scraped. Output written to hilo_products.json`);
}