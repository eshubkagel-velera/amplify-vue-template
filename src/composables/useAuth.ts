import { ref, computed, inject } from 'vue'

// Global state for user groups (shared from AuthWrapper)
const globalUserGroups = ref<string[]>([])

export const useAuth = () => {
  const userGroups = globalUserGroups
  
  const isAdmin = computed(() => userGroups.value.includes('admin'))
  const isDeployment = computed(() => userGroups.value.includes('deployment'))
  const isDeveloper = computed(() => userGroups.value.includes('developer'))
  const isReadonly = computed(() => userGroups.value.includes('readonly'))
  
  const canEdit = computed(() => !isReadonly.value)
  const canDelete = computed(() => isAdmin.value || isDeployment.value)
  const canEditProduction = computed(() => isAdmin.value)
  
  const setUserGroups = (groups: string[]) => {
    userGroups.value = groups
  }
  
  return {
    userGroups, setUserGroups,
    isAdmin, isDeployment, isDeveloper, isReadonly,
    canEdit, canDelete, canEditProduction
  }
}