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

// Check if db is initialized
function checkDb() {
  if (!db) {
    console.error('Firestore database not initialized');
    throw new Error('Database not initialized. Check your Firebase configuration.');
  }
}

// ==================== PRODUCTS ====================

export const productsService = {
  // Get all products
  async getAll() {
    try {
      checkDb();
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
  async getByCategory(category) {
    try {
      checkDb();
      const q = query(
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
      checkDb();
      const q = query(
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
  async add(product) {
    try {
      checkDb();
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
  async update(id, updates) {
    try {
      checkDb();
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
  async delete(id) {
    try {
      checkDb();
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Listen to products changes (real-time)
  listen(callback) {
    checkDb();
    const q = query(collection(db, 'products'), orderBy('name'));
    return onSnapshot(q, 
      (snapshot) => {
        const products = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(products);
      },
      (error) => {
        console.error('Error in products listener:', error);
        callback([]);
      }
    );
  }
};

// ==================== ORDERS ====================

export const ordersService = {
  // Create new order with transaction
  async create(orderData, cartItems) {
    try {
      checkDb();
      
      console.log('Creating order with data:', orderData);
      console.log('Cart items:', cartItems);
      
      const result = await runTransaction(db, async (transaction) => {
        // PHASE 1: ALL READS FIRST
        const productDocs = [];
        
        // Read all products first
        for (const item of cartItems) {
          const productRef = doc(db, 'products', item.id);
          const productDoc = await transaction.get(productRef);
          
          if (!productDoc.exists()) {
            throw new Error(`Product ${item.name} not found`);
          }
          
          const productData = productDoc.data();
          if (productData.stock < item.quantity) {
            throw new Error(`Not enough stock for ${item.name}. Available: ${productData.stock}, Requested: ${item.quantity}`);
          }
          
          productDocs.push({
            ref: productRef,
            data: productData,
            item: item
          });
        }
        
        // PHASE 2: ALL WRITES AFTER ALL READS
        
        // Create order document
        const orderRef = doc(collection(db, 'orders'));
        const orderDoc = {
          ...orderData,
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
        
        console.log('Setting order document:', orderDoc);
        transaction.set(orderRef, orderDoc);

        // Update all product stocks and create inventory logs
        for (const { ref, data, item } of productDocs) {
          // Update product stock
          console.log(`Updating stock for ${item.name}: ${data.stock} -> ${data.stock - item.quantity}`);
          transaction.update(ref, {
            stock: increment(-item.quantity),
            updatedAt: serverTimestamp()
          });

          // Create inventory log
          const inventoryLogRef = doc(collection(db, 'inventory-logs'));
          transaction.set(inventoryLogRef, {
            productId: item.id,
            productName: item.name,
            previousStock: data.stock,
            newStock: data.stock - item.quantity,
            changeQuantity: -item.quantity,
            changeReason: 'sale',
            orderId: orderRef.id,
            createdAt: serverTimestamp()
          });
        }

        return orderRef.id;
      });

      console.log('Order created successfully with ID:', result);
      return result;
    } catch (error) {
      console.error('Error creating order:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  },

  // Get order history
  async getHistory(limitCount = 50) {
    try {
      checkDb();
      const q = query(
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
      // Return empty array instead of throwing
      return [];
    }
  },

  // Get orders by date range
  async getByDateRange(startDate, endDate) {
    try {
      checkDb();
      const q = query(
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
  async updateStock(productId, newStock, reason = 'manual_adjustment') {
    try {
      checkDb();
      return await runTransaction(db, async (transaction) => {
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
      checkDb();
      const q = query(
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
      // Return empty array instead of throwing
      return [];
    }
  },

  // Bulk update stock
  async bulkUpdateStock(updates) {
    try {
      checkDb();
      const batch = writeBatch(db);
      
      for (const update of updates) {
        const productRef = doc(db, 'products', update.productId);
        batch.update(productRef, {
          stock: update.newStock,
          updatedAt: serverTimestamp()
        });

        // Add inventory log
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
      checkDb();
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
  async add(category) {
    try {
      checkDb();
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