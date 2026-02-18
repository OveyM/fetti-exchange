import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

interface UserData {
  id: string;
  wallet_address: string;
  assigned_bep20_address: string | null;
  balances: Record<string, number>;
}

interface AuthContextType {
  session: Session | null;
  user: UserData | null;
  loading: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (userId: string) => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      setUser({
        id: data.id,
        wallet_address: data.wallet_address,
        assigned_bep20_address: data.assigned_bep20_address,
        balances: data.balances as Record<string, number>,
      });
    }
  };

  const refreshUser = async () => {
    if (session?.user?.id) {
      await fetchUser(session.user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user?.id) fetchUser(s.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user?.id) {
        fetchUser(s.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const connectWallet = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      throw new Error("No wallet found. Please install MetaMask.");
    }

    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    const address = accounts[0];

    // Create SIWE message
    const message = `Sign in to FettiSwap\n\nWallet: ${address}\nTimestamp: ${new Date().toISOString()}`;

    // Request signature
    const signature = await ethereum.request({
      method: "personal_sign",
      params: [message, address],
    });

    // Verify with backend
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/siwe-auth`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          wallet_address: address,
          message,
          signature,
        }),
      }
    );

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }
  };

  const disconnect = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, connectWallet, disconnect, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
