// @ts-nocheck
import { writable } from 'svelte/store';
import { auth } from '$lib/firebase.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { browser } from '$app/environment';

// Create stores
export const user = writable(null);
export const loading = writable(true);
export const error = writable(null);

// Initialize auth state listener
if (browser && auth) {
  onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      // @ts-ignore
      user.set({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName
      });
    } else {
      user.set(null);
    }
    loading.set(false);
  });
}

// Login function
// @ts-ignore
export async function login(email, password) {
  error.set(null);
  try {
    // @ts-ignore
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (err) {
    // @ts-ignore
    const errorMessage = getErrorMessage(err.code);
    // @ts-ignore
    error.set(errorMessage);
    throw err;
  }
}

// Logout function
export async function logout() {
  try {
    // @ts-ignore
    await signOut(auth);
    user.set(null);
  } catch (err) {
    console.error('Logout error:', err);
    throw err;
  }
}

// Helper function for user-friendly error messages
// @ts-ignore
function getErrorMessage(code) {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    default:
      return 'Login failed. Please try again';
  }
}