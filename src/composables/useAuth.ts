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
  const isReadonly = computed(() => roleFlags.value.isReadonly)
  
  const canEdit = computed(() => {
    if (isReadonly.value) return false
    const isDevOrTest = currentEnvironment.value === 'dev' || currentEnvironment.value === 'test'
    return isAdmin.value || isDeployment.value || (isDeveloper.value && isDevOrTest)
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
    const isDevOrTest = currentEnvironment.value === 'dev' || currentEnvironment.value === 'test'
    console.log('canDelete check:', {
      userGroups: userGroups.value,
      currentEnv: currentEnvironment.value,
      isAdmin: isAdmin.value,
      isDeployment: isDeployment.value,
      isDeveloper: isDeveloper.value,
      isDevOrTest
    })
    return isAdmin.value || isDeployment.value || (isDeveloper.value && isDevOrTest)
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