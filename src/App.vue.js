/// <reference types=".vue-global-types/vue_3.5_false.d.ts" />
import { ref, computed, onMounted } from 'vue';
import EntityManager from './components/EntityManager.vue';
import { listLoanApps, createLoanApp, updateLoanApp, deleteLoanApp, listOriginProducts, createOriginProduct, updateOriginProduct, deleteOriginProduct } from './graphql';
const { defineProps, defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
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
const __VLS_fnComponent = (await import('vue')).defineComponent({});
;
let __VLS_functionalComponentProps;
function __VLS_template() {
    const __VLS_ctx = {};
    const __VLS_localComponents = {
        ...{},
        ...{},
        ...__VLS_ctx,
    };
    let __VLS_components;
    const __VLS_localDirectives = {
        ...{},
        ...__VLS_ctx,
    };
    let __VLS_directives;
    let __VLS_styleScopedClasses;
    // CSS variable injection 
    // CSS variable injection end 
    let __VLS_resolvedLocalAndGlobalComponents;
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ id: ("app"), });
    __VLS_elementAsFunction(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({});
    __VLS_elementAsFunction(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({ ...{ onChange: (__VLS_ctx.changeEntity) }, value: ((__VLS_ctx.currentEntity)), });
    for (const [entity] of __VLS_getVForSourceType((__VLS_ctx.entities))) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({ key: ((entity.name)), value: ((entity.name)), });
        (entity.name);
    }
    __VLS_elementAsFunction(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({});
    if (__VLS_ctx.currentEntity && __VLS_ctx.currentEntityConfig) {
        // @ts-ignore
        [EntityManager,];
        // @ts-ignore
        const __VLS_0 = __VLS_asFunctionalComponent(EntityManager, new EntityManager({ entityName: ((__VLS_ctx.currentEntityConfig.name)), fields: ((__VLS_ctx.currentEntityConfig.fields)), formFields: ((__VLS_ctx.currentEntityConfig.formFields)), idField: ((__VLS_ctx.currentEntityConfig.idField)), loadFunction: ((__VLS_ctx.currentEntityConfig.loadFunction)), createFunction: ((__VLS_ctx.currentEntityConfig.createFunction)), updateFunction: ((__VLS_ctx.currentEntityConfig.updateFunction)), deleteFunction: ((__VLS_ctx.currentEntityConfig.deleteFunction)), }));
        const __VLS_1 = __VLS_0({ entityName: ((__VLS_ctx.currentEntityConfig.name)), fields: ((__VLS_ctx.currentEntityConfig.fields)), formFields: ((__VLS_ctx.currentEntityConfig.formFields)), idField: ((__VLS_ctx.currentEntityConfig.idField)), loadFunction: ((__VLS_ctx.currentEntityConfig.loadFunction)), createFunction: ((__VLS_ctx.currentEntityConfig.createFunction)), updateFunction: ((__VLS_ctx.currentEntityConfig.updateFunction)), deleteFunction: ((__VLS_ctx.currentEntityConfig.deleteFunction)), }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    }
    var __VLS_slots;
    var __VLS_inheritedAttrs;
    const __VLS_refs = {};
    var $refs;
    return {
        slots: __VLS_slots,
        refs: $refs,
        attrs: {},
    };
}
;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            EntityManager: EntityManager,
            currentEntity: currentEntity,
            entities: entities,
            currentEntityConfig: currentEntityConfig,
            changeEntity: changeEntity,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
;
