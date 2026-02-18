import { useQuery } from "@tanstack/react-query";
import type { CoinPrice } from "@/lib/mockData";
import { MOCK_PRICES } from "@/lib/mockData";

export const usePrices = () => {
  return useQuery<CoinPrice[]>({
    queryKey: ["prices"],
    queryFn: async () => {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/prices`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to fetch prices");
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30s
    staleTime: 15000,
    placeholderData: MOCK_PRICES,
  });
};
