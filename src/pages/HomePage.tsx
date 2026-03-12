import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import CoinIcon from "@/components/CoinIcon";
import { useAuth } from "@/contexts/AuthContext";
import { usePrices } from "@/hooks/usePrices";
import { TrendingUp, TrendingDown, User, Zap } from "lucide-react";
import { MOCK_BALANCES } from "@/lib/mockData";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const HomePage = () => {
  const { user, session } = useAuth();
  const { data: prices } = usePrices();

  const balances: Record<string, number> = user?.balances || MOCK_BALANCES;
  const priceList = prices || [];

  const getPrice = (coin: string) => priceList.find((p) => p.coin === coin);

  // Calculate real USD worth using market prices
  const totalUsd =
    (balances.USDT || 0) +
    (balances.BTC || 0) * (getPrice("BTC")?.marketPrice || 0) +
    (balances.ETH || 0) * (getPrice("ETH")?.marketPrice || 0) +
    (balances.SOL || 0) * (getPrice("SOL")?.marketPrice || 0);

  const usernameDisplay = user ? user.username : "Not Connected";

  const solPrice = getPrice("SOL");

  // Helper to get USD value for a coin balance
  const getCoinUsdValue = (coin: string, amount: number) => {
    if (coin === "USDT") return amount;
    const p = getPrice(coin);
    return p ? amount * p.marketPrice : 0;
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5 pb-24"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-bold text-foreground">{usernameDisplay}</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Total Balance */}
      <GlassCard className="text-center" delay={0.05}>
        <p className="text-sm text-muted-foreground mb-1">Wallet Balance (Real Worth)</p>
        <h2 className="text-4xl font-bold neon-text">
          ${totalUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </h2>
      </GlassCard>

      {/* Balances Grid */}
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(balances).map(([coin, amount], i) => {
          const usdVal = getCoinUsdValue(coin, amount as number);
          return (
            <GlassCard key={coin} delay={0.1 + i * 0.05} className="flex items-center gap-3">
              <CoinIcon coin={coin} size={36} />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{coin}</p>
                <p className="text-sm font-semibold truncate">{amount as number}</p>
                <p className="text-xs text-muted-foreground">
                  ≈ ${usdVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* SOL Special Card */}
      {solPrice && (
        <GlassCard delay={0.3} className="relative overflow-hidden border-secondary/30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-5 h-5 text-secondary" />
            <h3 className="font-semibold text-secondary">SOL Special Pricing</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Get SOL at{" "}
            <span className="text-secondary font-semibold">
              ${(solPrice.marketPrice - solPrice.fettiPrice).toFixed(0)} below
            </span>{" "}
            market price exclusively on FettiSwap.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Market</p>
              <p className="text-sm line-through text-muted-foreground">
                ${solPrice.marketPrice}
              </p>
            </div>
            <div>
              <p className="text-xs text-secondary">Fetti Price</p>
              <p className="text-lg font-bold text-secondary">
                ${solPrice.fettiPrice}
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Live Prices */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Live Prices</h3>
        <div className="space-y-2">
          {priceList
            .filter((p) => p.coin !== "USDT")
            .map((price, i) => (
              <GlassCard
                key={price.coin}
                delay={0.4 + i * 0.06}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <CoinIcon coin={price.coin} size={40} />
                  <div>
                    <p className="font-semibold">{price.coin}</p>
                    <p className="text-xs text-muted-foreground">
                      Fetti: ${price.fettiPrice.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${price.marketPrice.toLocaleString()}
                  </p>
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      price.change24h >= 0 ? "text-primary" : "text-destructive"
                    }`}
                  >
                    {price.change24h >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(price.change24h)}%
                  </div>
                </div>
              </GlassCard>
            ))}
        </div>
      </div>
    </motion.div>
  );
};

export default HomePage;
