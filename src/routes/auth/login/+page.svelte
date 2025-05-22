<script>
  import { login, error, loading } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { ChefHat, Mail, Lock, Eye, EyeOff } from 'lucide-svelte';

  let email = '';
  let password = '';
  let showPassword = false;
  let isLoading = false;

  async function handleLogin() {
    if (!email || !password) {
      return;
    }

    try {
      isLoading = true;
      await login(email, password);
      goto('/pos'); // Redirect to POS after successful login
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      isLoading = false;
    }
  }

  function togglePassword() {
    showPassword = !showPassword;
  }
</script>

<svelte:head>
  <title>Login - Papa Jun's POS</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <!-- Logo Section -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mb-4">
        <ChefHat class="w-8 h-8 text-white" />
      </div>
      <h1 class="text-3xl font-bold text-gray-900">Papa Jun's POS</h1>
      <p class="text-gray-600 mt-2">Sign in to access your restaurant system</p>
    </div>

    <!-- Login Form -->
    <div class="card">
      <form on:submit|preventDefault={handleLogin} class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail class="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              bind:value={email}
              required
              class="input pl-10"
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock class="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              bind:value={password}
              required
              class="input pl-10 pr-10"
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
              on:click={togglePassword}
            >
              {#if showPassword}
                <EyeOff class="h-5 w-5 text-gray-400 hover:text-gray-600" />
              {:else}
                <Eye class="h-5 w-5 text-gray-400 hover:text-gray-600" />
              {/if}
            </button>
          </div>
        </div>

        {#if $error}
          <div class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-600">{$error}</p>
          </div>
        {/if}

        <button
          type="submit"
          class="btn btn-primary w-full"
          disabled={isLoading || !email || !password}
        >
          {#if isLoading}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Signing in...
          {:else}
            Sign In
          {/if}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Authorized personnel only. Contact Papa Jun for access.
        </p>
      </div>
    </div>

    <div class="text-center mt-8">
      <p class="text-xs text-gray-500">
        Papa Jun's Fried Chicken POS System v1.0
      </p>
    </div>
  </div>
</div>

<style>
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>