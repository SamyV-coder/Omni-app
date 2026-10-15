import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut 
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
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  directUser: DirectUserCredentials | null;
  loading: boolean;
  accessToken: string | null;
  signInWithGoogle: () => Promise<string | null>;
  setDirectCredentials: (creds: { email: string; phone: string; password?: string }) => void;
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
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const setDirectCredentials = (creds: { email: string; phone: string; password?: string }) => {
    const profile: DirectUserCredentials = {
      email: creds.email,
      phone: creds.phone,
      displayName: creds.email.split("@")[0] || "Agent OMNI",
      createdAt: new Date().toISOString()
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
        inMemoryAccessToken = null;
        setAccessToken(null);
        setOmniScore(0);
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
  }, []);

  const signInWithGoogle = async (): Promise<string | null> => {
    try {
      const provider = new GoogleAuthProvider();
      // Add requested Workspace scopes
      SCOPES.forEach((scope) => provider.addScope(scope));

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        inMemoryAccessToken = credential.accessToken;
        setAccessToken(credential.accessToken);
        return credential.accessToken;
      }
      return null;
    } catch (error) {
      console.error("Google Sign-In Error:", error);
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
    <AuthContext.Provider value={{ user, directUser, loading, accessToken, signInWithGoogle, setDirectCredentials, signOut, omniScore, updateScore }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
