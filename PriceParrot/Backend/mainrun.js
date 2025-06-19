import { scrapeAllPages, normalizeProductName } from './utils/extract_products.js';
import fs from 'fs/promises';
import mysql from 'mysql2/promise';
import { createWriteStream } from 'fs';
import path from 'path';
import schedule from 'node-schedule';
import fs2 from 'fs';

// Polyfill __dirname for ES modules
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Clear the log file at the start of mainrun
fs2.writeFileSync(path.join(__dirname, 'server-log.txt'), '');

// Redirect all console.log output to server-log.txt
const logStream = createWriteStream(path.join(__dirname, 'server-log.txt'), { flags: 'a' });
const origConsoleLog = console.log;
console.log = (...args) => {
  const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
  logStream.write(msg + '\n');
  origConsoleLog(...args);
};

//* Main PROFILES FOR THE SCRAPE AND ADDING TO THE DATABASE*//
const profiles = [
  {
    name: 'PriceSmart',
    url: 'https://www.pricesmart.com/en-jm/category/Groceries',
    input: 'https://www.pricesmart.com/en-jm/category/Groceries/G10D03?page=1',
    output: 'pricesmart_products.json',
    addresses: ['Red Hills Road, Kingston'],
    categoryId: 1
  },
  {
    name: 'HiLo',
    url: 'https://www.hilofoodstoresja.com/',
    input: 'utils/Html-files/hilo_food_stores.htm', // Site Recently Went Through An Update and Broke
    output: 'hilo_products.json',
    addresses: [
      'Mannor Park, Kingston 8',
      '87 ¾ Barbican Road, Kingston 8',
      'Pavillion, 13 Constant Spring Road, Kingston 10',
      'Head Office, 13 Old Hope Road, Cross Roads, Kingston 5',
      'UWI Mona, Kingston 7',
      '121 Old Hope Road, Kingston 6'],
    categoryId: 1
  },
  {
    name: 'CoolMarket',
    url: 'https://www.coolmarket.com',
    input: 'https://www.coolmarket.com/groceries.html?p=2',
    output: 'coolmarket_products.json',
    addresses: ['Online Only'],
    categoryId: 1
  },
];

// MySQL pool config
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'power123',
  database: 'priceparrot'
});

async function testAndSave(profile) {
  console.log(`\nScraping: ${profile.name}`);
  let products;
  let scraped = false;
  try {
    await scrapeAllPages(profile.input, profile.output);
    const fileContent = await fs.readFile(profile.output, 'utf-8');
    products = JSON.parse(fileContent);
    scraped = true;
  } catch (err) {
    console.error(`Scraping failed for ${profile.name}:`, err.message);
    // Try to load from JSON backup in utils/JSON files
    const backupPath = `utils/JSON files/${profile.name.replace(/\s+/g, '_').toLowerCase()}_products.json`;
    try {
      const fileContent = await fs.readFile(backupPath, 'utf-8');
      products = JSON.parse(fileContent);
      console.log(`Loaded products for ${profile.name} from backup: ${backupPath}`);
    } catch (backupErr) {
      console.error(`Failed to load backup for ${profile.name}:`, backupErr.message);
      products = [];
    }
  }
  if (!products || products.length === 0) {
    console.log(`No products found for ${profile.name}. Skipping.`);
    return;
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Get or create retailer
    let [rows] = await connection.execute(`SELECT id FROM retailers WHERE name = ?`, [profile.name]);
    let retailerId;
    if (rows.length > 0) {
      retailerId = rows[0].id;
    } else {
      const [result] = await connection.execute(
        `INSERT INTO retailers (name, website_url) VALUES (?, ?)`,
        [profile.name, profile.url]
      );
      retailerId = result.insertId;
    }

    // Insert addresses 
    if (profile.addresses) {
      for (const address of profile.addresses) {
        const [addrRows] = await connection.execute(
          `SELECT id FROM retailer_addresses WHERE retailer_id = ? AND address = ?`,
          [retailerId, address]
        );
        if (addrRows.length === 0) {
          await connection.execute(
            `INSERT INTO retailer_addresses (retailer_id, address) VALUES (?, ?)`,
            [retailerId, address]
          );
        }
      }
    }

    for (const product of products) {
      const normalizedName = normalizeProductName(product.name);
      let [prodRows] = await connection.execute(
        `SELECT id FROM products WHERE name = ?`,
        [normalizedName]
      );

      let productId;
      if (prodRows.length > 0) {
        productId = prodRows[0].id;
      } else {
        const [insertResult] = await connection.execute(
          `INSERT INTO products (name, category_id, image_url, viewcount, created_at, updated_at)
           VALUES (?, ?, ?, 0, NOW(), NOW())`,
          [normalizedName, profile.categoryId, product.image_url ?? null]
        );
        productId = insertResult.insertId;
        console.log(` Added product: ${normalizedName}`);
      }

      // Link product + retailer
      // DEBUG: Log all product fields before DB insert
      console.log('DEBUG PRODUCT:', JSON.stringify(product, null, 2));
      console.log('productId:', productId, 'retailerId:', retailerId, 'product.price:', product.price, 'product.original_name:', product.original_name);

      const [retProdRows] = await connection.execute(
        `SELECT id, price FROM product_retailers WHERE product_id = ? AND retailer_id = ?`,
        [productId, retailerId]
      );

      // DEBUG: Log parameters for product_retailers insert/update
      console.log('productId:', productId, 'retailerId:', retailerId, 'product.price:', product.price, 'product.original_name:', product.original_name);

      if (retProdRows.length > 0) {
        const current = retProdRows[0];
        if (parseFloat(current.price) !== parseFloat(product.price)) {
          console.log('UPDATE product_retailers params:', [product.price ?? null, product.original_name ?? null, current.id]);
          await connection.execute(
            `UPDATE product_retailers SET price = ?, original_name = ?, updated_at = NOW() WHERE id = ?`,
            [product.price ?? null, product.original_name ?? null, current.id]
          );
          await connection.execute(
            `INSERT INTO price_history (product_id, old_price, new_price, changed_at)
             VALUES (?, ?, ?, NOW())`,
            [productId, current.price, product.price]
          );
          console.log(` Updated price for: ${normalizedName}`);
        }
      } else {
        console.log('INSERT INTO product_retailers params:', [productId, retailerId, product.price ?? null, product.original_name ?? null]);
        await connection.execute(
          `INSERT INTO product_retailers (product_id, retailer_id, price, original_name)
           VALUES (?, ?, ?, ?)`,
          [productId, retailerId, product.price ?? null, product.original_name ?? null]
        );
        console.log(` Linked ${normalizedName} to ${profile.name}`);
      }
    }

    await connection.commit();
    console.log(`Finished: ${profile.name}`);
  } catch (error) {
    await connection.rollback();
    console.error(`Error with ${profile.name}:`, error);
  } finally {
    connection.release();
  }
}

// Function to run all profiles
async function runAllProfiles() {
  for (const profile of profiles) {
    await testAndSave(profile);
  }
}

// Schedule the scraper to run at 8am and 5pm every day
schedule.scheduleJob('0 8 * * *', runAllProfiles); 
schedule.scheduleJob('0 17 * * *', runAllProfiles);

// If run directly, execute once and exit
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  (async () => {
    await runAllProfiles();
    process.exit(0);
  })();
}
