<template>
  <div class="entity-crud">
    <h2>{{ entityName }} Management</h2>
    
    <!-- Entity List -->
    <div class="entity-list">
      <button @click="loadEntities" class="btn">Refresh</button>
      <button @click="showCreateForm = true" class="btn btn-primary">Add New</button>
      
      <table v-if="entities.length > 0">
        <thead>
          <tr>
            <th v-for="field in displayFields" :key="field">{{ field }}</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entity in entities" :key="getEntityId(entity)">
            <td v-for="field in displayFields" :key="field">{{ entity[field] }}</td>
            <td>
              <button @click="editEntity(entity)" class="btn btn-sm">Edit</button>
              <button @click="confirmDelete(entity)" class="btn btn-sm btn-danger">Delete</button>
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
          <button type="submit" class="btn btn-primary">{{ showEditForm ? 'Update' : 'Create' }}</button>
          <button type="button" @click="cancelForm" class="btn">Cancel</button>
        </div>
      </form>
    </div>
    
    <!-- Delete Confirmation -->
    <div v-if="showDeleteConfirm" class="delete-confirm">
      <p>Are you sure you want to delete this {{ entityName }}?</p>
      <button @click="deleteEntity" class="btn btn-danger">Yes, Delete</button>
      <button @click="showDeleteConfirm = false" class="btn">Cancel</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps } from 'vue';
import { generateClient } from 'aws-amplify/api';

const client = generateClient();

const props = defineProps({
  entityName: {
    type: String,
    required: true
  },
  displayFields: {
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
  listQuery: {
    type: String,
    required: true
  },
  createMutation: {
    type: String,
    required: true
  },
  updateMutation: {
    type: String,
    required: true
  },
  deleteMutation: {
    type: String,
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
    const response = await client.graphql({
      query: props.listQuery
    });
    
    const listName = `list${props.entityName}S`;
    entities.value = response.data[listName].items;
  } catch (error) {
    console.error(`Error loading ${props.entityName}:`, error);
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
    await client.graphql({
      query: props.deleteMutation,
      variables: { input }
    });
    showDeleteConfirm.value = false;
    entityToDelete.value = null;
    await loadEntities();
  } catch (error) {
    console.error(`Error deleting ${props.entityName}:`, error);
  }
};

const submitForm = async () => {
  try {
    if (showEditForm.value) {
      await client.graphql({
        query: props.updateMutation,
        variables: { input: formData.value }
      });
    } else {
      await client.graphql({
        query: props.createMutation,
        variables: { input: formData.value }
      });
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

onMounted(() => {
  loadEntities();
});
</script>

<style scoped>
.entity-crud {
  margin: 20px 0;
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

.btn {
  padding: 8px 12px;
  margin-right: 5px;
  cursor: pointer;
  border: 1px solid #ccc;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  border-color: #dc3545;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 0.875rem;
}

.delete-confirm {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}
</style>