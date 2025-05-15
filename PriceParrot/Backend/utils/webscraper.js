const puppeteer = require('puppeteer');
import axios from 'axios';
import { load } from 'cheerio';
import fs from 'fs';

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
 * Extracts product data from HTML element
 */
const extractProductData = ($, element) => {
  console.log($(element).html())
  const name = $(element).find(
    'h2.woocommerce-loop-product__title, .product-item-name, .product-name, .name, h2, h3, .product-card__title, .info-wrapper__product-info .product-card__title'
  ).first().text().trim();

  const priceText = $(element).find(
    '.price ins, .amount, .price, .woocommerce-Price-amount, .product-price, .amount, .sf-price__regular, .info-wrapper__product-info .sf-price__regular'
  ).first().text().trim();

  console.log('Raw price text:', priceText);



  const cleanedPriceText = priceText.replace(/[^\d.,]/g, '');

  // Remove commas, then parse float
  var price = parseFloat(cleanedPriceText.replace(/,/g, ''));


  console.log('Extracted price:', price);
  let currentPrice = null;
  const match = priceText.match(/current price (is|was):?\s*\$?(\d+(\.\d{1,2})?)/i);
  if (match) {
    
    currentPrice = parseFloat(match[2]);
    console.log('WeirdoAlert:', currentPrice);
    price = currentPrice;
  }

  const image_url = $(element).find('img').first().attr('src');
  const product_url = $(element).find('a').first().attr('href');
  console.log('Extracted product data:', { name, price, image_url, product_url });

  return {
    name,
    price,
    image_url,
    product_url
  };
}

/**
 * Main scraping function - now only returns products without category handling
 */
export const scrapeProducts = async (url) => {
  try {
    console.log(`Scraping products from: ${url}`);

    // Fetch page content
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      timeout: 15000
    });

    const $ = load(data);
    const productElements = $('.product-item, .product, .item, .info-wrapper__product-info');
    console.log('=== BODY SECTION ===');
    
    console.log($('body').html());
    console.log(`Found ${productElements.length} product elements`);
    

    const products = [];
    const seenUrls = new Set(); 

    for (let i = 0; i < productElements.length; i++) {
      const element = productElements.eq(i);
      const product = extractProductData($, element);

      if (product.name && product.product_url && !seenUrls.has(product.product_url)) {
        

        product.name = normalizeProductName(product.name);

        products.push(product);
        seenUrls.add(product.product_url); 
        console.log(`Found product: ${product.name}`);
      }
    }

    console.log(`Scraping completed. Found ${products.length} valid products`);
    return products;

  } catch (error) {
    console.error('Scraping failed:', error);
    throw error;
  }
};
