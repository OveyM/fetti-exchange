import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ConnectWalletButton = () => {
  const { session, user, connectWallet, disconnect, loading } = useAuth();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connectWallet();
      toast.success("Wallet connected!");
    } catch (err: any) {
      toast.error(err.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  if (loading) return null;

  if (session && user) {
    const shortAddr = `${user.wallet_address.slice(0, 6)}...${user.wallet_address.slice(-4)}`;
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-mono text-primary">
          {shortAddr}
        </div>
        <button
          onClick={disconnect}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
          title="Disconnect"
        >
          <LogOut className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={handleConnect}
      disabled={connecting}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm neon-glow disabled:opacity-50"
    >
      {connecting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Wallet className="w-4 h-4" />
      )}
      {connecting ? "Connecting..." : "Connect Wallet"}
    </motion.button>
  );
};

export default ConnectWalletButton;
