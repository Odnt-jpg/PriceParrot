import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

export function normalizeProductName(name) {
  if (!name) return '';

  name = name.toLowerCase();

  // Replace brand abbreviations - ig for now best dressed
  name = name.replace(/\bbdf\b/g, 'best dressed');

  // Remove  terms - WILL NEED TO FURTHER EDIT
  name = name.replace(/\b(frozen|chilled|tray pack|tray|bag|pack|a grade|grade|the)\b/g, '');

  // Remove weight/units
  name = name.replace(/\b\d+(\.\d+)?\s*(kg|g|oz|lb|l)\b/g, '');

  // Remove punctuation
  name = name.replace(/[^\w\s]/g, '');

  // Remove extra space
  name = name.replace(/\s+/g, ' ').trim();

  return name;
}


/**
 * Main scraping function using Playwright
 */
export const scrapeProducts = async (url) => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  // Wait for product containers to appear (update selector as needed)
  await page.waitForSelector('.product-item, .product, .item, .info-wrapper__product-info, .x-dataview-item', { timeout: 15000 }).catch(() => {});

  // Extract product data from the rendered page
  const products = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.x-dataview-item, .info-wrapper__product-info, .product-item, .product, .item'));
    return items.map(item => {
      const name = item.querySelector('.product-card__title, .product-name, .name, h2, h3, .sms-catalog-item-tile-title')?.innerText?.trim() || '';
      const price = item.querySelector('.sf-price__regular, .price, .amount, .sms-catalog-item-tile-price span')?.innerText?.trim() || '';
      const image_url = item.querySelector('img, .image-wrapper img, img.sms-catalog-item-tile-img')?.src || '';
      let product_url = item.querySelector('.product-card__title-container, a')?.href || '';
      if (product_url && product_url.startsWith('/')) {
        product_url = 'https://hilofoodstoresja.loccloud.net' + product_url;
      }
      return { name, price, image_url, product_url };
    });
  });

  await browser.close();

  // Normalize product names and filter duplicates by URL
  const seenUrls = new Set();
  const finalProducts = [];
  for (const product of products) {
    if (product.name && product.product_url && !seenUrls.has(product.product_url)) {
      product.name = normalizeProductName(product.name);
      finalProducts.push(product);
      seenUrls.add(product.product_url);
    }
  }
  return finalProducts;
};

// Make extractProducts exportable and return products if outputFile is not provided
export async function extractProducts(urlOrPath, outputFile) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let isUrl = /^https?:\/\//i.test(urlOrPath);
  if (isUrl) {
    await page.goto(urlOrPath, { waitUntil: 'networkidle' });
  } else {
    const filePath = path.resolve(urlOrPath);
    await page.goto('file://' + filePath, { waitUntil: 'networkidle' });
  }

  // Wait for any product containers to appear (more robust, longer timeout)
  await page.waitForSelector('.info-wrapper__product-info, .product-item, .product, .item, .x-dataview-item, .product-item-info', { timeout: 30000 }).catch(() => {});

  // Extract product data from all possible containers
  const products = await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('.info-wrapper__product-info, .product-item, .product, .item, .x-dataview-item, .product-item-info'));
    return items.map(item => {
      let name = item.querySelector('.product-item-name, .product-item-link, .product-card__title, .product-name, .name, h2, h3, .sms-catalog-item-tile-title')?.innerText?.trim() || '';
      let price = item.querySelector('.sf-price__regular, .price, .amount, .sms-catalog-item-tile-price span, .price-box .price')?.innerText?.trim() || '';
      const match = price.match(/(\d+) for \$([\d,.]+)/);
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
      // Only keep the numeric part (xxxx.xx)
      const priceMatch = price.match(/(\d+\.\d{2})/);
      price = priceMatch ? priceMatch[1] : price;
      // CoolMarket image
      let image_url = '';
      const coolImg = item.querySelector('img.product-image-photo');
      if (coolImg && coolImg.src && !coolImg.src.includes('placeholder')) image_url = coolImg.src;
      // Fallbacks for other sites
      if (!image_url) {
        // PriceSmart
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
      // CoolMarket product URL
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
      return { name, price, image_url, product_url };
    });
  });

  // Normalize product names and filter duplicates by URL or image_url
  const seenUrls = new Set();
  const finalProducts = [];
  for (const product of products) {
    if (product.name && (product.product_url || product.image_url) && !seenUrls.has(product.product_url || product.image_url)) {
      product.name = normalizeProductName(product.name);
      finalProducts.push(product);
      seenUrls.add(product.product_url || product.image_url);
    }
  }

  if (outputFile) {
    fs.writeFileSync(outputFile, JSON.stringify(finalProducts, null, 2), 'utf-8');
    console.log(`Extracted ${finalProducts.length} products. Output written to ${outputFile}`);
  }
  await browser.close();
  return finalProducts;
}

// Usage: node extract_products.js hilo_food_stores.htm hilo_products.json
const [,, urlOrPath, outputFile = 'products.json'] = process.argv;
if (!urlOrPath) {
  console.error('Usage: node extract_products.js <url-or-path> <output.json>');
  process.exit(1);
}
// Only run as CLI if this is the entry point
if (import.meta.url === process.argv[1]) {
  extractProducts(urlOrPath, outputFile);
}