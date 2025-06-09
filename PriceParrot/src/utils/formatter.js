export function formatProductName(name) {
  if (!name) return '';
  
  // Convert to lowercase and capitalize first letter of each word
  let formatted = name.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Handle weight/quantity formatting (e.g., "22 Lbs" → "22lbs")
  formatted = formatted.replace(/(\d+)\s(lbs?|kg|g|oz|ml|l)\b/gi, '$1$2');

  // Remove extra spaces
  formatted = formatted.replace(/\s+/g, ' ').trim();

  // Special case handling for common terms
  formatted = formatted
    .replace(/\bBdf\b/gi, 'Best Dressed')
    .replace(/\bFrozen\b/gi, '')
    .replace(/\bChilled\b/gi, '')
    .replace(/\bTray Pack\b/gi, '');

  return formatted;
}