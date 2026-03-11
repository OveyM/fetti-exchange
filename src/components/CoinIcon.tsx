const icons: Record<string, { color: string; label: string }> = {
  BTC: { color: "hsl(36, 100%, 50%)", label: "₿" },
  ETH: { color: "hsl(230, 60%, 60%)", label: "Ξ" },
  SOL: { color: "hsl(260, 80%, 60%)", label: "◎" },
  USDT: { color: "hsl(155, 80%, 45%)", label: "₮" },
};

const CoinIcon = ({ coin, size = 40 }: { coin: string; size?: number }) => {
  const { color, label } = icons[coin] ?? { color: "hsl(0,0%,50%)", label: "?" };
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        background: `linear-gradient(135deg, ${color}, ${color}88)`,
        color: "hsl(0, 0%, 100%)",
        boxShadow: `0 0 20px ${color}44`,
      }}
    >
      {label}
    </div>
  );
};

export default CoinIcon;
