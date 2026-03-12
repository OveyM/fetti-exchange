import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import CoinIcon from "@/components/CoinIcon";
import { TrendingUp, Sparkles } from "lucide-react";

const FIRST_NAMES = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery",
  "Skyler", "Blake", "Drew", "Sage", "Kai", "Phoenix", "Rowan", "Reese",
  "Dakota", "Finley", "Hayden", "Jamie", "Cameron", "Emery", "Lennox",
  "Remy", "Nico", "Zion", "Ellis", "Ari", "Jude", "Milan", "Oakley",
  "River", "Shiloh", "Tatum", "Winter", "Cruz", "Denver", "Echo", "Frankie",
];

const SUFFIXES = ["_x", "99", "_pro", "2k", ".sol", "_fx", "888", "_dex", "007", "_og", "xt", "23", "_v2", "360"];

const generateUsername = () => {
  const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  return `${name}${suffix}`;
};

const generateNotification = (id: number) => {
  const username = generateUsername();
  const solAmount = (Math.random() * 45 + 5).toFixed(2);
  const profitPercent = (Math.random() * 12 + 1).toFixed(1);
  const profitUsd = (parseFloat(solAmount) * 16 * parseFloat(profitPercent) / 100).toFixed(2);

  return {
    id,
    username,
    solAmount,
    profitPercent,
    profitUsd,
    timestamp: new Date(),
  };
};

const FeedPage = () => {
  const [notifications, setNotifications] = useState(() =>
    Array.from({ length: 5 }, (_, i) => generateNotification(i))
  );
  const counterRef = useRef(5);

  useEffect(() => {
    const interval = setInterval(() => {
      const newNotif = generateNotification(counterRef.current++);
      setNotifications((prev) => [newNotif, ...prev.slice(0, 49)]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-24">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-secondary" />
        <h1 className="text-2xl font-bold">Live Profits</h1>
      </div>

      <GlassCard delay={0.05} className="border-secondary/30">
        <p className="text-sm text-muted-foreground">
          See real-time profits from FettiSwap traders taking advantage of our exclusive SOL pricing.
        </p>
      </GlassCard>

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <div className="glass-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                  <CoinIcon coin="SOL" size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    <span className="text-primary">@{n.username}</span>
                    {" "}swapped{" "}
                    <span className="text-foreground">{n.solAmount} SOL</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    and made{" "}
                    <span className="text-primary font-semibold">
                      ${n.profitUsd} profit
                    </span>
                    {" "}({n.profitPercent}% gain)
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-primary shrink-0" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default FeedPage;
