import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'power123',
  database: 'priceparrot'
});

const supermarkets = [
    {
    name: 'Loshusan Supermarket',
    addresses: [
      '29 E Kings House Rd, Kingston'
    ],
    rating: '4.3',
    reviewCount: 2000,
    type: 'Supermarket'
  },
  {
    name: 'S Foods Supermarket',
    addresses: [
      '14-16 Worthington Ave, Kingston'
    ],
    rating: '4.3',
    reviewCount: 268,
    type: 'Supermarket'
  },
  {
    name: 'General Foods Supermarket',
    addresses: [
      '134 Old Hope Road, Kingston 6',
      'Shop 53, Ocho Rios, St. Ann',
      'Ocean Village Shopping Centre'
    ]
  },
  {
    name: 'Sovereign Supermarket',
    addresses: [
      '106 Hope Road, Kingston 6',
      '1 Barbican Road, Kingston 6'
    ]
  }
];

async function assignRandomProductsToSupermarkets() {
  const connection = await pool.getConnection();
  try {
    for (const market of supermarkets) {
      let retailerId;
      const [retailerRow] = await connection.execute(
        `SELECT id FROM retailers WHERE name = ?`,
        [market.name]
      );
      
      if (retailerRow.length > 0) {
        retailerId = retailerRow[0].id;
      } else {
        const [insertResult] = await connection.execute(
          `INSERT INTO retailers (name) VALUES (?)`,
          [market.name]
        );
        retailerId = insertResult.insertId;
      }

      // Insert addresses
      for (const address of market.addresses) {
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

      // Get random products that aren't already assigned to this retailer
      const [products] = await connection.execute(
        `SELECT p.id, pr.price 
         FROM products p
         JOIN product_retailers pr ON p.id = pr.product_id
         WHERE p.id NOT IN (
           SELECT product_id FROM product_retailers WHERE retailer_id = ?
         )
         ORDER BY RAND() LIMIT 300`,
        [retailerId]
      );

      for (const product of products) {
        const priceMultiplier = 1 + (Math.random() * 0.2 - 0.1);
        const newPrice = product.price ? (parseFloat(product.price) * priceMultiplier).toFixed(2) 
                                     : (10 + Math.random() * 20).toFixed(2);
        
        // Use INSERT IGNORE to skip duplicates or check first
        try {
          await connection.execute(
            `INSERT INTO product_retailers (product_id, retailer_id, price) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE price = VALUES(price)`,
            [product.id, retailerId, newPrice]
          );
        } catch (error) {
          console.log(`Product ${product.id} already exists for ${market.name}, updating price instead`);
          await connection.execute(
            `UPDATE product_retailers SET price = ? 
             WHERE product_id = ? AND retailer_id = ?`,
            [newPrice, product.id, retailerId]
          );
        }
      }
    }
    console.log('Random products assigned to supermarkets.');
  } catch (error) {
    console.error('Error in assignRandomProductsToSupermarkets:', error);
    throw error;
  } finally {
    connection.release();
  }
}

assignRandomProductsToSupermarkets();                