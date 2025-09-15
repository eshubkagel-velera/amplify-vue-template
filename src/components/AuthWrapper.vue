<template>
  <div v-if="!isAuthenticated" class="auth-container">
    <div class="auth-form">
      <h2>Sign In</h2>
      <form @submit.prevent="handleSignIn">
        <input v-model="email" type="email" placeholder="Email" required />
        <input v-model="password" type="password" placeholder="Password" required />
        <button type="submit" :disabled="loading">Sign In</button>
      </form>

      <div class="divider">OR</div>
      <button type="button" @click="handleHostedSignIn" class="hosted-signin-btn">
        Sign in with Cognito
      </button>

      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
  <div v-else>
    <div class="user-info">
      <span>{{ user?.username }}</span>
      <span class="user-groups">{{ userGroups.join(', ') }}</span>
      <button @click="handleSignOut">Sign Out</button>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'

const isAuthenticated = ref(false)
const loading = ref(false)
const error = ref('')
const email = ref('')
const password = ref('')
const user = ref(null)
const userGroups = ref([])
const { setUserGroups } = useAuth()

const loadUserGroups = async () => {
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth')
    const session = await fetchAuthSession()
    const accessToken = session.tokens?.accessToken
    
    console.log('🔍 Full JWT payload:', accessToken?.payload)
    if (accessToken?.payload?.['cognito:groups']) {
      userGroups.value = accessToken.payload['cognito:groups']
      setUserGroups(userGroups.value)
      console.log('👥 User groups from JWT:', userGroups.value)
      console.log('👥 User groups array contents:', [...userGroups.value])
      console.log('👥 User groups type:', typeof userGroups.value, Array.isArray(userGroups.value))
    } else {
      console.log('⚠️ No groups found in JWT token')
      console.log('🔍 Available JWT keys:', Object.keys(accessToken?.payload || {}))
      userGroups.value = []
      setUserGroups([])
    }
  } catch (err) {
    console.warn('⚠️ Could not fetch auth session:', err)
    userGroups.value = []
    setUserGroups([])
  }
}

const handleSignIn = async () => {
  loading.value = true
  error.value = ''
  try {
    console.log('🔐 Attempting sign in...')
    const { signIn } = await import('aws-amplify/auth')
    const result = await signIn({ username: email.value, password: password.value })
    console.log('✅ Sign in successful:', result)
    
    const { getCurrentUser } = await import('aws-amplify/auth')
    const currentUser = await getCurrentUser()
    user.value = currentUser
    
    await loadUserGroups()
    isAuthenticated.value = true
  } catch (err: any) {
    console.error('❌ Sign in failed:', err)
    error.value = err.message
  }
  loading.value = false
}

const handleHostedSignIn = async () => {
  try {
    console.log('🌐 Attempting hosted sign in...')
    const { signInWithRedirect } = await import('aws-amplify/auth')
    await signInWithRedirect()
  } catch (err: any) {
    console.error('❌ Hosted sign in failed:', err)
    error.value = err.message
  }
}

const handleSignOut = async () => {
  try {
    const { signOut } = await import('aws-amplify/auth')
    await signOut()
    isAuthenticated.value = false
    user.value = null
    userGroups.value = []
    setUserGroups([])
  } catch (err: any) {
    console.error('❌ Sign out failed:', err)
  }
}

onMounted(async () => {
  try {
    console.log('🔍 Checking authentication status...')
    const { getCurrentUser } = await import('aws-amplify/auth')
    const currentUser = await getCurrentUser()
    user.value = currentUser
    
    await loadUserGroups()
    isAuthenticated.value = true
    console.log('✅ User is authenticated:', currentUser.username)
  } catch (err) {
    console.log('ℹ️ User is not authenticated')
    isAuthenticated.value = false
  }
})
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.auth-form {
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  width: 300px;
}

.auth-form input {
  width: 100%;
  padding: 0.5rem;
  margin: 0.5rem 0;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.auth-form button {
  width: 100%;
  padding: 0.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.divider {
  text-align: center;
  margin: 1rem 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.hosted-signin-btn {
  background: #28a745 !important;
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.user-groups {
  font-size: 0.8rem;
  color: #6c757d;
}

.error {
  color: red;
  margin-top: 0.5rem;
}
</style>