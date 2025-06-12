<template>
  <div class="entity-manager">
    <h2>{{ entityName }} Manager</h2>
    
    <!-- Entity List -->
    <div class="entity-list">
      <button @click="loadEntities">Refresh</button>
      <button @click="showCreateForm = true">Add New</button>
      
      <table v-if="entities.length > 0">
        <thead>
          <tr>
            <th v-for="field in fields" :key="field">{{ field }}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entity in entities" :key="getEntityId(entity)">
            <td v-for="field in fields" :key="field">{{ entity[field] }}</td>
            <td>
              <button @click="editEntity(entity)">Edit</button>
              <button @click="confirmDelete(entity)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>No {{ entityName }} records found.</p>
    </div>
    
    <!-- Create/Edit Form -->
    <div v-if="showCreateForm || showEditForm" class="entity-form">
      <h3>{{ showEditForm ? 'Edit' : 'Create' }} {{ entityName }}</h3>
      <form @submit.prevent="submitForm">
        <div v-for="field in formFields" :key="field.name" class="form-group">
          <label :for="field.name">{{ field.name }}</label>
          <input 
            :id="field.name" 
            v-model="formData[field.name]" 
            :type="field.type" 
            :required="field.required"
            :disabled="field.disabled"
          />
        </div>
        <div class="form-actions">
          <button type="submit">{{ showEditForm ? 'Update' : 'Create' }}</button>
          <button type="button" @click="cancelForm">Cancel</button>
        </div>
      </form>
    </div>
    
    <!-- Delete Confirmation -->
    <div v-if="showDeleteConfirm" class="delete-confirm">
      <p>Are you sure you want to delete this {{ entityName }}?</p>
      <button @click="deleteEntity">Yes, Delete</button>
      <button @click="showDeleteConfirm = false">Cancel</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps, watch } from 'vue';

const props = defineProps({
  entityName: {
    type: String,
    required: true
  },
  fields: {
    type: Array,
    required: true
  },
  formFields: {
    type: Array,
    required: true
  },
  idField: {
    type: String,
    required: true
  },
  loadFunction: {
    type: Function,
    required: true
  },
  createFunction: {
    type: Function,
    required: true
  },
  updateFunction: {
    type: Function,
    required: true
  },
  deleteFunction: {
    type: Function,
    required: true
  }
});

const entities = ref([]);
const formData = ref({});
const showCreateForm = ref(false);
const showEditForm = ref(false);
const showDeleteConfirm = ref(false);
const entityToDelete = ref(null);

const getEntityId = (entity) => {
  return entity[props.idField];
};

const loadEntities = async () => {
  try {
    const response = await props.loadFunction();
    const listName = `list${props.entityName}S`;
    
    if (response.data && response.data[listName] && response.data[listName].items) {
      entities.value = response.data[listName].items;
    } else {
      entities.value = [];
    }
  } catch (error) {
    console.error(`Error loading ${props.entityName}:`, error);
    if (error.errors) {
      error.errors.forEach((err: any) => console.error('GraphQL Error:', err.message));
    }
    entities.value = [];
  }
};

const editEntity = (entity) => {
  formData.value = { ...entity };
  showEditForm.value = true;
  showCreateForm.value = false;
};

const confirmDelete = (entity) => {
  entityToDelete.value = entity;
  showDeleteConfirm.value = true;
};

const deleteEntity = async () => {
  try {
    const input = { [props.idField]: getEntityId(entityToDelete.value) };
    await props.deleteFunction(input);
    showDeleteConfirm.value = false;
    entityToDelete.value = null;
    await loadEntities();
  } catch (error) {
    console.error(`Error deleting ${props.entityName}:`, error);
  }
};

// Set current date in YYYY-MM-DD format for CREATED_DATE when creating a new entity
watch(showCreateForm, (newVal) => {
  if (newVal && props.entityName === 'ORIGIN_PRODUCT') {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    formData.value = {
      ...formData.value,
      CREATED_DATE: `${year}-${month}-${day}`
    };
  }
});

const submitForm = async () => {
  try {
    if (showEditForm.value) {
      await props.updateFunction(formData.value);
    } else {
      // For new ORIGIN_PRODUCT, ensure CREATED_DATE is set to today
      if (props.entityName === 'ORIGIN_PRODUCT' && !formData.value.CREATED_DATE) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        formData.value.CREATED_DATE = `${year}-${month}-${day}`;
      }
      await props.createFunction(formData.value);
    }
    cancelForm();
    await loadEntities();
  } catch (error) {
    console.error(`Error saving ${props.entityName}:`, error);
  }
};

const cancelForm = () => {
  formData.value = {};
  showCreateForm.value = false;
  showEditForm.value = false;
};

// Watch for entityName changes and reload data
watch(() => props.entityName, () => {
  loadEntities();
});

onMounted(() => {
  loadEntities();
});
</script>

<style scoped>
.entity-manager {
  margin: 20px;
}

.entity-list {
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

.form-group {
  margin-bottom: 10px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

.form-actions {
  margin-top: 15px;
}

button {
  margin-right: 10px;
  padding: 8px 12px;
  cursor: pointer;
}

.delete-confirm {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}
</style>