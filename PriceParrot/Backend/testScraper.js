import { scrapeProducts, normalizeProductName } from './utils/extract_products.js';
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'power123',
  database: 'priceparrot'
});

const retailerProfiles = [
  {
    name: 'HiLo',
    addresses: [
      'Mannor Park, Kingston 8',
      '87 ¾ Barbican Road, Kingston 8',
      'Pavillion, 13 Constant Spring Road, Kingston 10',
      'Head Office, 13 Old Hope Road, Cross Roads, Kingston 5',
      'UWI Mona, Kingston 7',
      '121 Old Hope Road, Kingston 6'
    ],
    categoryId: 6
  },
  {
    name: 'PriceSmart',
    addresses: [
      'Red Hills Road, Kingston',
    ],
    categoryId: 7
  },
  {
    name: 'CoolMarket',
    addresses: [
      'Kingston, Jamaica',
     
    ],
    categoryId: 8 
  }
];

function copyImageToPublicFolder(imagePath) {
  if (!imagePath) return null;
  const fileName = imagePath.split(/[\\/]/).pop();
  const srcPath = path.resolve(imagePath);
  const destDir = path.resolve('./public/Product_Images');
  const destPath = path.join(destDir, fileName);
  try {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      return `/Product_Images/${fileName}`;
    }
  } catch (e) {
    console.error('Failed to copy image:', srcPath, e);
  }
  return null;
}

function copyHiloImageToPublicFolder(imagePath) {
  if (!imagePath) return null;
  // Only handle local HiLo images
  if (!imagePath.includes('Hi Lo Food Stores_files')) return imagePath;
  const fileName = imagePath.split(/[\\/]/).pop();
  const srcPath = path.resolve(imagePath);
  const destDir = path.resolve('./public/Product_Images');
  const destPath = path.join(destDir, fileName);
  try {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      return `/Product_Images/${fileName}`;
    }
  } catch (e) {
    console.error('Failed to copy HiLo image:', srcPath, e);
  }
  return imagePath;
}

async function testAndSave() {
  try {
    const connection = await pool.getConnection();

    try {
      for (const profile of retailerProfiles) {
        console.log(`Scraping products for retailer: ${profile.name}`);
        let page = 1;

        while (true) {
          let pageUrl;

          if (profile.name === 'PriceSmart') {
            pageUrl = profile.url.replace(/page=\d+/, `page=${page}`);
          } else if (profile.name === 'HiLo') {
            pageUrl = profile.url; 
          } else if (profile.name === 'CoolMarket') {
            pageUrl = profile.url.replace(/p=\d+/, `p=${page}`);
          }

          console.log(`Scraping page ${page} for retailer: ${profile.name}`);

          try {
            let products;
            products = await scrapeProducts(pageUrl);
            if (profile.name === 'HiLo') {
              if (!products || products.length === 0) {
                console.log(`No products found for HiLo.`);
                break;
              }
            } else {
              if (!products || products.length === 0) {
                console.log(`No products found on page ${page}. Moving to the next page.`);
                page++;
                break;
              }
            }

            let retailerId;
            const [retailerRow] = await connection.execute(
              `SELECT id FROM retailers WHERE name = ?`,
              [profile.name]
            );
            if (retailerRow.length > 0) {
              retailerId = retailerRow[0].id;
            } else {
              const [insertResult] = await connection.execute(
                `INSERT INTO retailers (name, website_url) VALUES (?, ?)`,
                [profile.name, profile.url]
              );
              retailerId = insertResult.insertId;
            }

            // Insert addresses for retailer (if any)
            if (profile.addresses && profile.addresses.length > 0) {
              for (const address of profile.addresses) {
                // Check if address already exists for this retailer
                const [addressRows] = await connection.execute(
                  `SELECT id FROM retailer_addresses WHERE retailer_id = ? AND address = ?`,
                  [retailerId, address]
                );
                if (addressRows.length === 0) {
                  await connection.execute(
                    `INSERT INTO retailer_addresses (retailer_id, address) VALUES (?, ?)`,
                    [retailerId, address]
                  );
                }
              }
            }

            for (const product of products) {
              const normalizedName = normalizeProductName(product.name);

              // Check if product exists 
              const [productRows] = await connection.execute(
                `SELECT id FROM products WHERE name = ?`,
                [normalizedName]
              );

              let productId;

              if (productRows.length > 0) {
                productId = productRows[0].id;
              } else {
                const [insertResult] = await connection.execute(
                  `INSERT INTO products (name, category_id, image_url, viewcount, created_at, updated_at)
                   VALUES (?, ?, ?, 0, NOW(), NOW())`,
                  [normalizedName, profile.categoryId, product.image_url]
                );
                productId = insertResult.insertId;
                console.log(`Inserted new product: ${normalizedName}`);
              }

              const [retailerProductRows] = await connection.execute(
                `SELECT id, price FROM product_retailers 
                 WHERE product_id = ? AND retailer_id = ?`,
                [productId, retailerId]
              );

              if (retailerProductRows.length > 0) {
                const current = retailerProductRows[0];
                if (parseFloat(current.price) !== parseFloat(product.price)) {
                  await connection.execute(
                    `UPDATE product_retailers
                     SET price = ?, updated_at = NOW()
                     WHERE id = ?`,
                    [product.price, current.id]
                  );

                  // Insert price change into price_history
                  await connection.execute(
                    `INSERT INTO price_history (product_id, old_price, new_price, changed_at)
                     VALUES (?, ?, ?, NOW())`,
                    [productId, current.price, product.price]
                  );
                }
              } else {
                // New entry in product_retailers
                await connection.execute(
                  `INSERT INTO product_retailers (product_id, retailer_id, price)
                   VALUES (?, ?, ?)`,
                  [productId, retailerId, product.price ]
                );
                console.log(`Linked new retailer product: ${normalizedName}`);
              }

              if (profile.name === 'HiLo' && product.image_url) {
                const newImageUrl = copyHiloImageToPublicFolder(product.image_url);
                if (newImageUrl) product.image_url = newImageUrl;
              } else {
                const newImageUrl = copyImageToPublicFolder(product.image_url);
                if (newImageUrl) product.image_url = newImageUrl;
              }
            }

            if (profile.name === 'PriceSmart') {
              page++;
            } else {
              break;
            }
          } catch (error) {
            if (error.response && error.response.status === 404) {
              console.log(`Reached 404 on page ${page}. Stopping.`);
              break;
            } else {
              console.error(`Error scraping page ${page}:`, error);
              throw error; 
            }
          }
        }
      }
    } finally {
      connection.release();
    }

    console.log('Successfully saved products for all retailers.');
  } catch (error) {
    console.error('Error somewhere during scraping and saving:', error);
  }
}

testAndSave();
