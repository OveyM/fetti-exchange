import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import CoinIcon from "@/components/CoinIcon";
import { useAuth } from "@/contexts/AuthContext";
import { usePrices } from "@/hooks/usePrices";
import { Copy, Check, ArrowDown, Loader2, AlertCircle } from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const SwapPage = () => {
  const { session, user, refreshUser } = useAuth();
  const { data: prices } = usePrices();
  const queryClient = useQueryClient();

  const swappableCoins = useMemo(
    () => (prices || []).filter((c) => c.coin !== "USDT"),
    [prices]
  );

  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [usdtAmount, setUsdtAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const price = useMemo(
    () => swappableCoins.find((c) => c.coin === selectedCoin),
    [selectedCoin, swappableCoins]
  );

  const coinAmount =
    usdtAmount && price
      ? (parseFloat(usdtAmount) / price.fettiPrice).toFixed(8)
      : "0.00000000";

  const depositAddress = user?.assigned_bep20_address || "";

  const handleCopy = () => {
    if (!depositAddress) return;
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (!session) {
      toast.error("Please login first");
      return;
    }
    if (!txHash.trim()) {
      toast.error("Please enter a transaction hash");
      return;
    }
    if (!usdtAmount || parseFloat(usdtAmount) <= 0) {
      toast.error("Please enter a valid USDT amount");
      return;
    }
    if (!price) return;

    setVerifying(true);
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
            tx_hash: txHash.trim(),
            coin: selectedCoin,
            usdt_amount: parseFloat(usdtAmount),
            coin_amount: parseFloat(coinAmount),
          }),
        }
      );

      const data = await res.json();

      if (data.status === "confirmed") {
        toast.success("Transaction verified! Swap complete.", {
          description: `${data.coin_amount} ${selectedCoin} credited to your balance.`,
        });
        setTxHash("");
        setUsdtAmount("");
        await refreshUser();
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
      } else {
        toast.error(data.error || "Verification failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Verification error");
    } finally {
      setVerifying(false);
    }
  };

  if (!session) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-24">
        <h1 className="text-2xl font-bold">Swap</h1>
        <GlassCard className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Login to start swapping.</p>
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
      <h1 className="text-2xl font-bold">Swap</h1>

      {/* Coin selector */}
      <GlassCard delay={0.05}>
        <p className="text-sm text-muted-foreground mb-3">Select coin to buy</p>
        <div className="flex gap-2">
          {swappableCoins.map((c) => (
            <button
              key={c.coin}
              onClick={() => setSelectedCoin(c.coin)}
              className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border transition-all ${
                selectedCoin === c.coin
                  ? "border-primary/50 bg-primary/10"
                  : "border-glass-border bg-transparent hover:border-muted-foreground/30"
              }`}
            >
              <CoinIcon coin={c.coin} size={32} />
              <span className="text-xs font-medium">{c.coin}</span>
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Amount Input */}
      <GlassCard delay={0.1}>
        <p className="text-sm text-muted-foreground mb-2">You send</p>
        <div className="flex items-center gap-3">
          <CoinIcon coin="USDT" size={32} />
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={usdtAmount}
            onChange={(e) => setUsdtAmount(e.target.value)}
            className="input-glass flex-1 text-xl font-semibold"
          />
          <span className="text-muted-foreground font-medium">USDT</span>
        </div>

        <div className="flex justify-center my-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
            <ArrowDown className="w-4 h-4 text-primary" />
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-2">You receive</p>
        <div className="flex items-center gap-3">
          <CoinIcon coin={selectedCoin} size={32} />
          <div className="input-glass flex-1 text-xl font-semibold">{coinAmount}</div>
          <span className="text-muted-foreground font-medium">{selectedCoin}</span>
        </div>

        {price && (
          <p className="text-xs text-muted-foreground mt-2">
            Rate: 1 {selectedCoin} = ${price.fettiPrice.toLocaleString()} USDT (Fetti Price)
          </p>
        )}
      </GlassCard>

      {/* Deposit Address */}
      <GlassCard delay={0.15}>
        <p className="text-sm text-muted-foreground mb-3">
          Send USDT to this Solana address
        </p>
        {depositAddress ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-foreground rounded-xl">
                <QRCode value={depositAddress} size={160} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="input-glass flex-1 text-xs font-mono truncate">
                {depositAddress}
              </div>
              <button
                onClick={handleCopy}
                className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center hover:bg-primary/25 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <Copy className="w-4 h-4 text-primary" />
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No deposit address assigned yet. Contact support.
            </p>
          </div>
        )}
      </GlassCard>

      {/* Tx Hash */}
      <GlassCard delay={0.2}>
        <p className="text-sm text-muted-foreground mb-2">Transaction Hash</p>
        <input
          type="text"
          placeholder="Paste your tx hash here..."
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          className="input-glass w-full font-mono text-sm mb-3"
        />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleVerify}
          disabled={verifying}
          className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity neon-glow"
        >
          {verifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify & Swap"
          )}
        </motion.button>
      </GlassCard>
    </motion.div>
  );
};

export default SwapPage;
