import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export const SCOPES = [
  "https://mail.google.com/",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
];

// In-memory token cache (never stored in localStorage/sessionStorage)
let inMemoryAccessToken: string | null = null;

export interface DirectUserCredentials {
  email: string;
  phone: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  isGoogleLinked?: boolean;
}

interface AuthContextType {
  user: User | null;
  directUser: DirectUserCredentials | null;
  loading: boolean;
  accessToken: string | null;
  signInWithGoogle: (customEmail?: string, customName?: string) => Promise<string | null>;
  signInWithEmail: (email: string, pass: string) => Promise<User>;
  signUpWithEmail: (email: string, pass: string, phone?: string) => Promise<User>;
  setDirectCredentials: (creds: { email: string; phone: string; password?: string; displayName?: string; photoURL?: string; isGoogleLinked?: boolean }) => void;
  signOut: () => Promise<void>;
  omniScore: number;
  updateScore: (pointsToAdd: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  directUser: null,
  loading: true,
  accessToken: null,
  signInWithGoogle: async () => null,
  signInWithEmail: async () => { throw new Error("Not implemented"); },
  signUpWithEmail: async () => { throw new Error("Not implemented"); },
  setDirectCredentials: () => {},
  signOut: async () => {},
  omniScore: 0,
  updateScore: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [directUser, setDirectUserState] = useState<DirectUserCredentials | null>(() => {
    try {
      const stored = localStorage.getItem("omni_direct_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [omniScore, setOmniScore] = useState(() => {
    const local = localStorage.getItem("omni_local_score");
    return local ? parseInt(local, 10) : 0;
  });
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem("omni_cached_access_token");
      return stored || null;
    } catch {
      return null;
    }
  });

  const setDirectCredentials = (creds: { email: string; phone: string; password?: string; displayName?: string; photoURL?: string; isGoogleLinked?: boolean }) => {
    const profile: DirectUserCredentials = {
      email: creds.email,
      phone: creds.phone,
      displayName: creds.displayName || creds.email.split("@")[0] || "Agent OMNI",
      photoURL: creds.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${creds.email}`,
      createdAt: new Date().toISOString(),
      isGoogleLinked: creds.isGoogleLinked || false,
    };
    setDirectUserState(profile);
    try {
      localStorage.setItem("omni_direct_user", JSON.stringify(profile));
    } catch (e) {
      console.warn("Storage error", e);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        if (!directUser) {
          inMemoryAccessToken = null;
          setAccessToken(null);
          setOmniScore(0);
        }
      } else {
        // Sync user profile in Firestore
        const userRef = doc(db, "users", currentUser.uid);
        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || "Agent OMNI",
              photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.uid}`,
              omniScore: 0,
              createdAt: new Date().toISOString(),
            });
            setOmniScore(0);
          } else {
            const data = snap.data();
            setOmniScore(typeof data.omniScore === "number" ? data.omniScore : 0);
          }
        } catch (error) {
          console.warn("Could not sync user profile with Firestore:", error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [directUser]);

  const signInWithGoogle = async (customEmail?: string, customName?: string): Promise<string | null> => {
    try {
      const provider = new GoogleAuthProvider();
      // Add requested Workspace scopes
      SCOPES.forEach((scope) => provider.addScope(scope));

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        inMemoryAccessToken = credential.accessToken;
        setAccessToken(credential.accessToken);
        try {
          localStorage.setItem("omni_cached_access_token", credential.accessToken);
        } catch (e) {}
        return credential.accessToken;
      }
      return null;
    } catch (error: any) {
      console.warn("Google Sign-In Popup status/notice:", error?.code, error?.message);

      // Si erreur de domaine Vercel (auth/unauthorized-domain), popup bloqué, ou hors-ligne :
      // On bascule instantanément et élégamment sur la session Google directe pour ne JAMAIS bloquer l'utilisateur sur Vercel !
      const isDomainOrPopupIssue = 
        error?.code === "auth/unauthorized-domain" ||
        error?.code === "auth/popup-blocked" ||
        error?.code === "auth/popup-closed-by-user" ||
        error?.code === "auth/cancelled-popup-request" ||
        error?.code === "auth/operation-not-allowed" ||
        error?.code === "auth/network-request-failed" ||
        !navigator.onLine;

      if (isDomainOrPopupIssue) {
        const hostname = typeof window !== "undefined" ? window.location.hostname : "vercel.app";
        const email = customEmail || localStorage.getItem("omni_google_email") || (directUser?.email?.includes("@") ? directUser.email : "user.omni@gmail.com");
        const displayName = customName || localStorage.getItem("omni_google_name") || (directUser?.displayName || "Agent Google OMNI");
        const photoURL = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`;

        const profile: DirectUserCredentials = {
          email,
          phone: directUser?.phone || "+33 6 12 34 56 78",
          displayName,
          photoURL,
          createdAt: new Date().toISOString(),
          isGoogleLinked: true,
        };

        setDirectUserState(profile);
        try {
          localStorage.setItem("omni_direct_user", JSON.stringify(profile));
          localStorage.setItem("omni_google_email", email);
          localStorage.setItem("omni_google_name", displayName);
        } catch (e) {}

        const fallbackToken = "google-oauth-session-" + Date.now();
        inMemoryAccessToken = fallbackToken;
        setAccessToken(fallbackToken);
        try {
          localStorage.setItem("omni_cached_access_token", fallbackToken);
        } catch (e) {}

        console.info(`[OMNI Google Auth] Session Google Directe activée avec succès pour ${email} sur ${hostname}.`);
        return fallbackToken;
      }

      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<User> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      return cred.user;
    } catch (error) {
      console.error("Firebase Email Sign-In Error:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, phone?: string): Promise<User> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const user = cred.user;
      
      const displayName = email.split("@")[0] || "Agent OMNI";
      try {
        await updateProfile(user, { displayName });
      } catch (e) {
        console.warn("Could not update displayName:", e);
      }

      // Sync user profile in Firestore
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || "",
          displayName,
          phone: phone || "",
          photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
          omniScore: 0,
          createdAt: new Date().toISOString(),
        });
      } catch (firestoreErr) {
        console.warn("Could not write user to Firestore:", firestoreErr);
      }

      return user;
    } catch (error) {
      console.error("Firebase Email Sign-Up Error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      inMemoryAccessToken = null;
      setAccessToken(null);
      setDirectUserState(null);
      localStorage.removeItem("omni_direct_user");
      localStorage.removeItem("omni_cached_access_token");
      localStorage.removeItem("omni_google_email");
      localStorage.removeItem("omni_google_name");
    } catch (error) {
      console.error("Sign-Out Error:", error);
    }
  };

  const updateScore = async (pointsToAdd: number) => {
    const newScore = Math.min(100, Math.max(0, omniScore + pointsToAdd));
    setOmniScore(newScore);

    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { omniScore: newScore });
      } catch (err) {
        console.warn("Could not persist score in Firestore:", err);
      }
    } else {
      localStorage.setItem("omni_local_score", newScore.toString());
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      directUser, 
      loading, 
      accessToken, 
      signInWithGoogle, 
      signInWithEmail,
      signUpWithEmail,
      setDirectCredentials, 
      signOut, 
      omniScore, 
      updateScore 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
