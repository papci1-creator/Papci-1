import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const GOOGLE_FORMS_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.body.readonly',
  'https://www.googleapis.com/auth/forms.responses.readonly',
];

// In-Memory Token Cache (never stored in localStorage or sessionStorage per security guidelines)
let inMemoryAccessToken: string | null = null;

// Track auth state and clear cached token when signed out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    inMemoryAccessToken = null;
  }
});

/**
 * Initiates Google OAuth Sign-in with the required Google Forms & Drive scopes.
 */
export async function signInWithGoogle(): Promise<{ user: User; accessToken: string }> {
  const provider = new GoogleAuthProvider();
  GOOGLE_FORMS_SCOPES.forEach((scope) => provider.addScope(scope));
  provider.setCustomParameters({ prompt: 'consent' });

  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken || null;

  if (!token) {
    throw new Error('Failed to obtain Google OAuth access token from authentication.');
  }

  inMemoryAccessToken = token;
  return { user: result.user, accessToken: token };
}

/**
 * Signs the user out and clears in-memory credentials.
 */
export async function signOutGoogle(): Promise<void> {
  await signOut(auth);
  inMemoryAccessToken = null;
}

/**
 * Retrieves the current in-memory access token.
 */
export function getCachedAccessToken(): string | null {
  return inMemoryAccessToken;
}

/**
 * Manually update in-memory access token.
 */
export function setCachedAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}
