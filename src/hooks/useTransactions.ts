import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Transaction {
  id: string;
  type: string;
  coin: string;
  usdt_amount: number;
  coin_amount: number;
  tx_hash: string;
  status: string;
  created_at: string;
  wallet_address: string;
}

export const useTransactions = () => {
  const { session } = useAuth();

  return useQuery<Transaction[]>({
    queryKey: ["transactions", session?.user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Transaction[];
    },
    enabled: !!session,
    placeholderData: [],
  });
};
