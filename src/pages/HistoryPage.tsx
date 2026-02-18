import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import CoinIcon from "@/components/CoinIcon";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/hooks/useTransactions";
import { Copy, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const HistoryPage = () => {
  const { session } = useAuth();
  const { data: transactions, isLoading } = useTransactions();

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success("Tx hash copied!");
  };

  if (!session) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-24">
        <h1 className="text-2xl font-bold">History</h1>
        <GlassCard className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Connect your wallet to view history.</p>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 pb-24"
    >
      <h1 className="text-2xl font-bold">History</h1>

      {isLoading ? (
        <GlassCard className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </GlassCard>
      ) : !transactions || transactions.length === 0 ? (
        <GlassCard className="text-center py-12">
          <p className="text-muted-foreground">No transactions yet.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx, i) => (
            <GlassCard key={tx.id} delay={i * 0.08}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <CoinIcon coin={tx.coin} size={36} />
                  <div>
                    <p className="font-semibold text-sm capitalize">
                      {tx.type} · {tx.coin}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <StatusBadge status={tx.status as "confirmed" | "pending" | "failed"} />
              </div>

              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  {tx.coin_amount} {tx.coin}{" "}
                  <span className="text-muted-foreground">
                    (${tx.usdt_amount})
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 text-xs font-mono text-muted-foreground truncate">
                  {tx.tx_hash}
                </div>
                <button
                  onClick={() => copyHash(tx.tx_hash)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default HistoryPage;
