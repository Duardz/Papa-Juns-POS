<script>
  import { onMount } from 'svelte';
  import { user, logout } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { 
    Package, 
    Plus, 
    Edit, 
    Trash2, 
    Search,
    AlertTriangle,
    ChefHat,
    Store,
    BarChart3,
    LogOut,
    X,
    Save
  } from 'lucide-svelte';

  // Sample inventory data with stock levels
  let products = [
    { id: 1, name: 'Chicken Thigh', category: 'chicken', price: 2.50, stock: 25, minStock: 10, cost: 1.20 },
    { id: 2, name: 'Chicken Breast', category: 'chicken', price: 3.00, stock: 20, minStock: 15, cost: 1.50 },
    { id: 3, name: 'Chicken Wing', category: 'chicken', price: 1.75, stock: 5, minStock: 20, cost: 0.80 }, // Low stock
    { id: 4, name: 'Chicken Drumstick', category: 'chicken', price: 2.25, stock: 22, minStock: 15, cost: 1.10 },
    { id: 5, name: 'Whole Chicken', category: 'chicken', price: 12.00, stock: 3, minStock: 5, cost: 6.00 }, // Low stock
    { id: 6, name: 'Regular Fries', category: 'fries', price: 2.00, stock: 50, minStock: 25, cost: 0.50 },
    { id: 7, name: 'Large Fries', category: 'fries', price: 3.00, stock: 40, minStock: 20, cost: 0.75 },
    { id: 8, name: 'Seasoned Fries', category: 'fries', price: 3.50, stock: 8, minStock: 15, cost: 0.90 }, // Low stock
    { id: 9, name: 'Coca Cola', category: 'drinks', price: 1.50, stock: 60, minStock: 30, cost: 0.60 },
    { id: 10, name: 'Sprite', category: 'drinks', price: 1.50, stock: 45, minStock: 30, cost: 0.60 },
    { id: 11, name: 'Orange Juice', category: 'drinks', price: 2.00, stock: 30, minStock: 20, cost: 0.80 },
    { id: 12, name: 'Water', category: 'drinks', price: 1.00, stock: 80, minStock: 40, cost: 0.25 },
  ];

  let searchTerm = '';
  let selectedCategory = 'all';
  let showAddModal = false;
  let showEditModal = false;
  // @ts-ignore
  /**
	 * @type {{ name: any; price: number; id: number; category: any; cost: any; stock: any; minStock: any; } | null}
	 */
  let editingProduct = null;

  // New product form
  let newProduct = {
    name: '',
    category: 'chicken',
    price: 0,
    stock: 0,
    minStock: 0,
    cost: 0
  };

  // Reactive filters
  $: filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  $: lowStockProducts = products.filter(product => product.stock <= product.minStock);
  $: totalValue = products.reduce((sum, product) => sum + (product.stock * product.cost), 0);

  // Check authentication
  onMount(() => {
    if (!$user) {
      goto('/auth/login');
    }
  });

  // @ts-ignore
  function getStockStatus(product) {
    if (product.stock <= 0) return 'out';
    if (product.stock <= product.minStock) return 'low';
    return 'good';
  }

  // @ts-ignore
  function getStockColor(status) {
    switch (status) {
      case 'out': return 'text-red-600 bg-red-50';
      case 'low': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  }

  function openAddModal() {
    newProduct = { name: '', category: 'chicken', price: 0, stock: 0, minStock: 0, cost: 0 };
    showAddModal = true;
  }

  function closeAddModal() {
    showAddModal = false;
    newProduct = { name: '', category: 'chicken', price: 0, stock: 0, minStock: 0, cost: 0 };
  }

  // @ts-ignore
  function openEditModal(product) {
    editingProduct = { ...product };
    showEditModal = true;
  }

  function closeEditModal() {
    showEditModal = false;
    editingProduct = null;
  }

  function addProduct() {
    if (!newProduct.name || newProduct.price <= 0) return;
    
    const id = Math.max(...products.map(p => p.id)) + 1;
    products = [...products, { ...newProduct, id }];
    closeAddModal();
    
    // In real app, this would save to Firestore
    alert('Product added successfully!');
  }

  function updateProduct() {
    // @ts-ignore
    if (!editingProduct.name || editingProduct.price <= 0) return;
    
    // @ts-ignore
    products = products.map(p => p.id === editingProduct.id ? editingProduct : p);
    closeEditModal();
    
    // In real app, this would update Firestore
    alert('Product updated successfully!');
  }

  // @ts-ignore
  function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
      products = products.filter(p => p.id !== productId);
      
      // In real app, this would delete from Firestore
      alert('Product deleted successfully!');
    }
  }

  async function handleLogout() {
    await logout();
    goto('/auth/login');
  }
</script>

<svelte:head>
  <title>Inventory Management - Papa Jun's</title>
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
            <h1 class="text-xl font-bold text-gray-900">Papa Jun's Inventory</h1>
            <p class="text-sm text-gray-600">Manage your restaurant inventory</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-4">
          <a href="/pos" class="btn btn-secondary">
            <Store class="w-4 h-4" />
            POS System
          </a>
          
          <a href="/orders" class="btn btn-secondary">
            <BarChart3 class="w-4 h-4" />
            Order History
          </a>
          
          <button class="btn btn-secondary" on:click={handleLogout}>
            <LogOut class="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  </header>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Products</p>
            <p class="text-2xl font-bold text-gray-900">{products.length}</p>
          </div>
          <Package class="w-8 h-8 text-blue-500" />
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Low Stock Alerts</p>
            <p class="text-2xl font-bold text-red-600">{lowStockProducts.length}</p>
          </div>
          <AlertTriangle class="w-8 h-8 text-red-500" />
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Inventory Value</p>
            <p class="text-2xl font-bold text-green-600">${totalValue.toFixed(2)}</p>
          </div>
          <BarChart3 class="w-8 h-8 text-green-500" />
        </div>
      </div>
    </div>

    <!-- Low Stock Alerts -->
    {#if lowStockProducts.length > 0}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex items-center space-x-2 mb-2">
          <AlertTriangle class="w-5 h-5 text-red-600" />
          <h3 class="font-semibold text-red-800">Low Stock Alert</h3>
        </div>
        <div class="text-sm text-red-700">
          <span class="font-medium">{lowStockProducts.length} items</span> are running low:
          {lowStockProducts.map(p => p.name).join(', ')}
        </div>
      </div>
    {/if}

    <!-- Controls -->
    <div class="card mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <!-- Search -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              class="input pl-10 w-full sm:w-64"
              bind:value={searchTerm}
            />
          </div>
          
          <!-- Category Filter -->
          <select class="input w-full sm:w-auto" bind:value={selectedCategory}>
            <option value="all">All Categories</option>
            <option value="chicken">🍗 Chicken</option>
            <option value="fries">🍟 Fries</option>
            <option value="drinks">🥤 Drinks</option>
          </select>
        </div>
        
        <button class="btn btn-primary" on:click={openAddModal}>
          <Plus class="w-4 h-4" />
          Add Product
        </button>
      </div>
    </div>

    <!-- Products Table -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="text-left py-3 px-4 font-semibold text-gray-900">Product</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-900">Category</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-900">Price</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-900">Cost</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-900">Stock</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredProducts as product}
              <tr class="border-b hover:bg-gray-50">
                <td class="py-3 px-4">
                  <div class="font-medium text-gray-900">{product.name}</div>
                </td>
                <td class="py-3 px-4">
                  <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 capitalize">
                    {product.category}
                  </span>
                </td>
                <td class="py-3 px-4 text-gray-900">${product.price.toFixed(2)}</td>
                <td class="py-3 px-4 text-gray-600">${product.cost.toFixed(2)}</td>
                <td class="py-3 px-4">
                  <div class="text-gray-900">{product.stock}</div>
                  <div class="text-xs text-gray-500">Min: {product.minStock}</div>
                </td>
                <td class="py-3 px-4">
                  {#if getStockStatus(product) === 'out'}
                    <span class="px-2 py-1 text-xs rounded-full {getStockColor('out')}">
                      Out of Stock
                    </span>
                  {:else if getStockStatus(product) === 'low'}
                    <span class="px-2 py-1 text-xs rounded-full {getStockColor('low')}">
                      Low Stock
                    </span>
                  {:else}
                    <span class="px-2 py-1 text-xs rounded-full {getStockColor('good')}">
                      In Stock
                    </span>
                  {/if}
                </td>
                <td class="py-3 px-4">
                  <div class="flex space-x-2">
                    <button 
                      class="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      on:click={() => openEditModal(product)}
                    >
                      <Edit class="w-4 h-4" />
                    </button>
                    <button 
                      class="p-2 text-red-600 hover:bg-red-50 rounded"
                      on:click={() => deleteProduct(product.id)}
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        
        {#if filteredProducts.length === 0}
          <div class="text-center py-12 text-gray-500">
            <Package class="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No products found</p>
            <p class="text-sm">Try adjusting your search or filters</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Add Product Modal -->
{#if showAddModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Add New Product</h3>
        <button on:click={closeAddModal}>
          <X class="w-5 h-5 text-gray-400 hover:text-gray-600" />
        </button>
      </div>
      
      <form on:submit|preventDefault={addProduct} class="space-y-4">
        <div>
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input type="text" class="input" bind:value={newProduct.name} required />
        </div>
        
        <div>
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select class="input" bind:value={newProduct.category}>
            <option value="chicken">Chicken</option>
            <option value="fries">Fries</option>
            <option value="drinks">Drinks</option>
          </select>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <!-- svelte-ignore a11y_label_has_associated_control -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input type="number" step="0.01" class="input" bind:value={newProduct.price} required />
          </div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
            <input type="number" step="0.01" class="input" bind:value={newProduct.cost} required />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
            <input type="number" class="input" bind:value={newProduct.stock} required />
          </div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <!-- svelte-ignore a11y_label_has_associated_control -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
            <input type="number" class="input" bind:value={newProduct.minStock} required />
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" class="btn btn-secondary" on:click={closeAddModal}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            <Save class="w-4 h-4" />
            Add Product
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Edit Product Modal -->
{#if showEditModal && editingProduct}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-md w-full p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Edit Product</h3>
        <button on:click={closeEditModal}>
          <X class="w-5 h-5 text-gray-400 hover:text-gray-600" />
        </button>
      </div>
      
      <form on:submit|preventDefault={updateProduct} class="space-y-4">
        <div>
          <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input type="text" class="input" bind:value={editingProduct.name} required />
        </div>
        
          <!-- svelte-ignore a11y_label_has_associated_control -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select class="input" bind:value={editingProduct.category}>
            <option value="chicken">Chicken</option>
            <option value="fries">Fries</option>
            <option value="drinks">Drinks</option>
          </select>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input type="number" step="0.01" class="input" bind:value={editingProduct.price} required />
          </div>
          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
            <input type="number" step="0.01" class="input" bind:value={editingProduct.cost} required />
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4">
          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
            <input type="number" class="input" bind:value={editingProduct.stock} required />
          </div>
          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
            <input type="number" class="input" bind:value={editingProduct.minStock} required />
          </div>
        </div>
        
        <div class="flex justify-end space-x-3 pt-4">
          <button type="button" class="btn btn-secondary" on:click={closeEditModal}>
            Cancel
          </button>
          <button type="submit" class="btn btn-primary">
            <Save class="w-4 h-4" />
            Update Product
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
{/if}