
import CoolMarket from '../../public/Product_Images/cool_market.jpg';
import HiloLogo from '../../public/Product_Images/hilo-logo.png';
import PriceSmartLogo from '../../public/Product_Images/pricesmart-logo.png';
import SLogo from '../../public/Product_Images/s-logo.png';

export const retailerLogoMap = {
  'CoolMarket': CoolMarket,
  'Hilo': HiloLogo,
  'PriceSmart': PriceSmartLogo,
  'S': SLogo,
};

export function getRetailerLogo(name) {
  return retailerLogoMap[name] || null;
}
