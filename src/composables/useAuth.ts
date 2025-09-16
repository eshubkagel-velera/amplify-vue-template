import { ref, computed, inject } from 'vue'

// Global state for user groups (shared from AuthWrapper)
const globalUserGroups = ref<string[]>([])

export const useAuth = () => {
  const userGroups = globalUserGroups
  const userGroupsSet = computed(() => new Set(userGroups.value))
  
  const roleFlags = computed(() => {
    const groups = userGroupsSet.value
    return {
      isAdmin: groups.has('admin'),
      isDeployment: groups.has('deployment'),
      isDeveloper: groups.has('developer'),
      isReadonly: groups.has('readonly')
    }
  })
  
  const isAdmin = computed(() => roleFlags.value.isAdmin)
  const isDeployment = computed(() => roleFlags.value.isDeployment)
  const isDeveloper = computed(() => roleFlags.value.isDeveloper)
  const isReadonly = computed(() => roleFlags.value.isReadonly)
  
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