import { writable } from 'svelte/store';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase.js';
import { browser } from '$app/environment';

// Create the user store
export const user = writable(null);
export const loading = writable(true);
export const error = writable(null);

// Initialize auth state listener
if (browser && auth) {
  onAuthStateChanged(auth, (firebaseUser) => {
    // @ts-ignore
    user.set(firebaseUser);
    loading.set(false);
  });
}

// Login function
// @ts-ignore
export async function login(email, password) {
  try {
    loading.set(true);
    error.set(null);
    
    // @ts-ignore
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // @ts-ignore
    user.set(userCredential.user);
    
    return userCredential.user;
  } catch (err) {
    // @ts-ignore
    error.set(err.message);
    throw err;
  } finally {
    loading.set(false);
  }
}

// Register function
// @ts-ignore
export async function register(email, password) {
  try {
    loading.set(true);
    error.set(null);
    
    // @ts-ignore
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // @ts-ignore
    user.set(userCredential.user);
    
    return userCredential.user;
  } catch (err) {
    // @ts-ignore
    error.set(err.message);
    throw err;
  } finally {
    loading.set(false);
  }
}

// Logout function
export async function logout() {
  try {
    // @ts-ignore
    await signOut(auth);
    user.set(null);
  } catch (err) {
    // @ts-ignore
    error.set(err.message);
    throw err;
  }
}