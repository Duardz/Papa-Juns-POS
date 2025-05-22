// @ts-nocheck
// lib/services/firestore.js
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '../firebase.js';

// ==================== PRODUCTS ====================

export const productsService = {
  // Get all products
  async getAll() {
    try {
      // @ts-ignore
      const q = query(collection(db, 'products'), orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get products by category
  // @ts-ignore
  async getByCategory(category) {
    try {
      const q = query(
        // @ts-ignore
        collection(db, 'products'), 
        where('category', '==', category),
        orderBy('name')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw error;
    }
  },

  // Get low stock products
  async getLowStock() {
    try {
      const q = query(
        // @ts-ignore
        collection(db, 'products'),
        where('stock', '<=', 'minStock'),
        orderBy('stock')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw error;
    }
  },

  // Add new product
  // @ts-ignore
  async add(product) {
    try {
      // @ts-ignore
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },

  // Update product
  // @ts-ignore
  async update(id, updates) {
    try {
      // @ts-ignore
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete product
  // @ts-ignore
  async delete(id) {
    try {
      // @ts-ignore
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Listen to products changes (real-time)
  // @ts-ignore
  listen(callback) {
    // @ts-ignore
    const q = query(collection(db, 'products'), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(products);
    });
  }
};

// ==================== ORDERS ====================

export const ordersService = {
  // Create new order with transaction
  // @ts-ignore
  async create(orderData, cartItems) {
    try {
      // @ts-ignore
      const result = await runTransaction(db, async (transaction) => {
        // Create order document
        // @ts-ignore
        const orderRef = doc(collection(db, 'orders'));
        const orderDoc = {
          ...orderData,
          // @ts-ignore
          items: cartItems.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity
          })),
          createdAt: serverTimestamp(),
          status: 'completed'
        };
        
        transaction.set(orderRef, orderDoc);

        // Update product stock
        for (const item of cartItems) {
          // @ts-ignore
          const productRef = doc(db, 'products', item.id);
          const productDoc = await transaction.get(productRef);
          
          if (!productDoc.exists()) {
            throw new Error(`Product ${item.name} not found`);
          }
          
          const currentStock = productDoc.data().stock;
          if (currentStock < item.quantity) {
            throw new Error(`Not enough stock for ${item.name}`);
          }
          
          transaction.update(productRef, {
            stock: increment(-item.quantity),
            updatedAt: serverTimestamp()
          });

          // Create inventory log
          // @ts-ignore
          const inventoryLogRef = doc(collection(db, 'inventory-logs'));
          transaction.set(inventoryLogRef, {
            productId: item.id,
            productName: item.name,
            previousStock: currentStock,
            newStock: currentStock - item.quantity,
            changeQuantity: -item.quantity,
            changeReason: 'sale',
            orderId: orderRef.id,
            createdAt: serverTimestamp()
          });
        }

        return orderRef.id;
      });

      return result;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Get order history
  async getHistory(limitCount = 50) {
    try {
      const q = query(
        // @ts-ignore
        collection(db, 'orders'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching order history:', error);
      throw error;
    }
  },

  // Get orders by date range
  // @ts-ignore
  async getByDateRange(startDate, endDate) {
    try {
      const q = query(
        // @ts-ignore
        collection(db, 'orders'),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching orders by date range:', error);
      throw error;
    }
  }
};

// ==================== INVENTORY ====================

export const inventoryService = {
  // Update stock manually
  // @ts-ignore
  async updateStock(productId, newStock, reason = 'manual_adjustment') {
    try {
      // @ts-ignore
      return await runTransaction(db, async (transaction) => {
        // @ts-ignore
        const productRef = doc(db, 'products', productId);
        const productDoc = await transaction.get(productRef);
        
        if (!productDoc.exists()) {
          throw new Error('Product not found');
        }
        
        const currentStock = productDoc.data().stock;
        const productName = productDoc.data().name;
        
        // Update product stock
        transaction.update(productRef, {
          stock: newStock,
          updatedAt: serverTimestamp()
        });

        // Create inventory log
        // @ts-ignore
        const inventoryLogRef = doc(collection(db, 'inventory-logs'));
        transaction.set(inventoryLogRef, {
          productId,
          productName,
          previousStock: currentStock,
          newStock,
          changeQuantity: newStock - currentStock,
          changeReason: reason,
          createdAt: serverTimestamp()
        });

        return newStock;
      });
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  },

  // Get inventory logs
  async getLogs(limitCount = 100) {
    try {
      const q = query(
        // @ts-ignore
        collection(db, 'inventory-logs'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching inventory logs:', error);
      throw error;
    }
  },

  // Bulk update stock
  // @ts-ignore
  async bulkUpdateStock(updates) {
    try {
      // @ts-ignore
      const batch = writeBatch(db);
      
      for (const update of updates) {
        // @ts-ignore
        const productRef = doc(db, 'products', update.productId);
        batch.update(productRef, {
          stock: update.newStock,
          updatedAt: serverTimestamp()
        });

        // Add inventory log
        // @ts-ignore
        const inventoryLogRef = doc(collection(db, 'inventory-logs'));
        batch.set(inventoryLogRef, {
          productId: update.productId,
          productName: update.productName,
          previousStock: update.previousStock,
          newStock: update.newStock,
          changeQuantity: update.newStock - update.previousStock,
          changeReason: update.reason || 'bulk_update',
          createdAt: serverTimestamp()
        });
      }

      await batch.commit();
    } catch (error) {
      console.error('Error bulk updating stock:', error);
      throw error;
    }
  }
};

// ==================== CATEGORIES ====================

export const categoriesService = {
  // Get all categories
  async getAll() {
    try {
      // @ts-ignore
      const q = query(collection(db, 'categories'), orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Add new category
  // @ts-ignore
  async add(category) {
    try {
      // @ts-ignore
      const docRef = await addDoc(collection(db, 'categories'), {
        ...category,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }
};