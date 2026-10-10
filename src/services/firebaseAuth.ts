import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Test Firestore connection on boot
(async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
    }
  }
})();

// Core Google Sign-In OAuth 2.0 Scopes (https://developers.google.com/identity/protocols/oauth2/scopes#google-sign-in)
export const GOOGLE_SIGN_IN_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// Feature-Specific Google Workspace Scopes (requested incrementally)
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.readonly',
];

export const GOOGLE_FORMS_SCOPES = [
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
];

export const GOOGLE_WORKSPACE_SCOPES = [
  ...GOOGLE_SIGN_IN_SCOPES,
  ...GMAIL_SCOPES,
  ...GOOGLE_FORMS_SCOPES,
];

// In-Memory Token Cache (never stored in localStorage or sessionStorage per security guidelines)
let inMemoryAccessToken: string | null = null;
let isSigningIn = false;

// Track auth state and clear cached token when signed out
onAuthStateChanged(auth, (user) => {
  if (!user) {
    inMemoryAccessToken = null;
  }
});

/**
 * Initialize auth state listener. Call this on app load.
 */
export function initAuth(
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, inMemoryAccessToken);
      }
    } else {
      inMemoryAccessToken = null;
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });
}

/**
 * Initiates Google OAuth Sign-in with the configured Google Sign-in and optional feature scopes.
 */
export async function signInWithGoogle(
  additionalScopes: string[] = []
): Promise<{ user: User; accessToken: string }> {
  const provider = new GoogleAuthProvider();

  // Always request official Google Sign-In scopes (openid, email, profile)
  GOOGLE_SIGN_IN_SCOPES.forEach((scope) => provider.addScope(scope));

  // Add any additional scopes for specific features (e.g. Gmail, Forms)
  additionalScopes.forEach((scope) => {
    if (!GOOGLE_SIGN_IN_SCOPES.includes(scope)) {
      provider.addScope(scope);
    }
  });

  provider.setCustomParameters({ prompt: 'consent' });

  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;

    if (!token) {
      // Fallback to Firebase user ID token if accessToken not in result
      const idToken = await result.user.getIdToken();
      inMemoryAccessToken = idToken;
      return { user: result.user, accessToken: idToken };
    }

    inMemoryAccessToken = token;
    return { user: result.user, accessToken: token };
  } finally {
    isSigningIn = false;
  }
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
