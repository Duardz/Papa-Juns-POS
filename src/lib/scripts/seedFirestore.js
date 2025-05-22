// scripts/seedFirestore.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data for Papa Jun's Fried Chicken
const sampleProducts = [
  // Chicken Items
  {
    name: 'Chicken Thigh',
    category: 'chicken',
    price: 2.50,
    stock: 25,
    minStock: 10,
    image: '🍗'
  },
  {
    name: 'Chicken Breast',
    category: 'chicken', 
    price: 3.00,
    stock: 20,
    minStock: 15,
    image: '🍗'
  },
  {
    name: 'Chicken Wing',
    category: 'chicken',
    price: 1.75,
    stock: 5,
    minStock: 20,
    image: '🍗'
  },
  {
    name: 'Chicken Drumstick',
    category: 'chicken',
    price: 2.25,
    stock: 22,
    minStock: 15,
    image: '🍗'
  },
  {
    name: 'Whole Chicken',
    category: 'chicken',
    price: 12.00,
    stock: 3,
    minStock: 5,
    image: '🍗'
  },
  {
    name: 'Chicken Tender',
    category: 'chicken',
    price: 1.50,
    stock: 30,
    minStock: 20,
    image: '🍗'
  },
  {
    name: 'Buffalo Wings',
    category: 'chicken',
    price: 8.99,
    stock: 15,
    minStock: 10,
    image: '🍗'
  },

  // Fries & Sides
  {
    name: 'Regular Fries',
    category: 'fries',
    price: 2.00,
    stock: 50,
    minStock: 25,
    image: '🍟'
  },
  {
    name: 'Large Fries',
    category: 'fries',
    price: 3.00,
    stock: 40,
    minStock: 20,
    image: '🍟'
  },
  {
    name: 'Seasoned Fries',
    category: 'fries',
    price: 3.50,
    stock: 8,
    minStock: 15,
    image: '🍟'
  },
  {
    name: 'Sweet Potato Fries',
    category: 'fries',
    price: 4.00,
    stock: 12,
    minStock: 10,
    image: '🍟'
  },
  {
    name: 'Onion Rings',
    category: 'sides',
    price: 3.50,
    stock: 20,
    minStock: 15,
    image: '🧅'
  },
  {
    name: 'Coleslaw',
    category: 'sides',
    price: 2.50,
    stock: 25,
    minStock: 12,
    image: '🥗'
  },
  {
    name: 'Mac & Cheese',
    category: 'sides',
    price: 4.50,
    stock: 18,
    minStock: 10,
    image: '🧀'
  },

  // Drinks
  {
    name: 'Coca Cola',
    category: 'drinks',
    price: 1.50,
    stock: 60,
    minStock: 30,
    image: '🥤'
  },
  {
    name: 'Sprite',
    category: 'drinks',
    price: 1.50,
    stock: 45,
    minStock: 30,
    image: '🥤'
  },
  {
    name: 'Orange Juice',
    category: 'drinks',
    price: 2.00,
    stock: 30,
    minStock: 20,
    image: '🧃'
  },
  {
    name: 'Water',
    category: 'drinks',
    price: 1.00,
    stock: 80,
    minStock: 40,
    image: '💧'
  },
  {
    name: 'Iced Tea',
    category: 'drinks',
    price: 1.75,
    stock: 35,
    minStock: 20,
    image: '🥤'
  },
  {
    name: 'Lemonade',
    category: 'drinks',
    price: 2.25,
    stock: 28,
    minStock: 15,
    image: '🍋'
  }
];

const sampleCategories = [
  {
    name: 'Chicken',
    value: 'chicken',
    emoji: '🍗',
    description: 'Fresh fried chicken items'
  },
  {
    name: 'Fries',
    value: 'fries', 
    emoji: '🍟',
    description: 'Crispy potato fries and variations'
  },
  {
    name: 'Sides',
    value: 'sides',
    emoji: '🥗', 
    description: 'Side dishes and accompaniments'
  },
  {
    name: 'Drinks',
    value: 'drinks',
    emoji: '🥤',
    description: 'Beverages and refreshments'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Add categories first
    console.log('📋 Adding categories...');
    for (const category of sampleCategories) {
      await addDoc(collection(db, 'categories'), {
        ...category,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Added category: ${category.name}`);
    }

    // Add products
    console.log('🍗 Adding products...');
    for (const product of sampleProducts) {
      await addDoc(collection(db, 'products'), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Added product: ${product.name}`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Added ${sampleCategories.length} categories and ${sampleProducts.length} products`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase();