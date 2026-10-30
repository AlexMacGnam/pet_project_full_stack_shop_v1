import { CURRENCY_VND } from "../constants.js";

export function formatPrice(price) {
  return `${price.toLocaleString()} ${CURRENCY_VND.toUpperCase()}`;
}
