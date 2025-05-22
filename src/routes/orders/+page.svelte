<!-- Enhanced Orders Page -->
<script>
// @ts-nocheck

  import { onMount } from 'svelte';
  import { user, logout } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import { 
    Receipt, 
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
    Filter,
    ArrowLeft,
    TrendingUp,
    ShoppingBag,
    CreditCard
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

  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

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

  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

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
<div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  <!-- Enhanced Header -->
  <header class="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-40">
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo & Navigation -->
        <div class="flex items-center space-x-6">
          <a href="/" class="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors btn-hover-scale">
            <ArrowLeft class="w-5 h-5" />
            <span class="font-medium">Back to POS</span>
          </a>
          
          <div class="w-px h-6 bg-gray-300"></div>
          
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
              <Receipt class="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900">Order History</h1>
              <p class="text-sm text-gray-600">Transaction history and analytics</p>
            </div>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex items-center space-x-4">
          <a href="/inventory" class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
            <Package class="w-4 h-4" />
            <span>Inventory</span>
          </a>
          
          <button class="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors" on:click={handleLogout}>
            <LogOut class="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  </header>

  <div class="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Enhanced Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Today's Revenue</p>
            <p class="text-3xl font-bold text-green-600">{formatCurrency(todaysRevenue)}</p>
            <p class="text-sm text-green-600 mt-1">+12% from yesterday</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <DollarSign class="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Today's Orders</p>
            <p class="text-3xl font-bold text-blue-600">{todaysOrders.length}</p>
            <p class="text-sm text-blue-600 mt-1">+5 from yesterday</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <ShoppingBag class="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Total Orders</p>
            <p class="text-3xl font-bold text-purple-600">{totalOrders}</p>
            <p class="text-sm text-purple-600 mt-1">All time</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <Receipt class="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">Avg Order Value</p>
            <p class="text-3xl font-bold text-orange-600">{formatCurrency(avgOrderValue)}</p>
            <p class="text-sm text-orange-600 mt-1">+8% this month</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <TrendingUp class="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Controls -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-hover">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <!-- Search -->
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search order ID..."
              class="w-full sm:w-64 pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              bind:value={searchTerm}
            />
          </div>
          
          <!-- Status Filter -->
          <select class="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white" bind:value={selectedStatus}>
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <!-- Date Filter -->
          <input
            type="date"
            class="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50 focus:bg-white"
            bind:value={selectedDate}
          />
        </div>
        
        <button class="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-medium btn-hover-scale" on:click={exportOrders}>
          <Download class="w-4 h-4" />
          <span>Export Orders</span>
        </button>
      </div>
    </div>

    <!-- Enhanced Orders List -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-hover">
      <div class="bg-gray-50 px-6 py-5 border-b border-gray-200">
        <h3 class="text-xl font-bold text-gray-900">Recent Orders</h3>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Order ID</th>
              <th class="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Date & Time</th>
              <th class="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Items</th>
              <th class="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Total</th>
              <th class="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Payment</th>
              <th class="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Status</th>
              <th class="text-left py-4 px-6 font-semibold text-gray-900 text-sm">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            {#each filteredOrders as order}
              <tr class="hover:bg-gray-50 transition-colors">
                <td class="py-4 px-6">
                  <div class="font-semibold text-gray-900">{order.id}</div>
                </td>
                <td class="py-4 px-6">
                  <div class="text-gray-900 font-medium">{formatDate(order.date)}</div>
                  <div class="text-sm text-gray-500">{formatTime(order.date)}</div>
                </td>
                <td class="py-4 px-6">
                  <div class="text-gray-900 font-medium">{order.items.length} items</div>
                  <div class="text-sm text-gray-500">
                    {order.items.map(item => `${item.quantity}x ${item.name}`).slice(0, 2).join(', ')}
                    {#if order.items.length > 2}
                      <span class="text-gray-400">+ {order.items.length - 2} more</span>
                    {/if}
                  </div>
                </td>
                <td class="py-4 px-6">
                  <div class="font-bold text-gray-900 text-lg">{formatCurrency(order.total)}</div>
                  <div class="text-sm text-gray-500">
                    Sub: {formatCurrency(order.subtotal)} + Tax: {formatCurrency(order.tax)}
                  </div>
                </td>
                <td class="py-4 px-6">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize {order.paymentMethod === 'cash' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}">
                    {#if order.paymentMethod === 'cash'}
                      💵 Cash
                    {:else}
                      💳 Card
                    {/if}
                  </span>
                </td>
                <td class="py-4 px-6">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize {order.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-red-100 text-red-800 border border-red-200'}">
                    {#if order.status === 'completed'}
                      ✓ Completed
                    {:else if order.status === 'pending'}
                      ⏳ Pending
                    {:else}
                      ✗ Cancelled
                    {/if}
                  </span>
                </td>
                <td class="py-4 px-6">
                  <button 
                    class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors btn-hover-scale"
                    on:click={() => viewOrderDetails(order)}
                    title="View Details"
                  >
                    <Eye class="w-5 h-5" />
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
        
        {#if filteredOrders.length === 0}
          <div class="text-center py-16">
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt class="w-8 h-8 text-gray-400" />
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p class="text-gray-500 mb-4">Try adjusting your search or filters</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Enhanced Order Details Modal -->
{#if showOrderDetails && selectedOrder}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 modal-overlay">
    <div class="bg-white rounded-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto modal-content shadow-2xl">
      <div class="flex justify-between items-center mb-8">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <Receipt class="w-6 h-6 text-white" />
          </div>
          <h3 class="text-2xl font-bold text-gray-900">Order Details</h3>
        </div>
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button on:click={closeOrderDetails} class="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors btn-hover-scale">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- Order Header -->
      <div class="mb-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h4 class="text-xl font-bold text-gray-900">{selectedOrder.id}</h4>
            <p class="text-gray-600 mt-1">{formatDateTime(selectedOrder.date)}</p>
          </div>
          <span class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium capitalize {selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' : selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-red-100 text-red-800 border border-red-200'}">
            {#if selectedOrder.status === 'completed'}
              ✓ Completed
            {:else if selectedOrder.status === 'pending'}
              ⏳ Pending
            {:else}
              ✗ Cancelled
            {/if}
          </span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">Payment Method:</span>
          <span class="font-medium capitalize flex items-center space-x-1">
            {#if selectedOrder.paymentMethod === 'cash'}
              <span>💵</span>
              <span>Cash</span>
            {:else}
              <span>💳</span>
              <span>Card</span>
            {/if}
          </span>
        </div>
      </div>
      
      <!-- Order Items -->
      <div class="mb-8">
        <h5 class="font-bold text-gray-900 mb-4 text-lg">Order Items</h5>
        <div class="space-y-3">
          {#each selectedOrder.items as item}
            <div class="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
              <div class="flex-1">
                <span class="text-gray-900 font-medium">{item.name}</span>
                <span class="text-gray-500 ml-2">×{item.quantity}</span>
              </div>
              <div class="text-right">
                <div class="text-gray-900 font-bold">{formatCurrency(item.price * item.quantity)}</div>
                <div class="text-xs text-gray-500">{formatCurrency(item.price)} each</div>
              </div>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Order Total -->
      <div class="border-t pt-6 mb-8">
        <div class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Subtotal:</span>
            <span class="text-gray-900 font-medium">{formatCurrency(selectedOrder.subtotal)}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Tax (8%):</span>
            <span class="text-gray-900 font-medium">{formatCurrency(selectedOrder.tax)}</span>
          </div>
          <div class="flex justify-between text-xl font-bold border-t pt-3">
            <span class="text-gray-900">Total:</span>
            <span class="text-orange-600">{formatCurrency(selectedOrder.total)}</span>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex justify-end space-x-4 pt-6 border-t">
        <button class="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium btn-hover-scale" on:click={closeOrderDetails}>
          Close
        </button>
        <button class="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-colors font-medium btn-hover-scale">
          <Download class="w-4 h-4" />
          <span>Print Receipt</span>
        </button>
      </div>
    </div>
  </div>
{/if}
{/if}