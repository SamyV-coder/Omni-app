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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessToken: string | null;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
  omniScore: number;
  updateScore: (pointsToAdd: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  accessToken: null,
  signInWithGoogle: async () => null,
  signOut: async () => {},
  omniScore: 0,
  updateScore: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [omniScore, setOmniScore] = useState(0);
  const [accessToken, setAccessToken] = useState<string | null>(null);

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
    <AuthContext.Provider value={{ user, loading, accessToken, signInWithGoogle, signOut, omniScore, updateScore }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
