<script>
// @ts-nocheck

  import { onMount, onDestroy } from 'svelte';
  import { user, logout } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { productsService, ordersService } from '$lib/services/firestore.js';
  import { 
    ShoppingCart, Plus, Minus, X, CreditCard, LogOut, 
    // @ts-ignore
    Package, Receipt, Search, AlertTriangle
  } from 'lucide-svelte';

  // State
  // @ts-ignore
  let products = [];
  // @ts-ignore
  let cart = [];
  let searchQuery = '';
  let selectedCategory = 'all';
  let showCart = false;
  let loading = true;
  let processing = false;
  // @ts-ignore
  let unsubscribe;

  // Categories
  const categories = [
    { id: 'all', name: 'All', emoji: '🍽️' },
    { id: 'chicken', name: 'Chicken', emoji: '🍗' },
    { id: 'fries', name: 'Fries', emoji: '🍟' },
    { id: 'drinks', name: 'Drinks', emoji: '🥤' }
  ];

  // Computed
 // @ts-ignore
   $: filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
 // @ts-ignore
   $: cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  $: cartTax = cartTotal * 0.08;
  $: cartGrandTotal = cartTotal + cartTax;
 // @ts-ignore
   $: cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  onMount(async () => {
    if (!$user) {
      goto('/auth/login');
      return;
    }

    try {
      loading = true;
      // @ts-ignore
      unsubscribe = productsService.listen((updatedProducts) => {
        products = updatedProducts;
        loading = false;
      });
    } catch (error) {
      console.error('Error loading products:', error);
      loading = false;
    }
  });

  onDestroy(() => {
    // @ts-ignore
    if (unsubscribe) unsubscribe();
  });

  // @ts-ignore
  function addToCart(product) {
    if (product.stock <= 0) return;
    
    // @ts-ignore
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        showToast(`Only ${product.stock} available`, 'warning');
        return;
      }
      existingItem.quantity += 1;
      // @ts-ignore
      cart = [...cart];
    } else {
      // @ts-ignore
      cart = [...cart, { ...product, quantity: 1 }];
    }
    
    showToast(`Added ${product.name}`, 'success');
  }

  // @ts-ignore
  function updateQuantity(itemId, delta) {
    // @ts-ignore
    const item = cart.find(i => i.id === itemId);
    // @ts-ignore
    const product = products.find(p => p.id === itemId);
    
    if (!item || !product) return;
    
    const newQuantity = item.quantity + delta;
    
    if (newQuantity <= 0) {
      // @ts-ignore
      cart = cart.filter(i => i.id !== itemId);
    } else if (newQuantity <= product.stock) {
      item.quantity = newQuantity;
      // @ts-ignore
      cart = [...cart];
    } else {
      showToast(`Only ${product.stock} available`, 'warning');
    }
  }

  // @ts-ignore
  function removeFromCart(itemId) {
    // @ts-ignore
    cart = cart.filter(item => item.id !== itemId);
  }

  async function processOrder() {
    if (cart.length === 0 || processing) return;
    
    processing = true;
    try {
      const orderData = {
        orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
        subtotal: cartTotal,
        tax: cartTax,
        total: cartGrandTotal,
        itemCount: cartItemsCount,
        // @ts-ignore
        cashier: $user.email,
        paymentMethod: 'cash',
        status: 'completed'
      };

      // @ts-ignore
      await ordersService.create(orderData, cart);
      
      showToast('Order completed successfully!', 'success');
      cart = [];
      showCart = false;
    } catch (error) {
      console.error('Error processing order:', error);
      showToast('Failed to process order', 'error');
    } finally {
      processing = false;
    }
  }

  // @ts-ignore
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <span>${message}</span>
      </div>
    `;
    
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toast-slide-out 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  async function handleLogout() {
    await logout();
    goto('/auth/login');
  }
</script>

<svelte:head>
  <title>POS - Papa Jun's</title>
</svelte:head>

<!-- Header -->
<header class="header">
  <div class="header-content">
    <div class="logo">
      <div class="logo-icon">🍗</div>
      <span>Papa Jun's POS</span>
    </div>
    
    <nav class="flex items-center gap-3">
      <a href="/inventory" class="btn btn-ghost">
        <Package size={18} />
        <span class="hidden sm-block">Inventory</span>
      </a>
      <a href="/orders" class="btn btn-ghost">
        <Receipt size={18} />
        <span class="hidden sm-block">Orders</span>
      </a>
      <button class="btn btn-ghost text-danger" on:click={handleLogout}>
        <LogOut size={18} />
        <span class="hidden sm-block">Logout</span>
      </button>
    </nav>
  </div>
</header>

<div class="pos-layout">
  <!-- Products Section -->
  <div class="flex flex-col gap-4">
    <!-- Search & Filters -->
    <div class="card">
      <div class="card-body">
        <div class="flex flex-col gap-3">
          <!-- Search -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              bind:value={searchQuery}
              class="input"
              style="padding-left: 2.5rem;"
            />
          </div>
          
          <!-- Categories -->
          <div class="flex gap-2 flex-wrap">
            {#each categories as category}
              <button
                class="btn btn-sm {selectedCategory === category.id ? 'btn-primary' : 'btn-secondary'}"
                on:click={() => selectedCategory = category.id}
              >
                <span>{category.emoji}</span>
                <span>{category.name}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>

    <!-- Products Grid -->
    {#if loading}
      <div class="card">
        <div class="card-body text-center">
          <div class="animate-spin text-primary">⏳</div>
          <p class="text-gray mt-2">Loading products...</p>
        </div>
      </div>
    {:else if filteredProducts.length === 0}
      <div class="card">
        <div class="card-body text-center">
          <p class="text-gray">No products found</p>
        </div>
      </div>
    {:else}
      <div class="product-grid">
        {#each filteredProducts as product}
          <button
            class="product-card {product.stock <= 0 ? 'out-of-stock' : product.stock <= product.minStock ? 'low-stock' : ''}"
            on:click={() => addToCart(product)}
            disabled={product.stock <= 0}
          >
            <div class="product-stock">
              {#if product.stock <= 0}
                <span class="badge badge-danger">Out</span>
              {:else if product.stock <= product.minStock}
                <span class="badge badge-warning">{product.stock}</span>
              {/if}
            </div>
            
            <div class="product-emoji">{product.image}</div>
            <div class="product-name">{product.name}</div>
            <div class="product-price">${product.price.toFixed(2)}</div>
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Desktop Cart -->
  <div class="cart lg-block hidden">
    <div class="cart-header">
      <h2 class="text-lg font-bold">Cart</h2>
      {#if cart.length > 0}
        <span class="badge badge-info">{cartItemsCount} items</span>
      {/if}
    </div>

    {#if cart.length === 0}
      <div class="empty-state">
        <div class="empty-state-icon">🛒</div>
        <p class="empty-state-text">Your cart is empty</p>
      </div>
    {:else}
      <div class="cart-items">
        {#each cart as item}
          <div class="cart-item">
            <div class="cart-item-info">
              <div class="cart-item-name">{item.name}</div>
              <div class="cart-item-price">${item.price.toFixed(2)} each</div>
            </div>
            
            <div class="cart-item-quantity">
              <button 
                class="btn btn-sm btn-icon btn-ghost"
                on:click={() => updateQuantity(item.id, -1)}
              >
                <Minus size={16} />
              </button>
              <span class="font-bold">{item.quantity}</span>
              <button 
                class="btn btn-sm btn-icon btn-ghost"
                on:click={() => updateQuantity(item.id, 1)}
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div class="cart-item-total">
              ${(item.price * item.quantity).toFixed(2)}
            </div>
            
            <button 
              class="btn btn-sm btn-icon btn-ghost text-danger"
              on:click={() => removeFromCart(item.id)}
            >
              <X size={16} />
            </button>
          </div>
        {/each}
      </div>
    {/if}

    <div class="cart-footer">
      {#if cart.length > 0}
        <div class="cart-summary">
          <div class="cart-summary-row">
            <span>Subtotal</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div class="cart-summary-row">
            <span>Tax (8%)</span>
            <span>${cartTax.toFixed(2)}</span>
          </div>
          <div class="cart-summary-row cart-summary-total">
            <span>Total</span>
            <span>${cartGrandTotal.toFixed(2)}</span>
          </div>
        </div>
        
        <button 
          class="btn btn-primary btn-lg w-full"
          on:click={processOrder}
          disabled={processing}
        >
          {#if processing}
            <span class="animate-spin">⏳</span>
            <span>Processing...</span>
          {:else}
            <CreditCard size={20} />
            <span>Complete Order</span>
          {/if}
        </button>
      {:else}
        <button class="btn btn-secondary btn-lg w-full" disabled>
          <CreditCard size={20} />
          <span>Add items to cart</span>
        </button>
      {/if}
    </div>
  </div>
</div>

<!-- Mobile Cart Button -->
<div class="mobile-cart">
  <button class="mobile-cart-button" on:click={() => showCart = true}>
    <ShoppingCart size={24} />
    {#if cartItemsCount > 0}
      <span class="mobile-cart-badge">{cartItemsCount}</span>
    {/if}
  </button>
</div>

<!-- Mobile Cart Modal -->
{#if showCart}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay lg-hidden" on:click={() => showCart = false}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="modal-content" on:click|stopPropagation>
      <div class="cart">
        <div class="cart-header">
          <h2 class="text-lg font-bold">Cart</h2>
          <button class="btn btn-icon btn-ghost" on:click={() => showCart = false}>
            <X size={20} />
          </button>
        </div>

        {#if cart.length === 0}
          <div class="empty-state">
            <div class="empty-state-icon">🛒</div>
            <p class="empty-state-text">Your cart is empty</p>
          </div>
        {:else}
          <div class="cart-items">
            {#each cart as item}
              <div class="cart-item">
                <div class="cart-item-info">
                  <div class="cart-item-name">{item.name}</div>
                  <div class="cart-item-price">${item.price.toFixed(2)} each</div>
                </div>
                
                <div class="cart-item-quantity">
                  <button 
                    class="btn btn-sm btn-icon btn-ghost"
                    on:click={() => updateQuantity(item.id, -1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span class="font-bold">{item.quantity}</span>
                  <button 
                    class="btn btn-sm btn-icon btn-ghost"
                    on:click={() => updateQuantity(item.id, 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div class="cart-item-total">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
                
                <button 
                  class="btn btn-sm btn-icon btn-ghost text-danger"
                  on:click={() => removeFromCart(item.id)}
                >
                  <X size={16} />
                </button>
              </div>
            {/each}
          </div>
        {/if}

        <div class="cart-footer">
          {#if cart.length > 0}
            <div class="cart-summary">
              <div class="cart-summary-row">
                <span>Subtotal</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div class="cart-summary-row">
                <span>Tax (8%)</span>
                <span>${cartTax.toFixed(2)}</span>
              </div>
              <div class="cart-summary-row cart-summary-total">
                <span>Total</span>
                <span>${cartGrandTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              class="btn btn-primary btn-lg w-full"
              on:click={processOrder}
              disabled={processing}
            >
              {#if processing}
                <span class="animate-spin">⏳</span>
                <span>Processing...</span>
              {:else}
                <CreditCard size={20} />
                <span>Complete Order</span>
              {/if}
            </button>
          {:else}
            <button class="btn btn-secondary btn-lg w-full" disabled>
              <CreditCard size={20} />
              <span>Add items to cart</span>
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .w-full { width: 100%; }
  .flex-wrap { flex-wrap: wrap; }
</style>