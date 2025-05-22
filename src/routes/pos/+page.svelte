<script>
// @ts-nocheck

  import { onMount } from 'svelte';
  import { user, logout } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { 
    ShoppingCart, 
    Plus, 
    Minus, 
    Trash2, 
    CreditCard,
    LogOut,
    ChefHat,
    Package
  } from 'lucide-svelte';

  // Sample products for Papa Jun's Fried Chicken with better stock management
  let products = [
    // Chicken Parts
    { id: 1, name: 'Chicken Thigh', category: 'chicken', price: 2.50, stock: 25, minStock: 10, image: '🍗' },
    { id: 2, name: 'Chicken Breast', category: 'chicken', price: 3.00, stock: 20, minStock: 15, image: '🍗' },
    { id: 3, name: 'Chicken Wing', category: 'chicken', price: 1.75, stock: 5, minStock: 20, image: '🍗' }, // Low stock
    { id: 4, name: 'Chicken Drumstick', category: 'chicken', price: 2.25, stock: 22, minStock: 15, image: '🍗' },
    { id: 5, name: 'Whole Chicken', category: 'chicken', price: 12.00, stock: 3, minStock: 5, image: '🍗' }, // Low stock
    
    // Fries
    { id: 6, name: 'Regular Fries', category: 'fries', price: 2.00, stock: 50, minStock: 25, image: '🍟' },
    { id: 7, name: 'Large Fries', category: 'fries', price: 3.00, stock: 40, minStock: 20, image: '🍟' },
    { id: 8, name: 'Seasoned Fries', category: 'fries', price: 3.50, stock: 8, minStock: 15, image: '🍟' }, // Low stock
    
    // Drinks
    { id: 9, name: 'Coca Cola', category: 'drinks', price: 1.50, stock: 60, minStock: 30, image: '🥤' },
    { id: 10, name: 'Sprite', category: 'drinks', price: 1.50, stock: 45, minStock: 30, image: '🥤' },
    { id: 11, name: 'Orange Juice', category: 'drinks', price: 2.00, stock: 30, minStock: 20, image: '🧃' },
    { id: 12, name: 'Water', category: 'drinks', price: 1.00, stock: 80, minStock: 40, image: '💧' },
  ];

  // @ts-ignore
  let cart = [];
  let selectedCategory = 'all';
  let showCart = false;
  // @ts-ignore
  let showLowStockAlert = false;

  // Reactive calculations
  $: filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);
  
 // @ts-ignore
   $: subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  $: tax = subtotal * 0.08; // 8% tax
  $: total = subtotal + tax;
 // @ts-ignore
   $: totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  $: lowStockItems = products.filter(p => p.stock <= p.minStock && p.stock > 0);
  $: outOfStockItems = products.filter(p => p.stock <= 0);

  // Check if user is authenticated
  onMount(() => {
    if (!$user) {
      goto('/auth/login');
    }
  });

  // @ts-ignore
  function addToCart(product) {
    if (product.stock <= 0) return;
    
    // @ts-ignore
    const existingItem = cart.find(item => item.id === product.id);
    const currentQuantity = existingItem ? existingItem.quantity : 0;
    
    // Check if we have enough stock
    if (currentQuantity >= product.stock) {
      alert(`Not enough stock! Only ${product.stock} ${product.name} available.`);
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
  }

  // @ts-ignore
  function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const product = products.find(p => p.id === productId);
    // @ts-ignore
    if (newQuantity > product.stock) {
      // @ts-ignore
      alert(`Not enough stock! Only ${product.stock} available.`);
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
    cart = cart.filter(item => item.id !== productId);
  }

  function clearCart() {
    cart = [];
  }

  async function processOrder() {
    if (cart.length === 0) return;
    
    // Update stock levels
    // @ts-ignore
    cart.forEach(cartItem => {
      const productIndex = products.findIndex(p => p.id === cartItem.id);
      if (productIndex !== -1) {
        products[productIndex].stock -= cartItem.quantity;
      }
    });
    
    // Generate order ID
    const orderId = 'ORD-' + Date.now().toString().slice(-6);
    
    // Create order object (in real app, this would save to Firestore)
    const order = {
      id: orderId,
      date: new Date(),
      // @ts-ignore
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal: subtotal,
      tax: tax,
      total: total,
      status: 'completed',
      paymentMethod: 'cash' // This would be selected by user
    };
    
    console.log('Order processed:', order);
    
    // Show success message
    alert(`Order ${orderId} processed successfully!\nTotal: ${total.toFixed(2)}\n\nStock levels have been updated.`);
    
    // Clear cart after successful order
    clearCart();
    
    // Update products array to trigger reactivity
    products = [...products];
  }

  async function handleLogout() {
    await logout();
    goto('/auth/login');
  }
</script>

<svelte:head>
  <title>POS System - Papa Jun's</title>
</svelte:head>

{#if $user}
<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
            <ChefHat class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900">Papa Jun's POS</h1>
            <p class="text-sm text-gray-600">Welcome, {$user.email}</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-4">
          <a href="/inventory" class="btn btn-secondary">
            <Package class="w-4 h-4" />
            Inventory
          </a>
          
          <button 
            class="btn btn-primary relative"
            on:click={() => showCart = !showCart}
          >
            <ShoppingCart class="w-4 h-4" />
            Cart
            {#if totalItems > 0}
              <span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            {/if}
          </button>
          
          <button class="btn btn-secondary" on:click={handleLogout}>
            <LogOut class="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  </header>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Stock Alerts -->
    {#if lowStockItems.length > 0 || outOfStockItems.length > 0}
      <div class="mb-6 space-y-2">
        {#if outOfStockItems.length > 0}
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-red-500 rounded-full"></div>
              <span class="font-medium text-red-800">Out of Stock:</span>
              <span class="text-red-700">{outOfStockItems.map(p => p.name).join(', ')}</span>
            </div>
          </div>
        {/if}
        
        {#if lowStockItems.length > 0}
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span class="font-medium text-yellow-800">Low Stock Alert:</span>
              <span class="text-yellow-700">{lowStockItems.map(p => `${p.name} (${p.stock} left)`).join(', ')}</span>
            </div>
          </div>
        {/if}
      </div>
    {/if}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Products Section -->
      <div class="lg:col-span-2">
        <!-- Category Filter -->
        <div class="mb-6">
          <div class="flex flex-wrap gap-2">
            <button 
              class="btn {selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}"
              on:click={() => selectedCategory = 'all'}
            >
              All Items
            </button>
            <button 
              class="btn {selectedCategory === 'chicken' ? 'btn-primary' : 'btn-secondary'}"
              on:click={() => selectedCategory = 'chicken'}
            >
              🍗 Chicken
            </button>
            <button 
              class="btn {selectedCategory === 'fries' ? 'btn-primary' : 'btn-secondary'}"
              on:click={() => selectedCategory = 'fries'}
            >
              🍟 Fries
            </button>
            <button 
              class="btn {selectedCategory === 'drinks' ? 'btn-primary' : 'btn-secondary'}"
              on:click={() => selectedCategory = 'drinks'}
            >
              🥤 Drinks
            </button>
          </div>
        </div>

        <!-- Products Grid -->
        <div class="pos-grid">
          {#each filteredProducts as product}
            <div class="product-card" class:opacity-50={product.stock <= 0} class:border-yellow-200={product.stock <= product.minStock && product.stock > 0}>
              <div class="text-center">
                <div class="text-4xl mb-2">{product.image}</div>
                <h3 class="font-semibold text-gray-900">{product.name}</h3>
                <p class="text-lg font-bold text-orange-600">${product.price.toFixed(2)}</p>
                
                <!-- Stock Status -->
                <div class="mt-2 mb-3">
                  {#if product.stock <= 0}
                    <span class="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">Out of Stock</span>
                  {:else if product.stock <= product.minStock}
                    <span class="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                      Low Stock ({product.stock} left)
                    </span>
                  {:else}
                    <span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      In Stock ({product.stock})
                    </span>
                  {/if}
                </div>
                
                <button 
                  class="btn btn-primary mt-3 w-full"
                  disabled={product.stock <= 0}
                  on:click={() => addToCart(product)}
                >
                  {#if product.stock <= 0}
                    Out of Stock
                  {:else}
                    <Plus class="w-4 h-4" />
                    Add to Cart
                  {/if}
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Cart Section -->
      <div class="lg:col-span-1">
        <div class="card sticky top-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold">Order Summary</h2>
            {#if cart.length > 0}
              <button class="text-red-600 hover:text-red-800" on:click={clearCart}>
                <Trash2 class="w-4 h-4" />
              </button>
            {/if}
          </div>

          {#if cart.length === 0}
            <div class="text-center py-8 text-gray-500">
              <ShoppingCart class="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Your cart is empty</p>
              <p class="text-sm">Add items to get started</p>
            </div>
          {:else}
            <div class="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {#each cart as item}
                <div class="cart-item">
                  <div class="flex-1">
                    <h4 class="font-medium text-sm">{item.name}</h4>
                    <p class="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                  </div>
                  
                  <div class="flex items-center space-x-2">
                    <button 
                      class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
                      on:click={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus class="w-3 h-3" />
                    </button>
                    
                    <span class="w-8 text-center font-medium">{item.quantity}</span>
                    
                    <button 
                      class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
                      on:click={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus class="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div class="text-right">
                    <p class="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              {/each}
            </div>

            <!-- Order Total -->
            <div class="border-t pt-4 space-y-2">
              <div class="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>Tax (8%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div class="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              class="btn btn-primary w-full mt-4"
              on:click={processOrder}
            >
              <CreditCard class="w-4 h-4" />
              Process Order
            </button>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>
{/if}