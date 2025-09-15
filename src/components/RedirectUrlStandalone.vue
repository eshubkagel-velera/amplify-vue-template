<template>
  <div class="redirect-url-standalone">
    <h2>Redirect URL Manager</h2>
    
    <!-- Product Selection (only show when no productId prop) -->
    <div v-if="!props.productId" class="bordered-section">
      <label for="productFilter">Select Product:</label>
      <select id="productFilter" v-model="selectedProductId" @change="onProductChange">
        <option value="">-- Select a Product --</option>
        <option v-for="product in products" :key="product.ORIGIN_PRODUCT_ID" :value="product.ORIGIN_PRODUCT_ID">
          {{ product.ORIGIN_PRODUCT_ID }}: {{ product.VENDOR_NAME }} - {{ product.PRODUCT_DESC }}
        </option>
      </select>
    </div>
    
    <!-- Product Info (show when product is selected or productId prop is provided) -->
    <div v-if="selectedProduct && props.productId" class="info-box">
      <h3>Product Information</h3>
      <p><strong>Product ID:</strong> {{ selectedProduct.PRODUCT_ID }}</p>
      <p><strong>PSCU Client ID:</strong> {{ selectedProduct.PSCU_CLIENT_ID }}</p>
      <p><strong>Partner Code:</strong> {{ selectedProduct.PARTNER_CODE }}</p>
      <p><strong>Description:</strong> {{ selectedProduct.PRODUCT_DESC }}</p>
      <p><strong>Vendor:</strong> {{ selectedProduct.VENDOR_NAME }}</p>
    </div>
    
    <!-- Action Buttons -->
    <div v-if="selectedProductId || props.productId" class="bordered-section">
      <div class="action-buttons">
        <button @click="loadRedirectUrls" class="btn-primary">Refresh</button>
        <button @click="showCreateModal = true" class="btn-success" :disabled="props.readonly">{{ props.readonly ? 'View Only Mode' : 'Add New Redirect URL' }}</button>
        <button @click="confirmBulkDelete" :disabled="selectedUrls.length === 0 || props.readonly" class="btn-danger">Delete Selected ({{ selectedUrls.length }})</button>
        <button v-if="props.productId" @click="goBack" class="btn-secondary">Back to Products</button>
        <span class="record-count">{{ redirectUrls.length }} redirect URLs</span>
      </div>
    </div>
    
    <!-- Redirect URLs List -->
    <div v-if="selectedProductId || props.productId" class="table-section">
      <div v-if="redirectUrls.length > 0" class="table-container">
        <table class="url-table">
          <thead>
            <tr>
              <th class="w-12">
                <input type="checkbox" @change="toggleSelectAll" :checked="allSelected" />
              </th>
              <th class="resizable sortable" data-field="URL_TYPE_CODE" @click="sortBy('URL_TYPE_CODE')">
                URL Type Code
                <span v-if="sortField === 'URL_TYPE_CODE'" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
                <div class="resize-handle" @mousedown="startResize($event, 'URL_TYPE_CODE')"></div>
              </th>
              <th class="resizable sortable" data-field="URL" @click="sortBy('URL')">
                URL
                <span v-if="sortField === 'URL'" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
                <div class="resize-handle" @mousedown="startResize($event, 'URL')"></div>
              </th>
              <th class="resizable sortable" data-field="RESPONSE_TEXT" @click="sortBy('RESPONSE_TEXT')">
                Response Text
                <span v-if="sortField === 'RESPONSE_TEXT'" class="sort-indicator">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
                <div class="resize-handle" @mousedown="startResize($event, 'RESPONSE_TEXT')"></div>
              </th>
              <th class="resizable" data-field="CREATED_DATE">
                Created Date
                <div class="resize-handle" @mousedown="startResize($event, 'CREATED_DATE')"></div>
              </th>
              <th class="resizable" data-field="CREATED_BY_USER_ID">
                Created By User ID
                <div class="resize-handle" @mousedown="startResize($event, 'CREATED_BY_USER_ID')"></div>
              </th>
              <th class="resizable" data-field="CHANGED_DATE">
                Changed Date
                <div class="resize-handle" @mousedown="startResize($event, 'CHANGED_DATE')"></div>
              </th>
              <th class="resizable" data-field="CHANGED_BY_USER_ID">
                Changed By User ID
                <div class="resize-handle" @mousedown="startResize($event, 'CHANGED_BY_USER_ID')"></div>
              </th>
              <th>Actions</th>
            </tr>
            <tr class="filter-row">
              <th></th>
              <th>
                <input v-model="filters.URL_TYPE_CODE" @input="applyFilters" placeholder="Filter type" class="filter-input" />
              </th>
              <th>
                <input v-model="filters.URL" @input="applyFilters" placeholder="Filter URL" class="filter-input" />
              </th>
              <th>
                <input v-model="filters.RESPONSE_TEXT" @input="applyFilters" placeholder="Filter response" class="filter-input" />
              </th>
              <th></th>
              <th>
                <input v-model="filters.CREATED_BY_USER_ID" @input="applyFilters" placeholder="Filter user" class="filter-input" />
              </th>
              <th></th>
              <th>
                <input v-model="filters.CHANGED_BY_USER_ID" @input="applyFilters" placeholder="Filter user" class="filter-input" />
              </th>
              <th>
                <button @click="clearFilters" class="clear-filters-btn">Clear</button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="url in filteredUrls" :key="url.REDIRECT_URL_ID">
              <td class="text-center">
                <input type="checkbox" :value="url.REDIRECT_URL_ID" v-model="selectedUrls" />
              </td>
              <td><span class="read-only-text">{{ url.URL_TYPE_CODE === 'E' ? 'Existing Users' : url.URL_TYPE_CODE === 'N' ? 'New Users' : url.URL_TYPE_CODE }}</span></td>
              <td><span class="read-only-text">{{ url.URL }}</span></td>
              <td><span class="read-only-text">{{ url.RESPONSE_TEXT }}</span></td>
              <td><span class="read-only-text">{{ formatDate(url.CREATED_DATE) }}</span></td>
              <td><span class="read-only-text">{{ url.CREATED_BY_USER_ID }}</span></td>
              <td><span class="read-only-text">{{ formatDate(url.CHANGED_DATE) }}</span></td>
              <td><span class="read-only-text">{{ url.CHANGED_BY_USER_ID }}</span></td>
              <td>
                <button @click="editUrl(url)">{{ props.readonly ? 'View' : 'Edit' }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else-if="selectedProductId">No redirect URLs found for this product.</p>
    </div>
    
    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Create Redirect URL</h3>
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label for="URL_TYPE_CODE">URL Type Code</label>
            <select id="URL_TYPE_CODE" v-model="formData.URL_TYPE_CODE" required>
              <option value="">-- Select Type --</option>
              <option value="E">Existing Users</option>
              <option value="N">New Users</option>
            </select>
          </div>
          <div class="form-group">
            <label for="URL">URL</label>
            <input id="URL" v-model="formData.URL" type="text" required />
          </div>
          <div class="form-group">
            <label for="RESPONSE_TEXT">Response Text</label>
            <input id="RESPONSE_TEXT" v-model="formData.RESPONSE_TEXT" type="text" />
          </div>
          <div class="form-group">
            <label for="CREATED_DATE">Created Date</label>
            <input id="CREATED_DATE" v-model="formData.CREATED_DATE" type="date" disabled />
          </div>
          <div class="form-group">
            <label for="CREATED_BY_USER_ID">Created By User ID</label>
            <input id="CREATED_BY_USER_ID" v-model="formData.CREATED_BY_USER_ID" type="number" required />
          </div>
          <div class="form-actions">
            <button type="submit">Create</button>
            <button type="button" @click="cancelForm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Edit Redirect URL</h3>
        <form @submit.prevent="submitForm">
          <div class="form-group">
            <label for="URL_TYPE_CODE">URL Type Code</label>
            <select id="URL_TYPE_CODE" v-model="formData.URL_TYPE_CODE" required>
              <option value="">-- Select Type --</option>
              <option value="E">Existing Users</option>
              <option value="N">New Users</option>
            </select>
          </div>
          <div class="form-group">
            <label for="URL">URL</label>
            <input id="URL" v-model="formData.URL" type="text" required />
          </div>
          <div class="form-group">
            <label for="RESPONSE_TEXT">Response Text</label>
            <input id="RESPONSE_TEXT" v-model="formData.RESPONSE_TEXT" type="text" />
          </div>
          <div class="form-group">
            <label for="CHANGED_DATE">Changed Date</label>
            <input id="CHANGED_DATE" v-model="formData.CHANGED_DATE" type="date" disabled />
          </div>
          <div class="form-group">
            <label for="CHANGED_BY_USER_ID">Changed By User ID</label>
            <input id="CHANGED_BY_USER_ID" v-model="formData.CHANGED_BY_USER_ID" type="number" />
          </div>
          <div class="form-actions">
            <button type="submit" :disabled="props.readonly">{{ props.readonly ? 'View Only' : 'Update' }}</button>
            <button type="button" @click="cancelForm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete {{ selectedUrls.length }} redirect URL(s)?</p>
        <div class="form-actions">
          <button @click="deleteBulkUrls" class="btn-danger">Yes, Delete</button>
          <button @click="showDeleteModal = false">Cancel</button>
        </div>
      </div>
    </div>
    
    <!-- Error Modal -->
    <div v-if="showErrorModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Error</h3>
        <p>{{ errorMessage }}</p>
        <div class="form-actions">
          <button @click="clearError" class="btn-primary">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import '../styles/shared.css';
import { ref, onMounted, watch } from 'vue';
import { generateClient } from 'aws-amplify/api';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';
import { useErrorHandler } from '../composables/useErrorHandler';
import { useTableOperations } from '../composables/useTableOperations';
import type { OriginProduct, RedirectUrl } from '../types';

const props = defineProps({
  productId: {
    type: Number,
    required: false,
    default: null
  },
  readonly: {
    type: Boolean,
    default: false
  }
});



// Reactive data
const products = ref([]);
const selectedProductId = ref('');
const selectedProduct = ref(null);
const redirectUrls = ref([]);
const filteredUrls = ref([]);
const selectedUrls = ref([]);
const allSelected = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const { error: errorMessage, showErrorModal, handleError, clearError } = useErrorHandler();
const formData = ref<Partial<RedirectUrl>>({});
const filters = ref({
  URL_TYPE_CODE: '',
  URL: '',
  RESPONSE_TEXT: '',
  CREATED_BY_USER_ID: '',
  CHANGED_BY_USER_ID: ''
});
const sortField = ref('');
const sortDirection = ref('asc');
const isResizing = ref(false);
const resizeData = ref({ field: '', startX: 0, startWidth: 0 });

// Methods
const formatDate = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return dateValue;
  return date.toISOString().split('T')[0];
};

const loadProducts = async () => {
  try {
    const result = await generateClient().graphql({ query: queries.listOriginProducts });
    products.value = result.data.listOrigin_products.items;
  } catch (error) {
    showError('Failed to load products');
  }
};

const onProductChange = () => {
  if (selectedProductId.value) {
    selectedProduct.value = products.value.find(p => p.ORIGIN_PRODUCT_ID === parseInt(selectedProductId.value));
    loadRedirectUrls();
  } else {
    selectedProduct.value = null;
    redirectUrls.value = [];
    filteredUrls.value = [];
  }
};

const loadRedirectUrls = async () => {
  const productId = props.productId || parseInt(selectedProductId.value);
  if (!productId) return;
  
  try {
    const result = await generateClient().graphql({ query: queries.listRedirectUrls });
    const productUrls = result.data.listRedirect_urls.items.filter(
      url => url.ORIGIN_PRODUCT_ID === productId
    );
    redirectUrls.value = productUrls;
    applyFilters();
  } catch (error) {
    showError('Failed to load redirect URLs');
  }
};

const editUrl = (url) => {
  const formattedUrl = { ...url };
  Object.keys(formattedUrl).forEach(key => {
    if (key.includes('DATE') && formattedUrl[key]) {
      formattedUrl[key] = formatDate(formattedUrl[key]);
    }
  });
  const today = new Date().toISOString().split('T')[0];
  formattedUrl.CHANGED_DATE = today;
  formData.value = formattedUrl;
  showEditModal.value = true;
};

const submitForm = async () => {
  if (props.readonly) return;
  try {
    const today = new Date().toISOString().split('T')[0];
    let cleanedFormData = { ...formData.value };
    
    if (showEditModal.value) {
      const updateData = {
        REDIRECT_URL_ID: cleanedFormData.REDIRECT_URL_ID,
        ORIGIN_PRODUCT_ID: cleanedFormData.ORIGIN_PRODUCT_ID,
        URL_TYPE_CODE: cleanedFormData.URL_TYPE_CODE,
        URL: cleanedFormData.URL,
        RESPONSE_TEXT: cleanedFormData.RESPONSE_TEXT,
        CHANGED_BY_USER_ID: cleanedFormData.CHANGED_BY_USER_ID,
        CHANGED_DATE: today
      };
      await generateClient().graphql({
        query: mutations.updateRedirectUrl,
        variables: { input: updateData }
      });
    } else {
      cleanedFormData.ORIGIN_PRODUCT_ID = props.productId || parseInt(selectedProductId.value);
      cleanedFormData.CREATED_DATE = today;
      await generateClient().graphql({
        query: mutations.createRedirectUrl,
        variables: { input: cleanedFormData }
      });
    }
    
    cancelForm();
    await loadRedirectUrls();
  } catch (error) {
    showError('Failed to save redirect URL');
  }
};

const cancelForm = () => {
  formData.value = {};
  showCreateModal.value = false;
  showEditModal.value = false;
};

const confirmBulkDelete = () => {
  if (selectedUrls.value.length > 0) {
    showDeleteModal.value = true;
  }
};

const deleteBulkUrls = async () => {
  try {
    for (const urlId of selectedUrls.value) {
      await generateClient().graphql({
        query: mutations.deleteRedirectUrl,
        variables: { input: { REDIRECT_URL_ID: urlId } }
      });
    }
    
    showDeleteModal.value = false;
    selectedUrls.value = [];
    allSelected.value = false;
    await loadRedirectUrls();
  } catch (error) {
    showError('Failed to delete redirect URLs');
  }
};

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedUrls.value = [];
  } else {
    selectedUrls.value = filteredUrls.value.map(url => url.REDIRECT_URL_ID);
  }
  allSelected.value = !allSelected.value;
};

const applyFilters = () => {
  let filtered = redirectUrls.value.filter(url => {
    return (!filters.value.URL_TYPE_CODE || (url.URL_TYPE_CODE === 'E' ? 'Existing Users' : url.URL_TYPE_CODE === 'N' ? 'New Users' : url.URL_TYPE_CODE).toLowerCase().includes(filters.value.URL_TYPE_CODE.toLowerCase())) &&
           (!filters.value.URL || url.URL.toLowerCase().includes(filters.value.URL.toLowerCase())) &&
           (!filters.value.RESPONSE_TEXT || (url.RESPONSE_TEXT || '').toLowerCase().includes(filters.value.RESPONSE_TEXT.toLowerCase())) &&
           (!filters.value.CREATED_BY_USER_ID || String(url.CREATED_BY_USER_ID || '').includes(filters.value.CREATED_BY_USER_ID)) &&
           (!filters.value.CHANGED_BY_USER_ID || String(url.CHANGED_BY_USER_ID || '').includes(filters.value.CHANGED_BY_USER_ID));
  });
  
  if (sortField.value) {
    filtered.sort((a, b) => {
      const aVal = String(a[sortField.value] || '').toLowerCase();
      const bVal = String(b[sortField.value] || '').toLowerCase();
      const comparison = aVal.localeCompare(bVal);
      return sortDirection.value === 'asc' ? comparison : -comparison;
    });
  }
  
  filteredUrls.value = filtered;
};

const clearFilters = () => {
  filters.value = {
    URL_TYPE_CODE: '',
    URL: '',
    RESPONSE_TEXT: '',
    CREATED_BY_USER_ID: '',
    CHANGED_BY_USER_ID: ''
  };
  applyFilters();
};

const sortBy = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDirection.value = 'asc';
  }
  applyFilters();
};

const startResize = (event, field) => {
  isResizing.value = true;
  resizeData.value.field = field;
  resizeData.value.startX = event.clientX;
  const th = event.target.parentElement;
  resizeData.value.startWidth = th.offsetWidth;
  
  document.addEventListener('mousemove', doResize);
  document.addEventListener('mouseup', stopResize);
  event.preventDefault();
};

const doResize = (event) => {
  if (!isResizing.value) return;
  const diff = event.clientX - resizeData.value.startX;
  const newWidth = Math.max(50, resizeData.value.startWidth + diff);
  const th = document.querySelector(`th[data-field="${resizeData.value.field}"]`);
  if (th) {
    th.style.width = newWidth + 'px';
  }
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', doResize);
  document.removeEventListener('mouseup', stopResize);
};

const showError = (message: string) => handleError({ message }, 'redirect URL operation');

// Watch for create modal to set current date
watch(showCreateModal, (newVal) => {
  if (newVal) {
    const today = new Date().toISOString().split('T')[0];
    formData.value = {
      ...formData.value,
      CREATED_DATE: today
    };
  }
});

const goBack = () => {
  window.dispatchEvent(new CustomEvent('goBackToProducts'));
};

onMounted(async () => {
  await loadProducts();
  
  // If productId prop is provided, set up product info and load URLs immediately
  if (props.productId) {
    selectedProductId.value = props.productId.toString();
    selectedProduct.value = products.value.find(p => p.ORIGIN_PRODUCT_ID === props.productId);
    await loadRedirectUrls();
  }
});
</script>

<style scoped>
.redirect-url-standalone {
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow: auto;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.product-selection {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  width: fit-content;
  background-color: var(--bg-color);
}

.product-selection label {
  display: inline-block;
  margin-right: 10px;
  font-weight: bold;
}

.product-selection select {
  padding: 8px;
  min-width: 400px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--input-bg);
  color: var(--text-color);
}

.product-info {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  background-color: var(--bg-color);
}

.action-buttons button {
  margin-right: 10px;
  padding: 8px 12px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.record-count {
  margin-left: 15px;
  font-weight: bold;
  color: #666;
}

.url-list {
  margin-bottom: 20px;
}

.url-list {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  background-color: var(--bg-color);
}

.table-container {
  max-height: 600px;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--bg-color);
}

.url-table {
  width: 100%;
  border-collapse: collapse;
}

.url-table th,
.url-table td {
  border: 1px solid var(--border-color);
  padding: 8px;
  text-align: left;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.url-table th {
  background-color: var(--table-header-bg);
  position: sticky;
  top: 0;
  z-index: 10;
  height: 45px;
  vertical-align: middle;
}

.filter-row th {
  background-color: var(--table-filter-bg);
  padding: 4px;
  position: sticky;
  top: 45px;
  z-index: 10;
  height: 35px;
}

.w-12 {
  width: 3%;
}

.text-center {
  text-align: center;
}

.read-only-text {
  display: block;
  width: 100%;
  padding: 4px;
  word-wrap: break-word;
  white-space: normal;
  line-height: 1.4;
}

.resizable {
  position: relative;
  user-select: none;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 5px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
}

.resize-handle:hover {
  background: #007bff;
}

.sortable {
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: var(--table-filter-bg);
}

.sort-indicator {
  margin-left: 5px;
  font-weight: bold;
}

.filter-input {
  width: 100%;
  padding: 4px;
  font-size: 12px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  background-color: var(--input-bg);
  color: var(--text-color);
}

.clear-filters-btn {
  padding: 4px 8px;
  font-size: 12px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.clear-filters-btn:hover {
  background-color: #5a6268;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--modal-bg);
  color: var(--text-color);
  padding: 30px;
  border-radius: 8px;
  min-width: 400px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-sizing: border-box;
  background-color: var(--input-bg);
  color: var(--text-color);
}

.form-actions {
  margin-top: 20px;
  text-align: center;
}

.form-actions button {
  margin: 0 10px;
  padding: 10px 20px;
  cursor: pointer;
  border: none;
  border-radius: 4px;
}
</style>
