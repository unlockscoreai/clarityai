
"use client";

import { auth } from "@/lib/firebase/client";
import { User, onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

type SessionContextType = {
  user: User | null;
  loading: boolean;
};

const SessionContext = createContext<SessionContextType>({
  user: null,
  loading: true,
});

export const useSession = () => useContext(SessionContext);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ user, loading }}>
      {children}
    </SessionContext.Provider>
  );
}
