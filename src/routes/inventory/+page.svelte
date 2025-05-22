<!-- inventory page -->
<script>
// @ts-nocheck

  import { onMount, onDestroy } from 'svelte';
  import { user } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { productsService, inventoryService } from '$lib/services/firestore.js';
  import { 
    Package,
    Plus,
    Edit3,
    Trash2,
    Save,
    X,
    AlertTriangle,
    Search,
    // @ts-ignore
    Filter,
    // @ts-ignore
    Download,
    // @ts-ignore
    Upload,
    History,
    TrendingUp,
    TrendingDown,
    Loader2,
    // @ts-ignore
    ChefHat,
    ArrowLeft
  } from 'lucide-svelte';

  // State
  // @ts-ignore
  let products = [];
  // @ts-ignore
  let inventoryLogs = [];
  let loading = true;
  // @ts-ignore
  let error = null;
  let searchQuery = '';
  let selectedCategory = 'all';
  let showAddProduct = false;
  // @ts-ignore
  let editingProduct = null;
  let showBulkUpdate = false;
  let showInventoryLogs = false;
  // @ts-ignore
  let unsubscribe;

  // Form data
  let newProduct = {
    name: '',
    category: 'chicken',
    price: 0,
    stock: 0,
    minStock: 5,
    image: '🍗'
  };

  // Bulk update
  // @ts-ignore
  let bulkUpdates = [];

  // Reactive calculations
 // @ts-ignore
   $: filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
 // @ts-ignore
   $: lowStockItems = products.filter(p => p.stock <= p.minStock && p.stock > 0);
 // @ts-ignore
   $: outOfStockItems = products.filter(p => p.stock <= 0);
  $: totalProducts = products.length;
 // @ts-ignore
   $: totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

  // Categories with emojis
  const categories = [
    { value: 'chicken', label: 'Chicken', emoji: '🍗' },
    { value: 'fries', label: 'Fries', emoji: '🍟' },
    { value: 'drinks', label: 'Drinks', emoji: '🥤' },
    { value: 'sides', label: 'Sides', emoji: '🥗' }
  ];

  const categoryEmojis = {
    chicken: '🍗',
    fries: '🍟',
    drinks: '🥤',
    sides: '🥗'
  };

  onMount(async () => {
    if (!$user) {
      goto('/auth/login');
      return;
    }
    await loadData();
  });

  onDestroy(() => {
    // @ts-ignore
    if (unsubscribe) {
      unsubscribe();
    }
  });

  async function loadData() {
    try {
      loading = true;
      error = null;

      // Load products with real-time updates
      // @ts-ignore
      unsubscribe = productsService.listen((updatedProducts) => {
        products = updatedProducts;
      });

      // Load inventory logs
      inventoryLogs = await inventoryService.getLogs(50);

    } catch (err) {
      console.error('Error loading data:', err);
      error = 'Failed to load inventory data. Please try again.';
    } finally {
      loading = false;
    }
  }

  async function addProduct() {
    try {
      if (!newProduct.name.trim()) {
        showNotification('Product name is required', 'error');
        return;
      }

      await productsService.add({
        ...newProduct,
        // @ts-ignore
        price: parseFloat(newProduct.price),
        // @ts-ignore
        stock: parseInt(newProduct.stock),
        // @ts-ignore
        minStock: parseInt(newProduct.minStock)
      });

      // Reset form
      newProduct = {
        name: '',
        category: 'chicken',
        price: 0,
        stock: 0,
        minStock: 5,
        image: categoryEmojis.chicken
      };

      showAddProduct = false;
      showNotification('Product added successfully!', 'success');
    } catch (err) {
      console.error('Error adding product:', err);
      showNotification('Failed to add product. Please try again.', 'error');
    }
  }

  // @ts-ignore
  async function updateProduct(id, updates) {
    try {
      await productsService.update(id, {
        ...updates,
        price: parseFloat(updates.price),
        stock: parseInt(updates.stock),
        minStock: parseInt(updates.minStock)
      });

      editingProduct = null;
      showNotification('Product updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating product:', err);
      showNotification('Failed to update product. Please try again.', 'error');
    }
  }

  // @ts-ignore
  async function deleteProduct(id, name) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await productsService.delete(id);
      showNotification('Product deleted successfully!', 'success');
    } catch (err) {
      console.error('Error deleting product:', err);
      showNotification('Failed to delete product. Please try again.', 'error');
    }
  }

  // @ts-ignore
  async function updateStock(productId, newStock, reason = 'manual_adjustment') {
    try {
      await inventoryService.updateStock(productId, parseInt(newStock), reason);
      showNotification('Stock updated successfully!', 'success');
      
      // Refresh inventory logs
      inventoryLogs = await inventoryService.getLogs(50);
    } catch (err) {
      console.error('Error updating stock:', err);
      showNotification('Failed to update stock. Please try again.', 'error');
    }
  }

  function startBulkUpdate() {
    // @ts-ignore
    bulkUpdates = products.map(p => ({
      productId: p.id,
      productName: p.name,
      currentStock: p.stock,
      newStock: p.stock,
      previousStock: p.stock
    }));
    showBulkUpdate = true;
  }

  async function processBulkUpdate() {
    try {
      // @ts-ignore
      const updates = bulkUpdates.filter(u => u.newStock !== u.currentStock);
      
      if (updates.length === 0) {
        showNotification('No changes to update', 'info');
        return;
      }

      await inventoryService.bulkUpdateStock(updates.map(u => ({
        ...u,
        reason: 'bulk_update'
      })));

      showBulkUpdate = false;
      showNotification(`Updated ${updates.length} products successfully!`, 'success');
      
      // Refresh inventory logs
      inventoryLogs = await inventoryService.getLogs(50);
    } catch (err) {
      console.error('Error processing bulk update:', err);
      showNotification('Failed to process bulk update. Please try again.', 'error');
    }
  }

  // @ts-ignore
  function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    
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

  // @ts-ignore
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  // @ts-ignore
  function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  // @ts-ignore
  function onCategoryChange(category) {
    // @ts-ignore
    newProduct.image = categoryEmojis[category] || '🍽️';
  }
</script>

<svelte:head>
  <title>Inventory Management - Papa Jun's</title>
</svelte:head>

{#if $user}
<div class="min-h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white border-b border-gray-200 shadow-sm">
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Navigation -->
        <div class="flex items-center space-x-4">
          <a href="/" class="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors">
            <ArrowLeft class="w-5 h-5" />
            <span class="font-medium">Back to POS</span>
          </a>
          
          <div class="w-px h-6 bg-gray-300"></div>
          
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Package class="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900">Inventory Management</h1>
              <p class="text-sm text-gray-600">Manage your products and stock</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center space-x-3">
          <button
            class="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            on:click={() => showInventoryLogs = true}
          >
            <History class="w-4 h-4" />
            <span class="hidden sm:inline">Logs</span>
          </button>
          
          <button
            class="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            on:click={startBulkUpdate}
          >
            <Edit3 class="w-4 h-4" />
            <span class="hidden sm:inline">Bulk Update</span>
          </button>
          
          <button
            class="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            on:click={() => showAddProduct = true}
          >
            <Plus class="w-4 h-4" />
            <span class="hidden sm:inline">Add Product</span>
          </button>
        </div>
      </div>
    </div>
  </header>

  {#if loading}
    <!-- Loading State -->
    <div class="flex items-center justify-center h-64">
      <div class="flex items-center space-x-3">
        <Loader2 class="w-6 h-6 animate-spin text-orange-600" />
        <span class="text-gray-600">Loading inventory...</span>
      </div>
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="p-6">
      <div class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
        <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p class="font-semibold text-red-800">Error Loading Inventory</p>
          <p class="text-sm text-red-700">{error}</p>
          <button 
            class="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            on:click={loadData}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="p-4 sm:p-6 lg:p-8 space-y-6">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Products</p>
              <p class="text-3xl font-bold text-gray-900">{totalProducts}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package class="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Value</p>
              <p class="text-3xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp class="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Low Stock</p>
              <p class="text-3xl font-bold text-yellow-600">{lowStockItems.length}</p>
            </div>
            <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <AlertTriangle class="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Out of Stock</p>
              <p class="text-3xl font-bold text-red-600">{outOfStockItems.length}</p>
            </div>
            <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown class="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <!-- Stock Alerts -->
      {#if lowStockItems.length > 0 || outOfStockItems.length > 0}
        <div class="space-y-3">
          {#if outOfStockItems.length > 0}
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
              <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p class="font-semibold text-red-800">Out of Stock Items</p>
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

      <!-- Search & Filter -->
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
          
          <!-- Category Filter -->
          <div class="flex flex-wrap gap-2">
            <button 
              class="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 {selectedCategory === 'all' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
              on:click={() => selectedCategory = 'all'}
            >
              <span class="text-lg">🍽️</span>
              <span>All</span>
            </button>
            {#each categories as category}
              <button 
                class="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 {selectedCategory === category.value ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
                on:click={() => selectedCategory = category.value}
              >
                <span class="text-lg">{category.emoji}</span>
                <span>{category.label}</span>
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Products Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Products</h3>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Stock</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each filteredProducts as product}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <span class="text-2xl mr-3">{product.image}</span>
                      <div>
                        {#if editingProduct?.id === product.id}
                          <input
                            type="text"
                            bind:value={editingProduct.name}
                            class="font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        {:else}
                          <div class="font-medium text-gray-900">{product.name}</div>
                        {/if}
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {#if editingProduct?.id === product.id}
                      <select
                        bind:value={editingProduct.category}
                        class="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1"
                      >
                        {#each categories as category}
                          <option value={category.value}>{category.label}</option>
                        {/each}
                      </select>
                    {:else}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {product.category}
                      </span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {#if editingProduct?.id === product.id}
                      <input
                        type="number"
                        step="0.01"
                        bind:value={editingProduct.price}
                        class="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-20"
                      />
                    {:else}
                      <div class="text-sm text-gray-900">{formatCurrency(product.price)}</div>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {#if editingProduct?.id === product.id}
                      <input
                        type="number"
                        bind:value={editingProduct.stock}
                        class="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-16"
                      />
                    {:else}
                      <div class="text-sm text-gray-900 font-medium">{product.stock}</div>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {#if editingProduct?.id === product.id}
                      <input
                        type="number"
                        bind:value={editingProduct.minStock}
                        class="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1 w-16"
                      />
                    {:else}
                      <div class="text-sm text-gray-600">{product.minStock}</div>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    {#if product.stock <= 0}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    {:else if product.stock <= product.minStock}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Low Stock
                      </span>
                    {:else}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        In Stock
                      </span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {#if editingProduct?.id === product.id}
                      <div class="flex items-center space-x-2">
                        <button
                          class="text-green-600 hover:text-green-900 p-1 rounded"
                          on:click={() => updateProduct(product.id, editingProduct)}
                        >
                          <Save class="w-4 h-4" />
                        </button>
                        <button
                          class="text-gray-600 hover:text-gray-900 p-1 rounded"
                          on:click={() => editingProduct = null}
                        >
                          <X class="w-4 h-4" />
                        </button>
                      </div>
                    {:else}
                      <div class="flex items-center space-x-2">
                        <button
                          class="text-orange-600 hover:text-orange-900 p-1 rounded"
                          on:click={() => editingProduct = {...product}}
                        >
                          <Edit3 class="w-4 h-4" />
                        </button>
                        <button
                          class="text-red-600 hover:text-red-900 p-1 rounded"
                          on:click={() => deleteProduct(product.id, product.name)}
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Add Product Modal -->
{#if showAddProduct}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl max-w-md w-full p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-gray-900">Add New Product</h3>
        <button
          class="text-gray-400 hover:text-gray-600"
          on:click={() => showAddProduct = false}
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <form on:submit|preventDefault={addProduct} class="space-y-4">
        <div>
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
          <input
            type="text"
            bind:value={newProduct.name}
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Enter product name"
          />
        </div>

        <div>
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            bind:value={newProduct.category}
            on:change={(e) => onCategoryChange(e.target.value)}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            {#each categories as category}
              <option value={category.value}>{category.label}</option>
            {/each}
          </select>
        </div>

        <div class="grid grid-cols-2 gap-4">
            <!-- svelte-ignore a11y_label_has_associated_control -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Price</label>
            <input
              type="number"
              step="0.01"
              bind:value={newProduct.price}
              required
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-sm font-medium text-gray-700 mb-2">Initial Stock</label>
            <input
              type="number"
              bind:value={newProduct.stock}
              required
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="block text-sm font-medium text-gray-700 mb-2">Minimum Stock Alert</label>
          <input
            type="number"
            bind:value={newProduct.minStock}
            required
            min="0"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="5"
          />
        </div>

        <div class="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            on:click={() => showAddProduct = false}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Add Product
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Bulk Update Modal -->
{#if showBulkUpdate}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl max-w-4xl w-full max-h-full overflow-hidden">
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 class="text-xl font-bold text-gray-900">Bulk Stock Update</h3>
        <button
          class="text-gray-400 hover:text-gray-600"
          on:click={() => showBulkUpdate = false}
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <div class="p-6 max-h-96 overflow-y-auto">
        <div class="space-y-4">
          {#each bulkUpdates as update, index}
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">{update.productName}</h4>
                <p class="text-sm text-gray-600">Current: {update.currentStock}</p>
              </div>
              <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                  <!-- svelte-ignore a11y_label_has_associated_control -->
                  <label class="text-sm font-medium text-gray-700">New Stock:</label>
                  <input
                    type="number"
                    bind:value={bulkUpdates[index].newStock}
                    min="0"
                    class="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                {#if update.newStock !== update.currentStock}
                  <span class="text-sm font-medium {update.newStock > update.currentStock ? 'text-green-600' : 'text-red-600'}">
                    {update.newStock > update.currentStock ? '+' : ''}{update.newStock - update.currentStock}
                  </span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="flex justify-end space-x-3 p-6 border-t border-gray-200">
        <button
          class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          on:click={() => showBulkUpdate = false}
        >
          Cancel
        </button>
        <button
          class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          on:click={processBulkUpdate}
        >
          Update All
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Inventory Logs Modal -->
{#if showInventoryLogs}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-2xl max-w-4xl w-full max-h-full overflow-hidden">
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 class="text-xl font-bold text-gray-900">Inventory Logs</h3>
        <button
          class="text-gray-400 hover:text-gray-600"
          on:click={() => showInventoryLogs = false}
        >
          <X class="w-6 h-6" />
        </button>
      </div>

      <div class="p-6 max-h-96 overflow-y-auto">
        <div class="space-y-3">
          {#each inventoryLogs as log}
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">{log.productName}</h4>
                <p class="text-sm text-gray-600">{formatDate(log.createdAt)}</p>
                <p class="text-xs text-gray-500 capitalize">{log.changeReason.replace('_', ' ')}</p>
              </div>
              <div class="text-right">
                <div class="flex items-center space-x-2">
                  <span class="text-sm text-gray-600">{log.previousStock}</span>
                  <span class="text-gray-400">→</span>
                  <span class="text-sm font-medium text-gray-900">{log.newStock}</span>
                </div>
                <div class="text-sm font-medium {log.changeQuantity > 0 ? 'text-green-600' : 'text-red-600'}">
                  {log.changeQuantity > 0 ? '+' : ''}{log.changeQuantity}
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="flex justify-end p-6 border-t border-gray-200">
        <button
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          on:click={() => showInventoryLogs = false}
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}
{/if}