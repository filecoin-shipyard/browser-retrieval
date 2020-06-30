function formatPrice(price) {
  return price.toLocaleString(navigator.language, { maximumFractionDigits: 10 });
}
