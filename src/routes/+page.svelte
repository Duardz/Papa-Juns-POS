<!-- login page/landing page -->
<script>
  import { onMount } from 'svelte';
  import { user, login, error } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { ChefHat, Mail, Lock, Eye, EyeOff, ArrowRight, Store, BarChart3, Package, Shield, Clock, Zap } from 'lucide-svelte';

  let email = '';
  let password = '';
  let showPassword = false;
  let isLoading = false;

  // Redirect if already authenticated
  onMount(() => {
    const unsubscribe = user.subscribe((currentUser) => {
      if (currentUser) {
        goto('/pos');
      }
    });
    return unsubscribe;
  });

  async function handleLogin() {
    if (!email || !password) {
      return;
    }

    try {
      isLoading = true;
      await login(email, password);
      // User will be redirected by the onMount subscription
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
  <title>Papa Jun's POS - Restaurant Management System</title>
  <meta name="description" content="Complete point of sale and inventory management system for Papa Jun's Fried Chicken restaurant." />
</svelte:head>

<div class="min-h-screen bg-white">
  <!-- Navigation -->
  <nav class="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-50">
    <div class="max-w-6xl mx-auto px-6">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
            <ChefHat class="w-5 h-5 text-white" />
          </div>
          <div class="flex flex-col">
            <h1 class="text-lg font-bold text-gray-900">Papa Jun's</h1>
            <span class="text-xs text-gray-500 -mt-1">POS System</span>
          </div>
        </div>
        
        <div class="hidden sm:block">
          <span class="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
            🔒 Secure Access
          </span>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="pt-24 pb-12 px-6">
    <div class="max-w-6xl mx-auto">
      <div class="text-center max-w-3xl mx-auto mb-16">
        <div class="inline-flex items-center space-x-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Zap class="w-4 h-4" />
          <span>Complete Restaurant Solution</span>
        </div>
        
        <h1 class="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Modern POS for
          <br>
          <span class="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
            Papa Jun's Kitchen
          </span>
        </h1>
        
        <p class="text-xl text-gray-600 leading-relaxed mb-8">
          Streamline your fried chicken restaurant operations with our intuitive point-of-sale system, 
          real-time inventory management, and powerful analytics.
        </p>
      </div>

      <!-- Features Grid -->
      <div class="grid md:grid-cols-3 gap-8 mb-16">
        <div class="group">
          <div class="bg-gradient-to-br from-orange-50 to-red-50 p-8 rounded-2xl border border-orange-100 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
            <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
              <Store class="w-6 h-6 text-white" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Smart POS</h3>
            <p class="text-gray-600">Lightning-fast order processing with real-time inventory updates and intuitive touch interface.</p>
          </div>
        </div>
        
        <div class="group">
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
            <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4">
              <Package class="w-6 h-6 text-white" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Inventory Control</h3>
            <p class="text-gray-600">Automatic stock tracking, low-stock alerts, and seamless product management for your kitchen.</p>
          </div>
        </div>
        
        <div class="group">
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-100 hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
            <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
              <BarChart3 class="w-6 h-6 text-white" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Sales Analytics</h3>
            <p class="text-gray-600">Comprehensive reports and insights to help you make data-driven business decisions.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Login Section -->
  <section class="py-16 bg-gray-50">
    <div class="max-w-md mx-auto px-6">
      <div class="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <!-- Login Header -->
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield class="w-8 h-8 text-white" />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p class="text-gray-600">Sign in to access your restaurant dashboard</p>
        </div>

        <!-- Login Form -->
        <form on:submit|preventDefault={handleLogin} class="space-y-6">
          <div class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail class="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  bind:value={email}
                  required
                  class="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="admin@papajuns.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock class="h-5 w-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  bind:value={password}
                  required
                  class="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  class="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
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
          </div>

          {#if $error}
            <div class="bg-red-50 border border-red-200 rounded-xl p-4">
              <p class="text-sm text-red-700 font-medium">{$error}</p>
            </div>
          {/if}

          <button
            type="submit"
            class="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            disabled={isLoading || !email || !password}
          >
            {#if isLoading}
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Signing in...</span>
            {:else}
              <span>Sign In to Dashboard</span>
              <ArrowRight class="w-4 h-4" />
            {/if}
          </button>
        </form>

        <!-- Footer Note -->
        <div class="mt-8 pt-6 border-t border-gray-100">
          <div class="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Shield class="w-4 h-4" />
            <span>Authorized personnel only</span>
          </div>
          <p class="text-xs text-gray-400 text-center mt-2">
            Contact Papa Jun for access credentials
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Trust Indicators -->
  <section class="py-12 bg-white border-t border-gray-100">
    <div class="max-w-4xl mx-auto px-6">
      <div class="grid md:grid-cols-3 gap-8 text-center">
        <div class="flex flex-col items-center space-y-3">
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Shield class="w-6 h-6 text-green-600" />
          </div>
          <h4 class="font-semibold text-gray-900">Secure & Reliable</h4>
          <p class="text-sm text-gray-600">Bank-level security with Firebase authentication</p>
        </div>
        
        <div class="flex flex-col items-center space-y-3">
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Clock class="w-6 h-6 text-blue-600" />
          </div>
          <h4 class="font-semibold text-gray-900">Real-time Updates</h4>
          <p class="text-sm text-gray-600">Instant inventory and sales synchronization</p>
        </div>
        
        <div class="flex flex-col items-center space-y-3">
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <Zap class="w-6 h-6 text-purple-600" />
          </div>
          <h4 class="font-semibold text-gray-900">Lightning Fast</h4>
          <p class="text-sm text-gray-600">Optimized for busy restaurant environments</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-900 text-white py-8">
    <div class="max-w-6xl mx-auto px-6">
      <div class="flex flex-col md:flex-row items-center justify-between">
        <div class="flex items-center space-x-3 mb-4 md:mb-0">
          <div class="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
            <ChefHat class="w-4 h-4 text-white" />
          </div>
          <div>
            <span class="font-bold">Papa Jun's POS System</span>
            <p class="text-xs text-gray-400">Professional Restaurant Management</p>
          </div>
        </div>
        
        <div class="text-center md:text-right">
          <p class="text-sm text-gray-300">Version 1.0</p>
          <p class="text-xs text-gray-500">Built with SvelteKit & Firebase</p>
        </div>
      </div>
    </div>
  </footer>
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