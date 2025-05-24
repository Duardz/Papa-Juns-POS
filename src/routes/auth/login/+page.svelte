<script>
  import { onMount } from 'svelte';
  import { user, login, error } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-svelte';

  let email = '';
  let password = '';
  let showPassword = false;
  let isLoading = false;

  onMount(() => {
    const unsubscribe = user.subscribe((currentUser) => {
      if (currentUser) {
        goto('/');
      }
    });
    return unsubscribe;
  });

  async function handleLogin() {
    if (!email || !password) return;

    try {
      isLoading = true;
      await login(email, password);
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Login - Papa Jun's POS</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
  <div class="w-full max-w-md">
    <!-- Logo -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg mb-4">
        <span class="text-4xl">🍗</span>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Papa Jun's POS</h1>
      <p class="text-gray mt-2">Sign in to continue</p>
    </div>

    <!-- Login Card -->
    <div class="card">
      <div class="card-body">
        <form on:submit|preventDefault={handleLogin} class="space-y-4">
          <!-- Email Input -->
          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 text-gray" size={18} />
              <input
                type="email"
                bind:value={email}
                class="input"
                style="padding-left: 2.5rem;"
                placeholder="admin@papajuns.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <!-- Password Input -->
          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 text-gray" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                bind:value={password}
                class="input"
                style="padding-left: 2.5rem; padding-right: 2.5rem;"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray hover:text-gray-700"
                on:click={() => showPassword = !showPassword}
              >
                {#if showPassword}
                  <EyeOff size={18} />
                {:else}
                  <Eye size={18} />
                {/if}
              </button>
            </div>
          </div>

          <!-- Error Message -->
          {#if $error}
            <div class="alert alert-danger">
              <span class="text-sm">{$error}</span>
            </div>
          {/if}

          <!-- Submit Button -->
          <button
            type="submit"
            class="btn btn-primary btn-lg w-full"
            disabled={isLoading || !email || !password}
          >
            {#if isLoading}
              <span class="animate-spin">⏳</span>
              <span>Signing in...</span>
            {:else}
              <LogIn size={20} />
              <span>Sign In</span>
            {/if}
          </button>
        </form>

        <!-- Demo Credentials -->
        <div class="mt-6 pt-6 border-t text-center">
          <p class="text-sm text-gray">Demo credentials:</p>
          <p class="text-xs text-gray mt-1">Email: demo@papajuns.com</p>
          <p class="text-xs text-gray">Password: demo123</p>
        </div>
      </div>
    </div>

    <!-- Features -->
    <div class="mt-8 grid grid-cols-3 gap-4 text-center">
      <div>
        <div class="text-2xl mb-1">🍗</div>
        <p class="text-xs text-gray">Smart POS</p>
      </div>
      <div>
        <div class="text-2xl mb-1">📦</div>
        <p class="text-xs text-gray">Inventory</p>
      </div>
      <div>
        <div class="text-2xl mb-1">📊</div>
        <p class="text-xs text-gray">Analytics</p>
      </div>
    </div>
  </div>
</div>

<style>
  .min-h-screen { min-height: 100vh; }
  .max-w-md { max-width: 28rem; }
  .space-y-4 > * + * { margin-top: 1rem; }
  .w-full { width: 100%; }
  .grid { display: grid; }
  .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
</style>