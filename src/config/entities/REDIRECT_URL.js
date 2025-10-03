export default {
  name: 'REDIRECT_URL',
  idField: 'REDIRECT_URL_ID',
  
  // Data loading configuration
  loadProductOptions: true,
  
  // Filtering configuration
  hasFilters: true,
  filterType: 'product',
  autoFillFromFilter: {
    filterField: 'selectedProductFilter',
    formField: 'ORIGIN_PRODUCT_ID'
  }
};