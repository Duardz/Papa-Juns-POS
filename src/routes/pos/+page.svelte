<!-- Enhanced POS Page -->
<script>
// @ts-nocheck

  import { onMount, onDestroy } from 'svelte';
  import { user, logout } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { productsService, ordersService } from '$lib/services/firestore.js';
  import { 
    ShoppingCart, 
    Plus, 
    Minus, 
    Trash2, 
    CreditCard,
    LogOut,
    ChefHat,
    Package,
    AlertTriangle,
    X,
    Menu,
    Home,
    BarChart3,
    Check,
    Search,
    Filter,
    Clock,
    DollarSign,
    Loader2,
    Bell,
    Settings,
    User
  } from 'lucide-svelte';

  // State
  let products = [];
  let cart = [];
  let selectedCategory = 'all';
  let showMobileCart = false;
  let showOrderSuccess = false;
  let lastOrderId = '';
  let isProcessingOrder = false;
  let searchQuery = '';
  let showFilters = false;
  let loading = true;
  let error = null;
  let unsubscribe;
  let showMobileMenu = false;

  // Reactive calculations
  $: filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  $: subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  $: tax = subtotal * 0.08; // 8% tax
  $: total = subtotal + tax;
  $: totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  $: lowStockItems = products.filter(p => p.stock <= p.minStock && p.stock > 0);
  $: outOfStockItems = products.filter(p => p.stock <= 0);

  // Check if user is authenticated
  onMount(async () => {
    if (!$user) {
      goto('/auth/login');
      return;
    }
    await loadProducts();
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  async function loadProducts() {
    try {
      loading = true;
      error = null;

      // Load products once initially
      products = await productsService.getAll();

      // Set up real-time listener
      unsubscribe = productsService.listen((updatedProducts) => {
        products = updatedProducts;
      });

    } catch (err) {
      console.error('Error loading products:', err);
      error = 'Failed to load products. Please try again.';
    } finally {
      loading = false;
    }
  }

  function addToCart(product) {
    if (product.stock <= 0) return;
    
    const existingItem = cart.find(item => item.id === product.id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    
    // Check if we have enough stock
    if (currentQuantity >= product.stock) {
      showNotification(`Only ${product.stock} ${product.name} available in stock`, 'warning');
      return;
    }
    
    if (existingItem) {
      existingItem.quantity += 1;
      cart = [...cart];
    } else {
      cart = [...cart, { ...product, quantity: 1 }];
    }
    
    showNotification(`${product.name} added to cart`, 'success');
  }

  function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (newQuantity > product.stock) {
      showNotification(`Only ${product.stock} available in stock`, 'warning');
      return;
    }
    
    cart = cart.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
  }

  function removeFromCart(productId) {
    const item = cart.find(c => c.id === productId);
    cart = cart.filter(item => item.id !== productId);
    if (item) {
      showNotification(`${item.name} removed from cart`, 'info');
    }
  }

  function clearCart() {
    if (cart.length > 0) {
      cart = [];
      showNotification('Cart cleared', 'info');
    }
  }

  async function processOrder() {
    if (cart.length === 0) return;
    
    isProcessingOrder = true;
    
    try {
      // Generate order ID
      const orderNumber = 'ORD-' + Date.now().toString().slice(-6);
      
      // Create order data
      const orderData = {
        orderNumber,
        subtotal,
        tax,
        total,
        itemCount: totalItems,
        cashier: $user.email,
        paymentMethod: 'cash',
        status: 'completed'
      };

      // Process order in Firestore
      const orderId = await ordersService.create(orderData, cart);
      
      lastOrderId = orderNumber;
      
      // Clear cart after successful order
      clearCart();
      
      // Show success modal
      showOrderSuccess = true;
      showMobileCart = false;
      
      showNotification('Order processed successfully!', 'success');
      
    } catch (err) {
      console.error('Error processing order:', err);
      showNotification(err.message || 'Failed to process order. Please try again.', 'error');
    } finally {
      isProcessingOrder = false;
    }
  }

  function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Enhanced notification system
    const notification = document.createElement('div');
    notification.className = `toast ${type}`;
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="flex-shrink-0">
          ${type === 'success' ? '✓' : 
            type === 'error' ? '✗' : 
            type === 'warning' ? '⚠' : 'ℹ'}
        </div>
        <div class="flex-1 text-sm">${message}</div>
      </div>
    `;
    
    const container = document.getElementById('toast-container');
    if (container) {
      container.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'toast-slide-out 0.3s ease-in forwards';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
    }
  }

  async function handleLogout() {
    await logout();
    goto('/auth/login');
  }

  // Format currency
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // Get current time
  function getCurrentTime() {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<svelte:head>
  <title>POS System - Papa Jun's</title>
</svelte:head>

{#if $user}
<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  <!-- Enhanced Header -->
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Brand -->
        <div class="flex items-center space-x-3">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <ChefHat class="w-6 h-6 text-white" />
            </div>
          </div>
          <div class="hidden sm:block">
            <h1 class="text-xl font-bold text-gray-900">Papa Jun's POS</h1>
            <p class="text-sm text-gray-600">Welcome, {$user.email.split('@')[0]}</p>
          </div>
        </div>
        
        <!-- Desktop Navigation -->
        <div class="hidden lg:flex items-center space-x-6">
          <!-- Time Display -->
          <div class="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
            <Clock class="w-4 h-4 text-gray-500" />
            <span class="text-sm font-medium text-gray-700">{getCurrentTime()}</span>
          </div>
          
          <!-- Navigation Links -->
          <nav class="flex items-center space-x-2">
            <a href="/inventory" class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200">
              <Package class="w-4 h-4" />
              <span>Inventory</span>
            </a>
            
            <a href="/orders" class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200">
              <BarChart3 class="w-4 h-4" />
              <span>Reports</span>
            </a>
            
            <button class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200" on:click={handleLogout}>
              <LogOut class="w-4 h-4" />
              <span>Logout</span>
            </button>
          </nav>
        </div>

        <!-- Mobile Controls -->
        <div class="lg:hidden flex items-center space-x-3">
          <!-- Mobile Cart Button -->
          <button 
            class="relative p-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 btn-hover-scale"
            on:click={() => showMobileCart = true}
          >
            <ShoppingCart class="w-5 h-5" />
            {#if totalItems > 0}
              <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-6 h-6 flex items-center justify-center animate-pulse">
                {totalItems}
              </span>
            {/if}
          </button>

          <!-- Mobile Menu Button -->
          <button 
            class="p-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all duration-200"
            on:click={() => showMobileMenu = !showMobileMenu}
          >
            <Menu class="w-5 h-5" />
          </button>
        </div>

        <!-- Desktop Cart Summary -->
        <div class="hidden lg:block">
          <div class="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl px-4 py-3 shadow-sm">
            <div class="flex items-center space-x-4">
              <div class="text-right">
                <p class="text-lg font-bold text-gray-900">{formatCurrency(total)}</p>
                <p class="text-sm text-gray-600">{totalItems} items</p>
              </div>
              <div class="w-px h-8 bg-orange-300"></div>
              <div class="relative">
                <ShoppingCart class="w-6 h-6 text-orange-600" />
                {#if totalItems > 0}
                  <div class="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Mobile Menu Overlay -->
  {#if showMobileMenu}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="lg:hidden fixed inset-0 z-50 modal-overlay" on:click={() => showMobileMenu = false}>
      <div class="fixed top-0 right-0 h-full w-80 bg-white shadow-xl modal-content" on:click|stopPropagation>
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-semibold text-gray-900">Menu</h3>
            <button class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" on:click={() => showMobileMenu = false}>
              <X class="w-6 h-6" />
            </button>
          </div>
          
          <nav class="space-y-2">
            <a href="/inventory" class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 text-left">
              <Package class="w-5 h-5" />
              <span>Inventory Management</span>
            </a>
            <a href="/orders" class="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200 text-left">
              <BarChart3 class="w-5 h-5" />
              <span>Order History</span>
            </a>
            <button class="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 text-left w-full" on:click={handleLogout}>
              <LogOut class="w-5 h-5" />
              <span>Logout</span>
            </button>
          </nav>

          <!-- Mobile User Info -->
          <div class="mt-8 pt-6 border-t border-gray-200">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <User class="w-5 h-5 text-white" />
              </div>
              <div>
                <p class="font-medium text-gray-900">{$user.email.split('@')[0]}</p>
                <p class="text-sm text-gray-500">Cashier</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Loading State -->
  {#if loading}
    <div class="flex items-center justify-center h-96">
      <div class="text-center">
        <div class="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Loader2 class="w-8 h-8 text-white animate-spin" />
        </div>
        <p class="text-gray-600 font-medium">Loading products<span class="loading-dots"></span></p>
      </div>
    </div>
  {/if}

  <!-- Error State -->
  {#if error}
    <div class="px-4 sm:px-6 lg:px-8 py-6">
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start space-x-4 shadow-sm">
        <div class="flex-shrink-0">
          <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle class="w-5 h-5 text-red-600" />
          </div>
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-red-800 mb-1">Error Loading Products</h3>
          <p class="text-sm text-red-700 mb-3">{error}</p>
          <button 
            class="btn-hover-scale px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            on:click={loadProducts}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if !loading && !error}
    <!-- Enhanced Stock Alerts -->
    {#if lowStockItems.length > 0 || outOfStockItems.length > 0}
      <div class="px-4 sm:px-6 lg:px-8 py-4 space-y-3">
        {#if outOfStockItems.length > 0}
          <div class="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle class="w-4 h-4 text-red-600" />
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                  <h4 class="font-semibold text-red-800">Out of Stock</h4>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">{outOfStockItems.length} items</span>
                </div>
                <p class="text-sm text-red-700">{outOfStockItems.map(p => p.name).join(', ')}</p>
              </div>
            </div>
          </div>
        {/if}
        
        {#if lowStockItems.length > 0}
          <div class="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Bell class="w-4 h-4 text-yellow-600 animate-pulse" />
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                  <h4 class="font-semibold text-yellow-800">Low Stock Alert</h4>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">{lowStockItems.length} items</span>
                </div>
                <p class="text-sm text-yellow-700">{lowStockItems.map(p => `${p.name} (${p.stock} left)`).join(', ')}</p>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Main Content -->
    <div class="flex-1 lg:grid lg:grid-cols-12 lg:gap-6 px-4 sm:px-6 lg:px-8 py-6">
      <!-- Products Section -->
      <div class="lg:col-span-8 space-y-6">
        <!-- Enhanced Search & Filters -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
          <div class="flex flex-col sm:flex-row gap-4">
            <!-- Search -->
            <div class="flex-1">
              <div class="relative">
                <Search class="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  bind:value={searchQuery}
                  class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>
            </div>
            
            <!-- Category Filter Toggle -->
            <button
              class="sm:hidden flex items-center justify-center px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl hover:bg-gray-200 transition-colors btn-hover-scale"
              on:click={() => showFilters = !showFilters}
            >
              <Filter class="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <!-- Category Tabs -->
          <div class="mt-6 {showFilters ? 'block' : 'hidden sm:block'}">
            <div class="flex flex-wrap gap-3">
              <button 
                class="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 btn-hover-scale {selectedCategory === 'all' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                on:click={() => selectedCategory = 'all'}
              >
                <span class="text-lg">🍽️</span>
                <span>All Items</span>
              </button>
              <button 
                class="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 btn-hover-scale {selectedCategory === 'chicken' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                on:click={() => selectedCategory = 'chicken'}
              >
                <span class="text-lg">🍗</span>
                <span>Chicken</span>
              </button>
              <button 
                class="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 btn-hover-scale {selectedCategory === 'fries' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                on:click={() => selectedCategory = 'fries'}
              >
                <span class="text-lg">🍟</span>
                <span>Fries</span>
              </button>
              <button 
                class="flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 btn-hover-scale {selectedCategory === 'drinks' ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                on:click={() => selectedCategory = 'drinks'}
              >
                <span class="text-lg">🥤</span>
                <span>Drinks</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Enhanced Products Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {#each filteredProducts as product}
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 cursor-pointer card-hover {product.stock <= 0 ? 'opacity-60 cursor-not-allowed' : ''} {product.stock <= product.minStock && product.stock > 0 ? 'ring-2 ring-yellow-200 bg-yellow-50' : ''}">
              <!-- Product Image & Stock Badge -->
              <div class="relative mb-4">
                <div class="text-center">
                  <span class="text-5xl sm:text-6xl">{product.image}</span>
                </div>
                <div class="absolute -top-2 -right-2">
                  {#if product.stock <= 0}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Out</span>
                  {:else if product.stock <= product.minStock}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">{product.stock}</span>
                  {:else}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">{product.stock}</span>
                  {/if}
                </div>
              </div>
              
              <!-- Product Info -->
              <div class="text-center space-y-3">
                <h3 class="font-semibold text-gray-900 text-sm sm:text-base leading-tight">{product.name}</h3>
                <p class="text-xl sm:text-2xl font-bold text-orange-600">{formatCurrency(product.price)}</p>
                
                <button 
                  class="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 shadow-sm btn-hover-scale {product.stock <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 hover:shadow-lg'}"
                  disabled={product.stock <= 0}
                  on:click={() => addToCart(product)}
                >
                  {#if product.stock <= 0}
                    <span class="text-sm">Out of Stock</span>
                  {:else}
                    <Plus class="w-4 h-4" />
                    <span class="text-sm font-medium">Add to Cart</span>
                  {/if}
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Enhanced Desktop Cart Sidebar -->
      <div class="hidden lg:block lg:col-span-4">
        <div class="sticky top-24 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <!-- Cart Header -->
          <div class="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-5 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold text-gray-900">Order Summary</h2>
              {#if cart.length > 0}
                <button 
                  class="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors btn-hover-scale"
                  on:click={clearCart}
                  title="Clear Cart"
                >
                  <Trash2 class="w-5 h-5" />
                </button>
              {/if}
            </div>
          </div>

          {#if cart.length === 0}
            <!-- Empty Cart -->
            <div class="p-8 text-center">
              <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart class="w-10 h-10 text-gray-400" />
              </div>
              <p class="text-gray-500 font-medium mb-2">Your cart is empty</p>
              <p class="text-gray-400 text-sm">Add items to get started</p>
            </div>
          {:else}
            <!-- Cart Items -->
            <div class="max-h-80 overflow-y-auto px-6 py-4 space-y-4">
              {#each cart as item}
                <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl transition-all duration-200 hover:bg-gray-100">
                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-900 truncate">{item.name}</h4>
                    <p class="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
                  </div>
                  
                  <div class="flex items-center space-x-3">
                    <button 
                      class="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200 shadow-sm btn-hover-scale"
                      on:click={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus class="w-4 h-4 text-gray-600" />
                    </button>
                    
                    <span class="w-8 text-center font-medium text-lg">{item.quantity}</span>
                    
                    <button 
                      class="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200 shadow-sm btn-hover-scale"
                      on:click={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus class="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  
                  <div class="text-right">
                    <p class="font-bold text-gray-900 text-lg">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              {/each}
            </div>

            <!-- Order Total -->
            <div class="border-t border-gray-200 px-6 py-5 space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Subtotal:</span>
                <span class="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Tax (8%):</span>
                <span class="font-medium">{formatCurrency(tax)}</span>
              </div>
              <div class="flex justify-between text-xl font-bold pt-3 border-t border-gray-200">
                <span>Total:</span>
                <span class="text-orange-600">{formatCurrency(total)}</span>
              </div>
            </div>

            <!-- Process Order Button -->
            <div class="px-6 pb-6">
              <button 
                class="w-full flex items-center justify-center space-x-3 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl btn-hover-scale"
                disabled={isProcessingOrder}
                on:click={processOrder}
              >
                {#if isProcessingOrder}
                  <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                {:else}
                  <CreditCard class="w-5 h-5" />
                  <span>Process Order</span>
                {/if}
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Enhanced Mobile Cart Slide-over -->
{#if showMobileCart}
  <div class="fixed inset-0 z-50 lg:hidden modal-overlay">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" on:click={() => showMobileCart = false}></div>
    
    <div class="fixed inset-y-0 right-0 flex max-w-full pl-10">
      <div class="w-screen max-w-md transform transition-transform duration-300 ease-in-out modal-content">
        <div class="flex h-full flex-col bg-white shadow-xl">
          <!-- Header -->
          <div class="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-bold text-gray-900">Order Summary</h2>
              <div class="flex items-center space-x-2">
                {#if cart.length > 0}
                  <button 
                    class="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors btn-hover-scale"
                    on:click={clearCart}
                    title="Clear Cart"
                  >
                    <Trash2 class="w-5 h-5" />
                  </button>
                {/if}
                <button 
                  class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors btn-hover-scale"
                  on:click={() => showMobileCart = false}
                >
                  <X class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {#if cart.length === 0}
            <!-- Empty Cart -->
            <div class="flex-1 flex items-center justify-center p-8">
              <div class="text-center">
                <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart class="w-10 h-10 text-gray-400" />
                </div>
                <p class="text-gray-500 font-medium mb-2">Your cart is empty</p>
                <p class="text-gray-400 text-sm">Add items to get started</p>
              </div>
            </div>
          {:else}
            <!-- Cart Items -->
            <div class="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {#each cart as item}
                <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl transition-all duration-200">
                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-900">{item.name}</h4>
                    <p class="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
                  </div>
                  
                  <div class="flex items-center space-x-3">
                    <button 
                      class="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200 shadow-sm btn-hover-scale"
                      on:click={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus class="w-4 h-4 text-gray-600" />
                    </button>
                    
                    <span class="w-8 text-center font-medium">{item.quantity}</span>
                    
                    <button 
                      class="w-10 h-10 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200 shadow-sm btn-hover-scale"
                      on:click={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus class="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  
                  <div class="text-right">
                    <p class="font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                  </div>
                </div>
              {/each}
            </div>

            <!-- Order Total & Process Button -->
            <div class="border-t border-gray-200 p-6 space-y-4">
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Subtotal:</span>
                  <span class="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">Tax (8%):</span>
                  <span class="font-medium">{formatCurrency(tax)}</span>
                </div>
                <div class="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total:</span>
                  <span class="text-orange-600">{formatCurrency(total)}</span>
                </div>
              </div>

              <button 
                class="w-full flex items-center justify-center space-x-3 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg btn-hover-scale"
                disabled={isProcessingOrder}
                on:click={processOrder}
              >
                {#if isProcessingOrder}
                  <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                {:else}
                  <CreditCard class="w-5 h-5" />
                  <span>Process Order</span>
                {/if}
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Enhanced Success Modal -->
{#if showOrderSuccess}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-overlay">
    <div class="bg-white rounded-2xl max-w-md w-full p-8 text-center transform transition-all duration-300 scale-100 modal-content shadow-2xl">
      <div class="w-24 h-24 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
        <Check class="w-12 h-12 text-white" />
      </div>
      
      <h3 class="text-2xl font-bold text-gray-900 mb-2">Order Successful!</h3>
      <p class="text-gray-600 mb-4">Order #{lastOrderId} has been processed</p>
      
      <div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
        <div class="flex items-center justify-center space-x-2 text-green-800">
          <DollarSign class="w-8 h-8" />
          <span class="text-4xl font-bold">{formatCurrency(total)}</span>
        </div>
        <p class="text-sm text-green-700 mt-2">Payment processed successfully</p>
      </div>
      
      <button 
        class="w-full py-4 px-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg btn-hover-scale"
        on:click={() => showOrderSuccess = false}
      >
        Continue Selling
      </button>
    </div>
  </div>
{/if}
{/if}