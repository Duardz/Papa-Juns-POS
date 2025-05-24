<script>
// @ts-nocheck

  import { onMount, onDestroy } from 'svelte';
  import { user } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { productsService } from '$lib/services/firestore.js';
  import { 
    Package, Plus, Edit3, Trash2, Save, X, AlertTriangle, 
    // @ts-ignore
    Search, ArrowLeft, TrendingDown
  } from 'lucide-svelte';

  // State
  // @ts-ignore
  let products = [];
  let loading = true;
  let searchQuery = '';
  let selectedCategory = 'all';
  // @ts-ignore
  let editingId = null;
  let editForm = {};
  let showAddModal = false;
  // @ts-ignore
  let unsubscribe;

  // New product form
  let newProduct = {
    name: '',
    category: 'chicken',
    price: '',
    stock: '',
    minStock: '5',
    image: '🍗'
  };

  const categories = [
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
   $: lowStockCount = products.filter(p => p.stock <= p.minStock && p.stock > 0).length;
 // @ts-ignore
   $: outOfStockCount = products.filter(p => p.stock <= 0).length;
 // @ts-ignore
   $: totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

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
  function startEdit(product) {
    editingId = product.id;
    editForm = { ...product };
  }

  function cancelEdit() {
    editingId = null;
    editForm = {};
  }

  async function saveEdit() {
    try {
      // @ts-ignore
      await productsService.update(editingId, {
        // @ts-ignore
        name: editForm.name,
        // @ts-ignore
        category: editForm.category,
        // @ts-ignore
        price: parseFloat(editForm.price),
        // @ts-ignore
        stock: parseInt(editForm.stock),
        // @ts-ignore
        minStock: parseInt(editForm.minStock)
      });
      editingId = null;
      showToast('Product updated successfully', 'success');
    } catch (error) {
      console.error('Error updating product:', error);
      showToast('Failed to update product', 'error');
    }
  }

  // @ts-ignore
  async function deleteProduct(id, name) {
    if (!confirm(`Delete "${name}"?`)) return;
    
    try {
      await productsService.delete(id);
      showToast('Product deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast('Failed to delete product', 'error');
    }
  }

  async function addProduct() {
    if (!newProduct.name.trim()) {
      showToast('Product name is required', 'error');
      return;
    }

    try {
      await productsService.add({
        ...newProduct,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        minStock: parseInt(newProduct.minStock)
      });

      // Reset form
      newProduct = {
        name: '',
        category: 'chicken',
        price: '',
        stock: '',
        minStock: '5',
        image: '🍗'
      };
      
      showAddModal = false;
      showToast('Product added successfully', 'success');
    } catch (error) {
      console.error('Error adding product:', error);
      showToast('Failed to add product', 'error');
    }
  }

  function updateProductEmoji() {
    const category = categories.find(c => c.id === newProduct.category);
    newProduct.image = category?.emoji || '🍽️';
  }

  // @ts-ignore
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="flex items-center gap-2"><span>${message}</span></div>`;
    
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
</script>

<svelte:head>
  <title>Inventory - Papa Jun's</title>
</svelte:head>

<!-- Header -->
<header class="header">
  <div class="header-content">
    <div class="flex items-center gap-3">
      <a href="/" class="btn btn-ghost">
        <ArrowLeft size={18} />
        <span class="hidden sm-block">Back to POS</span>
      </a>
      <div class="logo">
        <div class="logo-icon">
          <Package size={20} />
        </div>
        <span>Inventory</span>
      </div>
    </div>
    
    <button class="btn btn-primary" on:click={() => showAddModal = true}>
      <Plus size={18} />
      <span class="hidden sm-block">Add Product</span>
    </button>
  </div>
</header>

<div class="container" style="padding-top: 2rem; padding-bottom: 2rem;">
  <!-- Stats Cards -->
  <div class="grid grid-cols-2 lg-grid-cols-4 gap-4 mb-4">
    <div class="card">
      <div class="card-body">
        <div class="text-2xl font-bold">{products.length}</div>
        <div class="text-sm text-gray">Total Products</div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-body">
        <div class="text-2xl font-bold text-success">${totalValue.toFixed(2)}</div>
        <div class="text-sm text-gray">Total Value</div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-body">
        <div class="text-2xl font-bold text-warning">{lowStockCount}</div>
        <div class="text-sm text-gray">Low Stock</div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-body">
        <div class="text-2xl font-bold text-danger">{outOfStockCount}</div>
        <div class="text-sm text-gray">Out of Stock</div>
      </div>
    </div>
  </div>

  <!-- Alerts -->
  {#if outOfStockCount > 0}
    <div class="alert alert-danger mb-4">
      <AlertTriangle size={20} />
      <span>{outOfStockCount} products are out of stock</span>
    </div>
  {/if}

  <!-- Search & Filters -->
  <div class="card mb-4">
    <div class="card-body">
      <div class="flex flex-col gap-3">
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
        
        <div class="flex gap-2 flex-wrap">
          <button
            class="btn btn-sm {selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}"
            on:click={() => selectedCategory = 'all'}
          >
            <span>🍽️</span>
            <span>All</span>
          </button>
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

  <!-- Products Table -->
  {#if loading}
    <div class="card">
      <div class="card-body text-center">
        <div class="animate-spin text-primary">⏳</div>
        <p class="text-gray mt-2">Loading inventory...</p>
      </div>
    </div>
  {:else}
    <div class="card">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left p-3">Product</th>
              <th class="text-left p-3">Category</th>
              <th class="text-left p-3">Price</th>
              <th class="text-left p-3">Stock</th>
              <th class="text-left p-3">Min Stock</th>
              <th class="text-left p-3">Status</th>
              <th class="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredProducts as product}
              <tr class="border-b hover:bg-gray-50">
                <td class="p-3">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl">{product.image}</span>
                    {#if editingId === product.id}
                      <input
                        type="text"
                        bind:value={editForm.name}
                        class="input"
                        style="width: 150px;"
                      />
                    {:else}
                      <span class="font-medium">{product.name}</span>
                    {/if}
                  </div>
                </td>
                
                <td class="p-3">
                  {#if editingId === product.id}
                    <select bind:value={editForm.category} class="input" style="width: 120px;">
                      {#each categories as cat}
                        <option value={cat.id}>{cat.name}</option>
                      {/each}
                    </select>
                  {:else}
                    <span class="badge badge-info">{product.category}</span>
                  {/if}
                </td>
                
                <td class="p-3">
                  {#if editingId === product.id}
                    <input
                      type="number"
                      step="0.01"
                      bind:value={editForm.price}
                      class="input"
                      style="width: 80px;"
                    />
                  {:else}
                    ${product.price.toFixed(2)}
                  {/if}
                </td>
                
                <td class="p-3">
                  {#if editingId === product.id}
                    <input
                      type="number"
                      bind:value={editForm.stock}
                      class="input"
                      style="width: 80px;"
                    />
                  {:else}
                    <span class="font-medium">{product.stock}</span>
                  {/if}
                </td>
                
                <td class="p-3">
                  {#if editingId === product.id}
                    <input
                      type="number"
                      bind:value={editForm.minStock}
                      class="input"
                      style="width: 80px;"
                    />
                  {:else}
                    {product.minStock}
                  {/if}
                </td>
                
                <td class="p-3">
                  {#if product.stock <= 0}
                    <span class="badge badge-danger">Out of Stock</span>
                  {:else if product.stock <= product.minStock}
                    <span class="badge badge-warning">Low Stock</span>
                  {:else}
                    <span class="badge badge-success">In Stock</span>
                  {/if}
                </td>
                
                <td class="p-3">
                  <div class="flex gap-1">
                    {#if editingId === product.id}
                      <button class="btn btn-sm btn-success" on:click={saveEdit}>
                        <Save size={16} />
                      </button>
                      <button class="btn btn-sm btn-secondary" on:click={cancelEdit}>
                        <X size={16} />
                      </button>
                    {:else}
                      <button class="btn btn-sm btn-ghost" on:click={() => startEdit(product)}>
                        <Edit3 size={16} />
                      </button>
                      <button class="btn btn-sm btn-ghost text-danger" on:click={() => deleteProduct(product.id, product.name)}>
                        <Trash2 size={16} />
                      </button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        
        {#if filteredProducts.length === 0}
          <div class="text-center p-8">
            <p class="text-gray">No products found</p>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Add Product Modal -->
{#if showAddModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" on:click={() => showAddModal = false}>
    <div class="modal-content" on:click|stopPropagation style="max-width: 400px;">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Add New Product</h2>
          <button class="btn btn-icon btn-ghost" on:click={() => showAddModal = false}>
            <X size={20} />
          </button>
        </div>
        
        <form on:submit|preventDefault={addProduct} class="flex flex-col gap-3">
          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="text-sm text-gray mb-1 block">Product Name</label>
            <input
              type="text"
              bind:value={newProduct.name}
              class="input"
              placeholder="Enter product name"
              required
            />
          </div>
          
          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="text-sm text-gray mb-1 block">Category</label>
            <select 
              bind:value={newProduct.category} 
              on:change={updateProductEmoji}
              class="input"
            >
              {#each categories as category}
                <option value={category.id}>{category.emoji} {category.name}</option>
              {/each}
            </select>
          </div>
          
          <div class="grid grid-cols-2 gap-3">
            <div>
              <!-- svelte-ignore a11y_label_has_associated_control -->
              <label class="text-sm text-gray mb-1 block">Price</label>
              <input
                type="number"
                step="0.01"
                bind:value={newProduct.price}
                class="input"
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <!-- svelte-ignore a11y_label_has_associated_control -->
              <label class="text-sm text-gray mb-1 block">Initial Stock</label>
              <input
                type="number"
                bind:value={newProduct.stock}
                class="input"
                placeholder="0"
                required
              />
            </div>
          </div>
          
          <div>
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="text-sm text-gray mb-1 block">Minimum Stock Alert</label>
            <input
              type="number"
              bind:value={newProduct.minStock}
              class="input"
              placeholder="5"
              required
            />
          </div>
          
          <div class="flex gap-2 mt-4">
            <button type="button" class="btn btn-secondary flex-1" on:click={() => showAddModal = false}>
              Cancel
            </button>
            <button type="submit" class="btn btn-primary flex-1">
              Add Product
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  .grid { display: grid; }
  .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .w-full { width: 100%; }
  .overflow-x-auto { overflow-x: auto; }
  table th { font-weight: 600; color: var(--gray-700); }
  .flex-1 { flex: 1; }
  .hover\:bg-gray-50:hover { background-color: var(--gray-50); }
  
  @media (min-width: 1024px) {
    .lg-grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
  }
</style>