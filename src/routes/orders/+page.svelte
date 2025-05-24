<script>
// @ts-nocheck

  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { ordersService } from '$lib/services/firestore.js';
  import { 
    // @ts-ignore
    Receipt, Calendar, DollarSign, ArrowLeft, Eye, X, 
    // @ts-ignore
    TrendingUp, ShoppingBag, Search, Download, Trash2, FileSpreadsheet
  } from 'lucide-svelte';

  // State
  // @ts-ignore
  let orders = [];
  let loading = true;
  let searchQuery = '';
  let selectedDate = '';
  // @ts-ignore
  let selectedOrder = null;
  let showOrderModal = false;
  let showDeleteModal = false;
  let isDeleting = false;

  // Computed
 // @ts-ignore
   $: filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = !selectedDate || formatDate(order.createdAt?.toDate()) === selectedDate;
    return matchesSearch && matchesDate;
  });

 // @ts-ignore
   $: todaysOrders = orders.filter(order => 
    formatDate(order.createdAt?.toDate()) === formatDate(new Date())
  );

  $: todaysRevenue = todaysOrders.reduce((sum, order) => sum + order.total, 0);
 // @ts-ignore
   $: avgOrderValue = orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0;

  onMount(async () => {
    if (!$user) {
      goto('/auth/login');
      return;
    }

    try {
      loading = true;
      orders = await ordersService.getHistory(100);
    } catch (error) {
      console.error('Error loading orders:', error);
      showToast('Failed to load orders', 'error');
    } finally {
      loading = false;
    }
  });

  // @ts-ignore
  function formatDate(date) {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  }

  // @ts-ignore
  function formatDateTime(date) {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // @ts-ignore
  function viewOrder(order) {
    selectedOrder = order;
    showOrderModal = true;
  }

  // Export to CSV function
  function exportToCSV() {
    if (filteredOrders.length === 0) {
      showToast('No orders to export', 'warning');
      return;
    }

    // Prepare CSV headers
    const headers = [
      'Order Number',
      'Date',
      'Time',
      'Items',
      'Item Details',
      'Subtotal',
      'Tax',
      'Total',
      'Payment Method',
      'Status',
      'Cashier'
    ];

    // Prepare CSV rows
    const rows = filteredOrders.map(order => {
      const date = order.createdAt?.toDate() || new Date();
      // @ts-ignore
      const itemDetails = order.items.map(item => 
        `${item.quantity}x ${item.name} (${item.price.toFixed(2)} each)`
      ).join('; ');

      return [
        order.orderNumber,
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        order.itemCount,
        itemDetails,
        order.subtotal.toFixed(2),
        order.tax.toFixed(2),
        order.total.toFixed(2),
        order.paymentMethod,
        order.status,
        order.cashier || 'Unknown'
      ];
    });

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => 
          // Escape quotes and wrap in quotes if contains comma
          typeof cell === 'string' && cell.includes(',') 
            ? `"${cell.replace(/"/g, '""')}"` 
            : cell
        ).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const filename = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', filename);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Exported ${filteredOrders.length} orders to ${filename}`, 'success');
  }

  // Clear order history (in real app, this would delete from Firestore)
  async function clearOrderHistory() {
    isDeleting = true;
    try {
      // In a real app, you would call a service to delete orders from Firestore
      // For now, we'll just clear the local array
      // await ordersService.clearHistory();
      
      // Simulate deletion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      orders = [];
      showDeleteModal = false;
      showToast('Order history cleared successfully', 'success');
    } catch (error) {
      console.error('Error clearing history:', error);
      showToast('Failed to clear order history', 'error');
    } finally {
      isDeleting = false;
    }
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
  <title>Orders - Papa Jun's</title>
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
          <Receipt size={20} />
        </div>
        <span>Order History</span>
      </div>
    </div>
  </div>
</header>

<div class="container" style="padding-top: 2rem; padding-bottom: 2rem;">
  <!-- Stats Cards -->
  <div class="grid grid-cols-2 lg-grid-cols-4 gap-4 mb-4">
    <div class="card">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-2xl font-bold text-success">${todaysRevenue.toFixed(2)}</div>
            <div class="text-sm text-gray">Today's Revenue</div>
          </div>
          <DollarSign class="text-success" size={24} />
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-2xl font-bold text-primary">{todaysOrders.length}</div>
            <div class="text-sm text-gray">Today's Orders</div>
          </div>
          <ShoppingBag class="text-primary" size={24} />
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-2xl font-bold">{orders.length}</div>
            <div class="text-sm text-gray">Total Orders</div>
          </div>
          <Receipt class="text-gray" size={24} />
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-body">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-2xl font-bold text-warning">${avgOrderValue.toFixed(2)}</div>
            <div class="text-sm text-gray">Avg Order Value</div>
          </div>
          <TrendingUp class="text-warning" size={24} />
        </div>
      </div>
    </div>
  </div>

  <!-- Search & Filters -->
  <div class="card mb-4">
    <div class="card-body">
      <div class="flex flex-col gap-3">
        <div class="flex flex-col sm-flex-row gap-3">
          <div class="relative flex-1">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray" size={18} />
            <input
              type="text"
              placeholder="Search order number..."
              bind:value={searchQuery}
              class="input"
              style="padding-left: 2.5rem;"
            />
          </div>
          
          <input
            type="date"
            bind:value={selectedDate}
            class="input"
            style="width: auto;"
          />
        </div>
        
        <!-- Action Buttons -->
        <div class="flex gap-2 flex-wrap">
          <button 
            class="btn btn-primary"
            on:click={exportToCSV}
            disabled={filteredOrders.length === 0}
          >
            <FileSpreadsheet size={18} />
            <span>Export to CSV</span>
          </button>
          
          <button 
            class="btn btn-danger"
            on:click={() => showDeleteModal = true}
            disabled={orders.length === 0}
          >
            <Trash2 size={18} />
            <span>Clear History</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Orders Table -->
  {#if loading}
    <div class="card">
      <div class="card-body text-center">
        <div class="animate-spin text-primary">⏳</div>
        <p class="text-gray mt-2">Loading orders...</p>
      </div>
    </div>
  {:else if filteredOrders.length === 0}
    <div class="card">
      <div class="card-body text-center">
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <p class="empty-state-text">No orders found</p>
        </div>
      </div>
    </div>
  {:else}
    <div class="card">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left p-3">Order #</th>
              <th class="text-left p-3">Date & Time</th>
              <th class="text-left p-3">Items</th>
              <th class="text-left p-3">Total</th>
              <th class="text-left p-3">Payment</th>
              <th class="text-left p-3">Status</th>
              <th class="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredOrders as order}
              <tr class="border-b hover:bg-gray-50">
                <td class="p-3 font-medium">{order.orderNumber}</td>
                
                <td class="p-3">
                  <div class="text-sm">
                    {formatDateTime(order.createdAt?.toDate())}
                  </div>
                </td>
                
                <td class="p-3">
                  <div class="text-sm">
                    <span class="font-medium">{order.itemCount} items</span>
                    <div class="text-gray text-xs">
                      {order.items.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      {#if order.items.length > 2}
                        <span>+{order.items.length - 2} more</span>
                      {/if}
                    </div>
                  </div>
                </td>
                
                <td class="p-3">
                  <div class="font-bold">${order.total.toFixed(2)}</div>
                  <div class="text-xs text-gray">Tax: ${order.tax.toFixed(2)}</div>
                </td>
                
                <td class="p-3">
                  <span class="badge {order.paymentMethod === 'cash' ? 'badge-success' : 'badge-info'}">
                    {order.paymentMethod === 'cash' ? '💵' : '💳'} {order.paymentMethod}
                  </span>
                </td>
                
                <td class="p-3">
                  <span class="badge badge-success">
                    ✓ {order.status}
                  </span>
                </td>
                
                <td class="p-3">
                  <button 
                    class="btn btn-sm btn-ghost"
                    on:click={() => viewOrder(order)}
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>

<!-- Order Details Modal -->
{#if showOrderModal && selectedOrder}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" on:click={() => showOrderModal = false}>
    <div class="modal-content" on:click|stopPropagation style="max-width: 500px;">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Order Details</h2>
          <button class="btn btn-icon btn-ghost" on:click={() => showOrderModal = false}>
            <X size={20} />
          </button>
        </div>
        
        <!-- Order Info -->
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
          <div class="flex justify-between items-start mb-2">
            <div>
              <h3 class="font-bold text-lg">{selectedOrder.orderNumber}</h3>
              <p class="text-sm text-gray">{formatDateTime(selectedOrder.createdAt?.toDate())}</p>
            </div>
            <span class="badge badge-success">✓ {selectedOrder.status}</span>
          </div>
          <div class="text-sm text-gray">
            Payment: <span class="font-medium">{selectedOrder.paymentMethod}</span>
          </div>
        </div>
        
        <!-- Order Items -->
        <div class="mb-4">
          <h4 class="font-bold mb-2">Items</h4>
          <div class="space-y-2">
            {#each selectedOrder.items as item}
              <div class="flex justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span class="font-medium">{item.name}</span>
                  <span class="text-gray ml-2">×{item.quantity}</span>
                </div>
                <div class="text-right">
                  <div class="font-medium">${item.total.toFixed(2)}</div>
                  <div class="text-xs text-gray">${item.price.toFixed(2)} each</div>
                </div>
              </div>
            {/each}
          </div>
        </div>
        
        <!-- Order Total -->
        <div class="border-t pt-4">
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${selectedOrder.subtotal.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span>Tax (8%)</span>
              <span>${selectedOrder.tax.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span class="text-primary">${selectedOrder.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <button 
          class="btn btn-secondary w-full mt-4"
          on:click={() => showOrderModal = false}
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-overlay" on:click={() => showDeleteModal = false}>
    <div class="modal-content" on:click|stopPropagation style="max-width: 400px;">
      <div class="card-body">
        <div class="text-center mb-4">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={32} class="text-danger" />
          </div>
          <h2 class="text-xl font-bold">Delete Order History?</h2>
          <p class="text-gray mt-2">
            This will permanently delete all {orders.length} orders from the history. 
            This action cannot be undone.
          </p>
        </div>
        
        <div class="flex gap-2">
          <button 
            class="btn btn-secondary flex-1"
            on:click={() => showDeleteModal = false}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button 
            class="btn btn-danger flex-1"
            on:click={clearOrderHistory}
            disabled={isDeleting}
          >
            {#if isDeleting}
              <span class="animate-spin">⏳</span>
              <span>Deleting...</span>
            {:else}
              <Trash2 size={18} />
              <span>Delete All</span>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .grid { display: grid; }
  .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .w-full { width: 100%; }
  .overflow-x-auto { overflow-x: auto; }
  .space-y-2 > * + * { margin-top: 0.5rem; }
  table th { font-weight: 600; color: var(--gray-700); }
  .hover\:bg-gray-50:hover { background-color: var(--gray-50); }
  .flex-1 { flex: 1; }
  .-translate-y-1\/2 { transform: translateY(-50%); }
  .rounded-lg { border-radius: var(--radius-lg); }
  .rounded { border-radius: var(--radius-md); }
  .rounded-full { border-radius: var(--radius-full); }
  .border-b { border-bottom: 1px solid var(--gray-200); }
  .border-t { border-top: 1px solid var(--gray-200); }
  .bg-gray-50 { background-color: var(--gray-50); }
  .bg-red-100 { background-color: #fee2e2; }
  
  @media (min-width: 640px) {
    .sm-flex-row { flex-direction: row; }
  }
  
  @media (min-width: 1024px) {
    .lg-grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
  }
</style>