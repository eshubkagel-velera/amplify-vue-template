import { ref, computed, inject, watchEffect } from 'vue'

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
  const isReadonly = computed(() => {
    const env = currentEnvironment.value
    
    // Explicit readonly role
    if (roleFlags.value.isReadonly) return true
    
    // Developer in UAT/LIVE is readonly
    if (isDeveloper.value && (env === 'uat' || env === 'live')) return true
    
    return false
  })
  
  const canEdit = computed(() => {
    const env = currentEnvironment.value
    
    // Admin and deployment can edit in all environments
    if (isAdmin.value || isDeployment.value) return true
    
    // Developer can edit only in dev and test
    if (isDeveloper.value && (env === 'dev' || env === 'test')) return true
    
    // Readonly cannot edit anywhere
    return false
  })
  const currentEnvironment = ref(localStorage.getItem('selectedEnvironment') || 'dev')
  
  // Watch for environment changes
  watchEffect(() => {
    const handleEnvChange = () => {
      currentEnvironment.value = localStorage.getItem('selectedEnvironment') || 'dev'
    }
    window.addEventListener('environmentChanged', handleEnvChange)
    return () => window.removeEventListener('environmentChanged', handleEnvChange)
  })
  
  const canDelete = computed(() => {
    const env = currentEnvironment.value
    
    // Admin and deployment can delete in all environments
    if (isAdmin.value || isDeployment.value) return true
    
    // Developer can delete only in dev and test
    if (isDeveloper.value && (env === 'dev' || env === 'test')) return true
    
    // Readonly cannot delete anywhere
    return false
  })
  const canEditProduction = computed(() => isAdmin.value)
  
  const setUserGroups = (groups: string[]) => {
    // If user has readonly and other groups, remove readonly
    if (groups.includes('readonly') && groups.length > 1) {
      userGroups.value = groups.filter(group => group !== 'readonly')
    } else {
      userGroups.value = groups
    }
  }
  
  return {
    userGroups, setUserGroups,
    isAdmin, isDeployment, isDeveloper, isReadonly,
    canEdit, canDelete, canEditProduction
  }
}