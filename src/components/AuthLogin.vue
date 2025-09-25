<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Sign In</h2>
      <form @submit.prevent="signIn" v-if="!isSignUp">
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" required />
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Signing In...' : 'Sign In' }}
        </button>
        <p class="auth-link">
          Don't have an account? 
          <a href="#" @click="isSignUp = true">Sign Up</a>
        </p>
      </form>

      <form @submit.prevent="confirmAccount" v-else-if="needsConfirmation">
        <div class="form-group">
          <label>Confirmation Code</label>
          <input v-model="confirmationCode" type="text" required placeholder="Enter code from email" />
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Confirming...' : 'Confirm Account' }}
        </button>
        <p class="auth-link">
          <a href="#" @click="needsConfirmation = false; isSignUp = false">Back to Sign In</a>
        </p>
      </form>

      <form @submit.prevent="signUp" v-else>


        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" required />
        </div>
        <div class="form-group">
          <label>Requested Access</label>
          <select v-model="requestedAccess" required>
            <option value="ReadOnly">ReadOnly</option>
            <option value="Developer">Developer</option>
            <option value="Deployment">Deployment</option>
          </select>
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Creating Account...' : 'Sign Up' }}
        </button>
        <p class="auth-link">
          Already have an account? 
          <a href="#" @click="isSignUp = false">Sign In</a>
        </p>
      </form>

      <div v-if="error" class="error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { signIn as cognitoSignIn, signUp as cognitoSignUp, confirmSignUp } from 'aws-amplify/auth';
import { useTheme } from '../composables/useTheme';

// Initialize theme
const { theme } = useTheme();

onMounted(() => {
  // Ensure theme is applied to document
  document.documentElement.setAttribute('data-theme', theme.value);
});

const emit = defineEmits(['authenticated']);

const email = ref('');
const password = ref('');
const confirmationCode = ref('');
const requestedAccess = ref('ReadOnly');
const loading = ref(false);
const error = ref('');
const isSignUp = ref(false);
const needsConfirmation = ref(false);

const signIn = async () => {
  loading.value = true;
  error.value = '';
  try {
    const result = await cognitoSignIn({ username: email.value, password: password.value });
    if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
      error.value = 'Please check your email and confirm your account first.';
    } else {
      emit('authenticated');
    }
  } catch (err) {
    if (err.name === 'UserNotConfirmedException') {
      error.value = 'Please check your email and confirm your account first.';
    } else {
      error.value = err.message;
    }
  }
  loading.value = false;
};

const signUp = async () => {
  loading.value = true;
  error.value = '';
  
  // Client-side validation
  if (!email.value.endsWith('@velera.com')) {
    error.value = 'Only @velera.com email addresses are allowed';
    loading.value = false;
    return;
  }
  
  try {
    await cognitoSignUp({
      username: email.value,
      password: password.value,
      options: {
        userAttributes: { 
          email: email.value,
          name: `Requested: ${requestedAccess.value}`
        }
      }
    });
    
    // Store requested access in localStorage for now
    localStorage.setItem(`requestedAccess_${email.value}`, requestedAccess.value);
    
    // Also store in session for Lambda to potentially access
    sessionStorage.setItem('lastRequestedAccess', requestedAccess.value);
    needsConfirmation.value = true;
    if (requestedAccess.value !== 'ReadOnly') {
      error.value = `Account created! Your ${requestedAccess.value} access request has been submitted. Enter the confirmation code from your email.`;
    } else {
      error.value = 'Account created! Enter the confirmation code from your email.';
    }
  } catch (err) {
    error.value = err.message;
  }
  loading.value = false;
};

const confirmAccount = async () => {
  loading.value = true;
  error.value = '';
  try {
    await confirmSignUp({
      username: email.value,
      confirmationCode: confirmationCode.value
    });
    needsConfirmation.value = false;
    isSignUp.value = false;
    error.value = 'Account confirmed! You can now sign in.';
  } catch (err) {
    error.value = err.message;
  }
  loading.value = false;
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.auth-card {
  background-color: var(--modal-bg);
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.auth-card h2 {
  color: var(--text-color);
  text-align: center;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: var(--text-color);
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-sizing: border-box;
  color: var(--text-color);
  background-color: var(--input-bg);
}

button {
  width: 100%;
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.auth-link {
  text-align: center;
  margin-top: 1rem;
  color: var(--text-color);
}

.auth-link a {
  color: #007bff;
  text-decoration: none;
}

.error {
  color: #dc3545;
  margin-top: 1rem;
  text-align: center;
}
</style>