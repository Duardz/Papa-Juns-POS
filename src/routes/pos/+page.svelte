<!-- pos page -->
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
    // @ts-ignore
    Menu,
    // @ts-ignore
    Home,
    BarChart3,
    Check,
    Search,
    Filter,
    Clock,
    DollarSign,
    Loader2
  } from 'lucide-svelte';

  // State
  // @ts-ignore
  let products = [];
  // @ts-ignore
  let cart = [];
  let selectedCategory = 'all';
  let showMobileCart = false;
  let showOrderSuccess = false;
  let lastOrderId = '';
  let isProcessingOrder = false;
  let searchQuery = '';
  let showFilters = false;
  let loading = true;
  // @ts-ignore
  let error = null;
  // @ts-ignore
  let unsubscribe;

  // Reactive calculations
 // @ts-ignore
   $: filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
 // @ts-ignore
   $: subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  $: tax = subtotal * 0.08; // 8% tax
  $: total = subtotal + tax;
 // @ts-ignore
   $: totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
 // @ts-ignore
   $: lowStockItems = products.filter(p => p.stock <= p.minStock && p.stock > 0);
 // @ts-ignore
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
    // @ts-ignore
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
      // @ts-ignore
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

  // @ts-ignore
  function addToCart(product) {
    if (product.stock <= 0) return;
    
    // @ts-ignore
    const existingItem = cart.find(item => item.id === product.id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    
    // Check if we have enough stock
    if (currentQuantity >= product.stock) {
      showNotification(`Only ${product.stock} ${product.name} available in stock`, 'warning');
      return;
    }
    
    if (existingItem) {
      existingItem.quantity += 1;
      // @ts-ignore
      cart = [...cart];
    } else {
      // @ts-ignore
      cart = [...cart, { ...product, quantity: 1 }];
    }
    
    showNotification(`${product.name} added to cart`, 'success');
  }

  // @ts-ignore
  function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    // @ts-ignore
    const product = products.find(p => p.id === productId);
    if (newQuantity > product.stock) {
      showNotification(`Only ${product.stock} available in stock`, 'warning');
      return;
    }
    
    // @ts-ignore
    cart = cart.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
  }

  // @ts-ignore
  function removeFromCart(productId) {
    // @ts-ignore
    const item = cart.find(c => c.id === productId);
    // @ts-ignore
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
        // @ts-ignore
        cashier: $user.email,
        paymentMethod: 'cash',
        status: 'completed'
      };

      // Process order in Firestore
      // @ts-ignore
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
      // @ts-ignore
      showNotification(err.message || 'Failed to process order. Please try again.', 'error');
    } finally {
      isProcessingOrder = false;
    }
  }

  // @ts-ignore
  function showNotification(message, type = 'info') {
    // In a real app, you'd use a toast library
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Simple notification - you can replace this with a proper toast library
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white max-w-sm ${
      type === 'success' ? 'bg-green-500' :
      type === 'error' ? 'bg-red-500' :
      type === 'warning' ? 'bg-yellow-500' :
      'bg-blue-500'
    }`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  async function handleLogout() {
    await logout();
    goto('/auth/login');
  }

  // Format currency
  // @ts-ignore
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
</script>

<svelte:head>
  <title>POS System - Papa Jun's</title>
</svelte:head>

{#if $user}
<div class="min-h-screen bg-gray-50 relative">
  <!-- Header -->
  <header class="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
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
        <div class="hidden lg:flex items-center space-x-4">
          <div class="flex items-center space-x-2 text-sm">
            <Clock class="w-4 h-4 text-gray-400" />
            <span class="text-gray-600">{new Date().toLocaleTimeString()}</span>
          </div>
          
          <div class="w-px h-6 bg-gray-300"></div>
          
          <a href="/inventory" class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
            <Package class="w-4 h-4" />
            <span>Inventory</span>
          </a>
          
          <a href="/orders" class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
            <BarChart3 class="w-4 h-4" />
            <span>Reports</span>
          </a>
          
          <button 
            class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            on:click={handleLogout}
          >
            <LogOut class="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

        <!-- Mobile Cart Button -->
        <div class="lg:hidden flex items-center space-x-2">
          <button 
            class="relative p-3 bg-orange-600 text-white rounded-xl shadow-lg hover:bg-orange-700 transition-colors"
            on:click={() => showMobileCart = true}
          >
            <ShoppingCart class="w-5 h-5" />
            {#if totalItems > 0}
              <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-6 h-6 flex items-center justify-center">
                {totalItems}
              </span>
            {/if}
          </button>
        </div>

        <!-- Desktop Cart Summary -->
        <div class="hidden lg:block">
          <div class="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl px-4 py-3">
            <div class="flex items-center space-x-4">
              <div class="text-right">
                <p class="text-lg font-bold text-gray-900">{formatCurrency(total)}</p>
                <p class="text-sm text-gray-600">{totalItems} items</p>
              </div>
              <div class="w-px h-8 bg-orange-300"></div>
              <ShoppingCart class="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Loading State -->
  {#if loading}
    <div class="flex items-center justify-center h-64">
      <div class="flex items-center space-x-3">
        <Loader2 class="w-6 h-6 animate-spin text-orange-600" />
        <span class="text-gray-600">Loading products...</span>
      </div>
    </div>
  {/if}

  <!-- Error State -->
  {#if error}
    <div class="px-4 sm:px-6 lg:px-8 py-4">
      <div class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
        <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p class="font-semibold text-red-800">Error Loading Products</p>
          <p class="text-sm text-red-700">{error}</p>
          <button 
            class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            on:click={loadProducts}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if !loading && !error}
    <!-- Stock Alerts -->
    {#if lowStockItems.length > 0 || outOfStockItems.length > 0}
      <div class="px-4 sm:px-6 lg:px-8 py-4 space-y-3">
        {#if outOfStockItems.length > 0}
          <div class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-semibold text-red-800">Out of Stock</p>
              <p class="text-sm text-red-700">{outOfStockItems.map(p => p.name).join(', ')}</p>
            </div>
          </div>
        {/if}
        
        {#if lowStockItems.length > 0}
          <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start space-x-3">
            <AlertTriangle class="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-semibold text-yellow-800">Low Stock Alert</p>
              <p class="text-sm text-yellow-700">{lowStockItems.map(p => `${p.name} (${p.stock} left)`).join(', ')}</p>
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Main Content -->
    <div class="flex-1 lg:grid lg:grid-cols-12 lg:gap-6 px-4 sm:px-6 lg:px-8 py-6">
      <!-- Products Section -->
      <div class="lg:col-span-8 space-y-6">
        <!-- Search & Filters -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div class="flex flex-col sm:flex-row gap-4">
            <!-- Search -->
            <div class="flex-1">
              <div class="relative">
                <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  bind:value={searchQuery}
                  class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                />
              </div>
            </div>
            
            <!-- Category Filter Toggle -->
            <button
              class="sm:hidden flex items-center justify-center px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              on:click={() => showFilters = !showFilters}
            >
              <Filter class="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <!-- Category Tabs -->
          <div class="mt-4 {showFilters ? 'block' : 'hidden sm:block'}">
            <div class="flex flex-wrap gap-2">
              <button 
                class="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 {selectedCategory === 'all' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                on:click={() => selectedCategory = 'all'}
              >
                <span class="text-lg">🍽️</span>
                <span>All Items</span>
              </button>
              <button 
                class="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 {selectedCategory === 'chicken' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                on:click={() => selectedCategory = 'chicken'}
              >
                <span class="text-lg">🍗</span>
                <span>Chicken</span>
              </button>
              <button 
                class="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 {selectedCategory === 'fries' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                on:click={() => selectedCategory = 'fries'}
              >
                <span class="text-lg">🍟</span>
                <span>Fries</span>
              </button>
              <button 
                class="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 {selectedCategory === 'drinks' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                on:click={() => selectedCategory = 'drinks'}
              >
                <span class="text-lg">🥤</span>
                <span>Drinks</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Products Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {#each filteredProducts as product}
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-lg hover:border-orange-200 transition-all duration-200 {product.stock <= 0 ? 'opacity-60' : ''} {product.stock <= product.minStock && product.stock > 0 ? 'ring-2 ring-yellow-200' : ''}">
              <!-- Product Image & Stock Badge -->
              <div class="relative mb-4">
                <div class="text-center">
                  <span class="text-4xl sm:text-5xl">{product.image}</span>
                </div>
                <div class="absolute -top-2 -right-2">
                  {#if product.stock <= 0}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Out
                    </span>
                  {:else if product.stock <= product.minStock}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {product.stock}
                    </span>
                  {:else}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {product.stock}
                    </span>
                  {/if}
                </div>
              </div>
              
              <!-- Product Info -->
              <div class="text-center space-y-2">
                <h3 class="font-semibold text-gray-900 text-sm sm:text-base leading-tight">{product.name}</h3>
                <p class="text-lg sm:text-xl font-bold text-orange-600">{formatCurrency(product.price)}</p>
                
                <button 
                  class="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg font-medium transition-all duration-200 {product.stock <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg active:scale-95'}"
                  disabled={product.stock <= 0}
                  on:click={() => addToCart(product)}
                >
                  {#if product.stock <= 0}
                    <span class="text-sm">Out of Stock</span>
                  {:else}
                    <Plus class="w-4 h-4" />
                    <span class="text-sm">Add to Cart</span>
                  {/if}
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Desktop Cart Sidebar -->
      <div class="hidden lg:block lg:col-span-4">
        <div class="sticky top-24 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <!-- Cart Header -->
          <div class="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-bold text-gray-900">Order Summary</h2>
              {#if cart.length > 0}
                <button 
                  class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
              <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart class="w-8 h-8 text-gray-400" />
              </div>
              <p class="text-gray-500 font-medium mb-2">Your cart is empty</p>
              <p class="text-gray-400 text-sm">Add items to get started</p>
            </div>
          {:else}
            <!-- Cart Items -->
            <div class="max-h-80 overflow-y-auto px-6 py-4 space-y-4">
              {#each cart as item}
                <div class="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-900 truncate">{item.name}</h4>
                    <p class="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
                  </div>
                  
                  <div class="flex items-center space-x-2">
                    <button 
                      class="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                      on:click={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus class="w-4 h-4 text-gray-600" />
                    </button>
                    
                    <span class="w-8 text-center font-medium">{item.quantity}</span>
                    
                    <button 
                      class="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
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

            <!-- Order Total -->
            <div class="border-t border-gray-200 px-6 py-4 space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Subtotal:</span>
                <span class="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Tax (8%):</span>
                <span class="font-medium">{formatCurrency(tax)}</span>
              </div>
              <div class="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                <span>Total:</span>
                <span class="text-orange-600">{formatCurrency(total)}</span>
              </div>
            </div>

            <!-- Process Order Button -->
            <div class="px-6 pb-6">
              <button 
                class="w-full flex items-center justify-center space-x-3 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl hover:from-orange-700 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
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

<!-- Mobile Cart Slide-over -->
{#if showMobileCart}
  <div class="fixed inset-0 z-50 lg:hidden">
    <!-- Background overlay -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" on:click={() => showMobileCart = false}></div>
    
    <!-- Cart panel -->
    <div class="fixed inset-y-0 right-0 flex max-w-full pl-10">
      <div class="w-screen max-w-md transform transition-transform duration-300 ease-in-out">
        <div class="flex h-full flex-col bg-white shadow-xl">
          <!-- Header -->
          <div class="bg-gradient-to-r from-orange-50 to-red-50 px-4 py-6 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-bold text-gray-900">Order Summary</h2>
              <div class="flex items-center space-x-2">
                {#if cart.length > 0}
                  <button 
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    on:click={clearCart}
                    title="Clear Cart"
                  >
                    <Trash2 class="w-5 h-5" />
                  </button>
                {/if}
                <button 
                  class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingCart class="w-8 h-8 text-gray-400" />
                </div>
                <p class="text-gray-500 font-medium mb-2">Your cart is empty</p>
                <p class="text-gray-400 text-sm">Add items to get started</p>
              </div>
            </div>
          {:else}
            <!-- Cart Items -->
            <div class="flex-1 overflow-y-auto px-4 py-6 space-y-4">
              {#each cart as item}
                <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-900">{item.name}</h4>
                    <p class="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
                  </div>
                  
                  <div class="flex items-center space-x-3">
                    <button 
                      class="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
                      on:click={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus class="w-4 h-4 text-gray-600" />
                    </button>
                    
                    <span class="w-8 text-center font-medium">{item.quantity}</span>
                    
                    <button 
                      class="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
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
            <div class="border-t border-gray-200 p-4 space-y-4">
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
                class="w-full flex items-center justify-center space-x-3 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl hover:from-orange-700 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
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

<!-- Success Modal -->
{#if showOrderSuccess}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl max-w-md w-full p-8 text-center transform transition-all duration-300 scale-100">
      <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Check class="w-10 h-10 text-green-600" />
      </div>
      
      <h3 class="text-2xl font-bold text-gray-900 mb-2">Order Successful!</h3>
      <p class="text-gray-600 mb-2">Order #{lastOrderId} has been processed</p>
      <div class="bg-green-50 rounded-xl p-4 mb-6">
        <div class="flex items-center justify-center space-x-2 text-green-800">
          <DollarSign class="w-6 h-6" />
          <span class="text-3xl font-bold">{formatCurrency(total)}</span>
        </div>
      </div>
      
      <button 
        class="w-full py-3 px-6 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg"
        on:click={() => showOrderSuccess = false}
      >
        Continue Selling
      </button>
    </div>
  </div>
{/if}
{/if}