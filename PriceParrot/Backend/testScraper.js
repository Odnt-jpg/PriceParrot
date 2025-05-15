import { scrapeProducts, normalizeProductName } from './utils/webscraper.js';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'power123',
  database: 'priceparrot'
});

const retailerProfiles = [
  // {
  //   name: 'HiLo',
  //   url: 'https://hilofoodstoresja.com/hi-lo-products/page/?',
  //   categoryId: 6
  // },
  {
    name: 'PriceSmart',
    url: 'https://www.pricesmart.com/en-jm/category/Groceries/G10D03?page=?',
    categoryId: 7
  }
];

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
            pageUrl = profile.url.replace(/page\/\d+/, `page/${page}`);
          }

          console.log(`Scraping page ${page} for retailer: ${profile.name}`);

          try {
            const products = await scrapeProducts(pageUrl); 

            if (!products || products.length === 0) {
              console.log(`No products found on page ${page}. Moving to the next page.`);
              page++; 
              break; 
              // continue; 
            }

            // Insert or fetch retailer
            await connection.execute(
              `INSERT INTO retailers (name, website_url) VALUES (?, ?) 
               ON DUPLICATE KEY UPDATE name = VALUES(name)`,
              [profile.name, profile.url]
            );

            const [retailerRow] = await connection.execute(
              `SELECT id FROM retailers WHERE name = ?`,
              [profile.name]
            );
            const retailerId = retailerRow[0].id;

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
            }

            page++;
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
      connection.release(); // Ensure connection is released properly
    }

    console.log('Successfully saved products for all retailers.');
  } catch (error) {
    console.error('Error somewhere during scraping and saving:', error);
  }
}

testAndSave();
