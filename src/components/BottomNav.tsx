import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeftRight, Clock, ArrowUpRight, Sparkles } from "lucide-react";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/swap", icon: ArrowLeftRight, label: "Swap" },
  { path: "/withdraw", icon: ArrowUpRight, label: "Withdraw" },
  { path: "/history", icon: Clock, label: "History" },
  { path: "/feed", icon: Sparkles, label: "Feed" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-2 py-2 rounded-full bg-card/70 backdrop-blur-2xl border border-glass-border neon-glow">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors"
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-full bg-primary/15 border border-primary/30 neon-glow"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                className={`w-4 h-4 relative z-10 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span className={`text-[9px] relative z-10 mt-0.5 ${active ? "text-primary" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
