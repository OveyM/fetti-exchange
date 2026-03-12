import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import CoinIcon from "@/components/CoinIcon";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Loader2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

const WithdrawPage = () => {
  const { session, user } = useAuth();
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const solBalance = user?.balances?.SOL || 0;

  const handleWithdraw = async () => {
    if (!session) return toast.error("Please login first");
    if (!withdrawAddress.trim()) return toast.error("Enter a withdrawal address");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (amt > solBalance) return toast.error("Insufficient SOL balance");

    setSubmitting(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/verify-tx`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            tx_hash: `withdraw_${Date.now()}_${withdrawAddress.slice(0, 8)}`,
            coin: "SOL",
            usdt_amount: 0,
            coin_amount: amt,
            type: "withdrawal",
            withdraw_address: withdrawAddress.trim(),
          }),
        }
      );
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success("Withdrawal request submitted!", {
          description: "Your withdrawal is being processed. Check history for status.",
        });
        setAmount("");
        setWithdrawAddress("");
      }
    } catch {
      toast.error("Failed to submit withdrawal");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-24">
        <h1 className="text-2xl font-bold">Withdraw</h1>
        <GlassCard className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Login to withdraw.</p>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-24">
      <h1 className="text-2xl font-bold">Withdraw SOL</h1>

      <GlassCard delay={0.05}>
        <div className="flex items-center gap-3 mb-4">
          <CoinIcon coin="SOL" size={40} />
          <div>
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-2xl font-bold">{solBalance} SOL</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard delay={0.1}>
        <p className="text-sm text-muted-foreground mb-2">Withdrawal Address</p>
        <input
          type="text"
          placeholder="Enter your Solana wallet address..."
          value={withdrawAddress}
          onChange={(e) => setWithdrawAddress(e.target.value)}
          className="input-glass w-full font-mono text-sm mb-4"
        />

        <p className="text-sm text-muted-foreground mb-2">Amount (SOL)</p>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-glass flex-1 text-xl font-semibold"
          />
          <button
            onClick={() => setAmount(solBalance.toString())}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-primary/15 border border-primary/30 text-primary"
          >
            MAX
          </button>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleWithdraw}
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity neon-glow mt-4"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ArrowUpRight className="w-4 h-4" />
              Withdraw SOL
            </>
          )}
        </motion.button>
      </GlassCard>

      <GlassCard delay={0.15}>
        <p className="text-xs text-muted-foreground">
          • Withdrawals are processed manually and may take up to 24 hours.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          • Minimum withdrawal: 0.01 SOL
        </p>
      </GlassCard>
    </motion.div>
  );
};

export default WithdrawPage;
