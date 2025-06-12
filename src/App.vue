<template>
  <div id="app">
    <header>
      <h1>GraphQL API Manager</h1>
      <nav>
        <select v-model="currentEntity" @change="changeEntity">
          <option v-for="entity in entities" :key="entity.name" :value="entity.name">
            {{ entity.name }}
          </option>
        </select>
      </nav>
    </header>
    
    <main>
      <EntityManager
        v-if="currentEntity && currentEntityConfig"
        :entityName="currentEntityConfig!.name"
        :fields="currentEntityConfig!.fields"
        :formFields="currentEntityConfig!.formFields"
        :idField="currentEntityConfig!.idField"
        :loadFunction="currentEntityConfig!.loadFunction"
        :createFunction="currentEntityConfig!.createFunction"
        :updateFunction="currentEntityConfig!.updateFunction"
        :deleteFunction="currentEntityConfig!.deleteFunction"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import EntityManager from './components/EntityManager.vue';
import { 
  listLoanApps, createLoanApp, updateLoanApp, deleteLoanApp,
  listOriginProducts, createOriginProduct, updateOriginProduct, deleteOriginProduct
} from './graphql';

const currentEntity = ref('');

const entities = [
  {
    name: 'LOAN_APP',
    fields: ['LOAN_APP_ID', 'ORIGIN_LOAN_APP_ID', 'ORIGIN_PRODUCT_ID', 'PROCESS_FLAG', 'CREATED_DATE'],
    formFields: [
      { name: 'LOAN_APP_ID', type: 'number', required: true, disabled: false },
      { name: 'ORIGIN_LOAN_APP_ID', type: 'text', required: true, disabled: false },
      { name: 'ORIGIN_PRODUCT_ID', type: 'number', required: true, disabled: false },
      { name: 'PROCESS_FLAG', type: 'text', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'text', required: true, disabled: false },
      { name: 'CHANGED_DATE', type: 'text', required: false, disabled: false },
      { name: 'EXEC_ID', type: 'text', required: false, disabled: false }
    ],
    idField: 'LOAN_APP_ID',
    loadFunction: listLoanApps,
    createFunction: createLoanApp,
    updateFunction: updateLoanApp,
    deleteFunction: deleteLoanApp
  },
  {
    name: 'ORIGIN_PRODUCT',
    fields: ['ORIGIN_PRODUCT_ID', 'PRODUCT_ID', 'PRODUCT_DESC', 'VENDOR_NAME', 'PSCU_CLIENT_ID'],
    formFields: [
      { name: 'ORIGIN_PRODUCT_ID', type: 'number', required: true, disabled: true },
      { name: 'PRODUCT_ID', type: 'text', required: true, disabled: false },
      { name: 'PRODUCT_DESC', type: 'text', required: true, disabled: false },
      { name: 'VENDOR_NAME', type: 'text', required: true, disabled: false },
      { name: 'PSCU_CLIENT_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_BY_USER_ID', type: 'number', required: true, disabled: false },
      { name: 'CREATED_DATE', type: 'text', required: true, disabled: true },
      { name: 'PARTNER_CODE', type: 'text', required: false, disabled: false }
    ],
    idField: 'ORIGIN_PRODUCT_ID',
    loadFunction: listOriginProducts,
    createFunction: createOriginProduct,
    updateFunction: updateOriginProduct,
    deleteFunction: deleteOriginProduct
  }
];

const currentEntityConfig = computed(() => {
  return entities.find(entity => entity.name === currentEntity.value) || null;
});

const changeEntity = () => {
  // This function is called when the entity selection changes
  console.log(`Changed to entity: ${currentEntity.value}`);
};

onMounted(() => {
  // Set default entity
  if (entities.length > 0) {
    currentEntity.value = entities[0].name;
  }
});
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

select {
  padding: 8px;
  font-size: 16px;
}

main {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 5px;
}
</style>