/// <reference types=".vue-global-types/vue_3.5_false.d.ts" />
import { ref, onMounted, defineProps, watch } from 'vue';
const { defineSlots, defineEmits, defineExpose, defineModel, defineOptions, withDefaults, } = await import('vue');
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
        }
        else {
            entities.value = [];
        }
    }
    catch (error) {
        console.error(`Error loading ${props.entityName}:`, error);
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
    }
    catch (error) {
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
        }
        else {
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
    }
    catch (error) {
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
const __VLS_fnComponent = (await import('vue')).defineComponent({
    props: {
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
    },
});
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
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("entity-manager") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    (__VLS_ctx.entityName);
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("entity-list") }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.loadEntities) }, });
    __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                __VLS_ctx.showCreateForm = true;
            } }, });
    if (__VLS_ctx.entities.length > 0) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
        for (const [field] of __VLS_getVForSourceType((__VLS_ctx.fields))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({ key: ((field)), });
            (field);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
        for (const [entity] of __VLS_getVForSourceType((__VLS_ctx.entities))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({ key: ((__VLS_ctx.getEntityId(entity))), });
            for (const [field] of __VLS_getVForSourceType((__VLS_ctx.fields))) {
                __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({ key: ((field)), });
                (entity[field]);
            }
            __VLS_elementAsFunction(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                        if (!((__VLS_ctx.entities.length > 0)))
                            return;
                        __VLS_ctx.editEntity(entity);
                    } }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                        if (!((__VLS_ctx.entities.length > 0)))
                            return;
                        __VLS_ctx.confirmDelete(entity);
                    } }, });
        }
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.entityName);
    }
    if (__VLS_ctx.showCreateForm || __VLS_ctx.showEditForm) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("entity-form") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({});
        (__VLS_ctx.showEditForm ? 'Edit' : 'Create');
        (__VLS_ctx.entityName);
        __VLS_elementAsFunction(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({ ...{ onSubmit: (__VLS_ctx.submitForm) }, });
        for (const [field] of __VLS_getVForSourceType((__VLS_ctx.formFields))) {
            __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ key: ((field.name)), ...{ class: ("form-group") }, });
            __VLS_elementAsFunction(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({ for: ((field.name)), });
            (field.name);
            __VLS_elementAsFunction(__VLS_intrinsicElements.input)({ id: ((field.name)), type: ((field.type)), required: ((field.required)), disabled: ((field.disabled)), });
            (__VLS_ctx.formData[field.name]);
        }
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("form-actions") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ type: ("submit"), });
        (__VLS_ctx.showEditForm ? 'Update' : 'Create');
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.cancelForm) }, type: ("button"), });
    }
    if (__VLS_ctx.showDeleteConfirm) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({ ...{ class: ("delete-confirm") }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        (__VLS_ctx.entityName);
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (__VLS_ctx.deleteEntity) }, });
        __VLS_elementAsFunction(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({ ...{ onClick: (...[$event]) => {
                    if (!((__VLS_ctx.showDeleteConfirm)))
                        return;
                    __VLS_ctx.showDeleteConfirm = false;
                } }, });
    }
    __VLS_styleScopedClasses['entity-manager'];
    __VLS_styleScopedClasses['entity-list'];
    __VLS_styleScopedClasses['entity-form'];
    __VLS_styleScopedClasses['form-group'];
    __VLS_styleScopedClasses['form-actions'];
    __VLS_styleScopedClasses['delete-confirm'];
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
            entities: entities,
            formData: formData,
            showCreateForm: showCreateForm,
            showEditForm: showEditForm,
            showDeleteConfirm: showDeleteConfirm,
            getEntityId: getEntityId,
            loadEntities: loadEntities,
            editEntity: editEntity,
            confirmDelete: confirmDelete,
            deleteEntity: deleteEntity,
            submitForm: submitForm,
            cancelForm: cancelForm,
        };
    },
    props: {
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
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    props: {
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
    },
});
;
