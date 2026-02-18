import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import CoinIcon from "@/components/CoinIcon";
import StatusBadge from "@/components/StatusBadge";
import { MOCK_TRANSACTIONS } from "@/lib/mockData";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const HistoryPage = () => {
  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success("Tx hash copied!");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 pb-24"
    >
      <h1 className="text-2xl font-bold">History</h1>

      {MOCK_TRANSACTIONS.length === 0 ? (
        <GlassCard className="text-center py-12">
          <p className="text-muted-foreground">No transactions yet.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {MOCK_TRANSACTIONS.map((tx, i) => (
            <GlassCard key={tx.id} delay={i * 0.08}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <CoinIcon coin={tx.coin} size={36} />
                  <div>
                    <p className="font-semibold text-sm capitalize">
                      {tx.type} · {tx.coin}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <StatusBadge status={tx.status} />
              </div>

              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  {tx.coinAmount} {tx.coin}{" "}
                  <span className="text-muted-foreground">
                    (${tx.usdtAmount})
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 text-xs font-mono text-muted-foreground truncate">
                  {tx.txHash}
                </div>
                <button
                  onClick={() => copyHash(tx.txHash)}
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
