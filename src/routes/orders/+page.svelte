<script>
// @ts-nocheck

  import { onMount } from 'svelte';
  import { user, logout } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { 
    Receipt, 
    // @ts-ignore
    Calendar, 
    DollarSign,
    Clock,
    ChefHat,
    Store,
    Package,
    LogOut,
    Search,
    Download,
    Eye,
    // @ts-ignore
    Filter
  } from 'lucide-svelte';

  // Sample order data
  let orders = [
    {
      id: 'ORD-001',
      date: new Date('2024-01-15T14:30:00'),
      items: [
        { name: 'Chicken Thigh', quantity: 2, price: 2.50 },
        { name: 'Regular Fries', quantity: 1, price: 2.00 },
        { name: 'Coca Cola', quantity: 1, price: 1.50 }
      ],
      subtotal: 8.50,
      tax: 0.68,
      total: 9.18,
      status: 'completed',
      paymentMethod: 'cash'
    },
    {
      id: 'ORD-002',
      date: new Date('2024-01-15T15:45:00'),
      items: [
        { name: 'Whole Chicken', quantity: 1, price: 12.00 },
        { name: 'Large Fries', quantity: 2, price: 3.00 },
        { name: 'Sprite', quantity: 2, price: 1.50 }
      ],
      subtotal: 21.00,
      tax: 1.68,
      total: 22.68,
      status: 'completed',
      paymentMethod: 'card'
    },
    {
      id: 'ORD-003',
      date: new Date('2024-01-15T16:20:00'),
      items: [
        { name: 'Chicken Wing', quantity: 8, price: 1.75 },
        { name: 'Seasoned Fries', quantity: 1, price: 3.50 },
        { name: 'Water', quantity: 2, price: 1.00 }
      ],
      subtotal: 19.50,
      tax: 1.56,
      total: 21.06,
      status: 'completed',
      paymentMethod: 'cash'
    },
    {
      id: 'ORD-004',
      date: new Date('2024-01-14T12:15:00'),
      items: [
        { name: 'Chicken Breast', quantity: 3, price: 3.00 },
        { name: 'Regular Fries', quantity: 2, price: 2.00 },
        { name: 'Orange Juice', quantity: 1, price: 2.00 }
      ],
      subtotal: 15.00,
      tax: 1.20,
      total: 16.20,
      status: 'completed',
      paymentMethod: 'card'
    },
    {
      id: 'ORD-005',
      date: new Date('2024-01-14T18:30:00'),
      items: [
        { name: 'Chicken Drumstick', quantity: 4, price: 2.25 },
        { name: 'Large Fries', quantity: 1, price: 3.00 },
        { name: 'Coca Cola', quantity: 2, price: 1.50 }
      ],
      subtotal: 15.00,
      tax: 1.20,
      total: 16.20,
      status: 'completed',
      paymentMethod: 'cash'
    }
  ];

  let searchTerm = '';
  let selectedStatus = 'all';
  let selectedDate = '';
  // @ts-ignore
  let selectedOrder = null;
  let showOrderDetails = false;

  // Reactive calculations
  $: filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesDate = !selectedDate || formatDate(order.date) === selectedDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  $: todaysOrders = orders.filter(order => 
    formatDate(order.date) === formatDate(new Date())
  );

  $: todaysRevenue = todaysOrders.reduce((sum, order) => sum + order.total, 0);
  $: totalOrders = orders.length;
  $: avgOrderValue = orders.length > 0 ? orders.reduce((sum, order) => sum + order.total, 0) / orders.length : 0;

  // Check authentication
  onMount(() => {
    if (!$user) {
      goto('/auth/login');
    }
  });

  // @ts-ignore
  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  // @ts-ignore
  function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  // @ts-ignore
  function formatDateTime(date) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // @ts-ignore
  function viewOrderDetails(order) {
    selectedOrder = order;
    showOrderDetails = true;
  }

  function closeOrderDetails() {
    showOrderDetails = false;
    selectedOrder = null;
  }

  function exportOrders() {
    // In real app, this would generate and download a CSV/PDF report
    alert('Order export functionality will be implemented with real data integration');
  }

  async function handleLogout() {
    await logout();
    goto('/auth/login');
  }
</script>

<svelte:head>
  <title>Order History - Papa Jun's</title>
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
            <h1 class="text-xl font-bold text-gray-900">Order History</h1>
            <p class="text-sm text-gray-600">Transaction history and analytics</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-4">
          <a href="/pos" class="btn btn-secondary">
            <Store class="w-4 h-4" />
            POS System
          </a>
          
          <a href="/inventory" class="btn btn-secondary">
            <Package class="w-4 h-4" />
            Inventory
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
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Today's Revenue</p>
            <p class="text-2xl font-bold text-green-600">${todaysRevenue.toFixed(2)}</p>
          </div>
          <DollarSign class="w-8 h-8 text-green-500" />
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Today's Orders</p>
            <p class="text-2xl font-bold text-blue-600">{todaysOrders.length}</p>
          </div>
          <Receipt class="w-8 h-8 text-blue-500" />
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Orders</p>
            <p class="text-2xl font-bold text-purple-600">{totalOrders}</p>
          </div>
          <Clock class="w-8 h-8 text-purple-500" />
        </div>
      </div>
      
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Avg Order Value</p>
            <p class="text-2xl font-bold text-orange-600">${avgOrderValue.toFixed(2)}</p>
          </div>
          <Receipt class="w-8 h-8 text-orange-500" />
        </div>
      </div>
    </div>

    <!-- Controls -->
    <div class="card mb-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <!-- Search -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search order ID..."
              class="input pl-10 w-full sm:w-64"
              bind:value={searchTerm}
            />
          </div>
          
          <!-- Status Filter -->
          <select class="input w-full sm:w-auto" bind:value={selectedStatus}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <!-- Date Filter -->
          <input
            type="date"
            class="input w-full sm:w-auto"
            bind:value={selectedDate}
          />
        </div>
        
        <button class="btn btn-primary" on:click={exportOrders}>
          <Download class="w-4 h-4" />
          Export Orders
        </button>
      </div>
    </div>

    <!-- Orders Table -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="text-left py-3 px-4 font-semibold text-gray-900">Order ID</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-900">Date & Time</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-900">Items</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-900">Total</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-900">Payment</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
              <th class="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each filteredOrders as order}
              <tr class="border-b hover:bg-gray-50">
                <td class="py-3 px-4">
                  <div class="font-medium text-gray-900">{order.id}</div>
                </td>
                <td class="py-3 px-4">
                  <div class="text-gray-900">{formatDate(order.date)}</div>
                  <div class="text-sm text-gray-500">{formatTime(order.date)}</div>
                </td>
                <td class="py-3 px-4">
                  <div class="text-gray-900">{order.items.length} items</div>
                  <div class="text-sm text-gray-500">
                    {order.items.map(item => `${item.quantity}x ${item.name}`).slice(0, 2).join(', ')}
                    {#if order.items.length > 2}
                      <span class="text-gray-400">+ {order.items.length - 2} more</span>
                    {/if}
                  </div>
                </td>
                <td class="py-3 px-4">
                  <div class="font-medium text-gray-900">${order.total.toFixed(2)}</div>
                  <div class="text-sm text-gray-500">
                    Sub: ${order.subtotal.toFixed(2)} + Tax: ${order.tax.toFixed(2)}
                  </div>
                </td>
                <td class="py-3 px-4">
                  <span class="px-2 py-1 text-xs rounded-full capitalize
                    {order.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                    {order.paymentMethod}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <span class="px-2 py-1 text-xs rounded-full capitalize
                    {order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                     order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                     'bg-red-100 text-red-800'}">
                    {order.status}
                  </span>
                </td>
                <td class="py-3 px-4">
                  <button 
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    on:click={() => viewOrderDetails(order)}
                  >
                    <Eye class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        
        {#if filteredOrders.length === 0}
          <div class="text-center py-12 text-gray-500">
            <Receipt class="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No orders found</p>
            <p class="text-sm">Try adjusting your search or filters</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Order Details Modal -->
{#if showOrderDetails && selectedOrder}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-bold text-gray-900">Order Details</h3>
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button on:click={closeOrderDetails} class="text-gray-400 hover:text-gray-600">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- Order Header -->
      <div class="mb-6 p-4 bg-gray-50 rounded-lg">
        <div class="flex justify-between items-start mb-2">
          <div>
            <h4 class="font-semibold text-gray-900">{selectedOrder.id}</h4>
            <p class="text-sm text-gray-600">{formatDateTime(selectedOrder.date)}</p>
          </div>
          <span class="px-3 py-1 text-sm rounded-full capitalize
            {selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' : 
             selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
             'bg-red-100 text-red-800'}">
            {selectedOrder.status}
          </span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Payment Method:</span>
          <span class="font-medium capitalize">{selectedOrder.paymentMethod}</span>
        </div>
      </div>
      
      <!-- Order Items -->
      <div class="mb-6">
        <h5 class="font-semibold text-gray-900 mb-3">Order Items</h5>
        <div class="space-y-2">
          {#each selectedOrder.items as item}
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
              <div class="flex-1">
                <span class="text-gray-900">{item.name}</span>
                <span class="text-sm text-gray-500 ml-2">×{item.quantity}</span>
              </div>
              <div class="text-right">
                <div class="text-gray-900">${(item.price * item.quantity).toFixed(2)}</div>
                <div class="text-xs text-gray-500">${item.price.toFixed(2)} each</div>
              </div>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Order Total -->
      <div class="border-t pt-4">
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Subtotal:</span>
            <span class="text-gray-900">${selectedOrder.subtotal.toFixed(2)}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Tax (8%):</span>
            <span class="text-gray-900">${selectedOrder.tax.toFixed(2)}</span>
          </div>
          <div class="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span>${selectedOrder.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex justify-end space-x-3 mt-6 pt-4 border-t">
        <button class="btn btn-secondary" on:click={closeOrderDetails}>
          Close
        </button>
        <button class="btn btn-primary">
          <Download class="w-4 h-4" />
          Print Receipt
        </button>
      </div>
    </div>
  </div>
{/if}
{/if}