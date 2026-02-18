import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeftRight, Clock } from "lucide-react";

const tabs = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/swap", icon: ArrowLeftRight, label: "Swap" },
  { path: "/history", icon: Clock, label: "History" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-card/70 backdrop-blur-2xl border border-glass-border neon-glow">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex items-center justify-center w-14 h-14 rounded-full transition-colors"
            >
              {active && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-full bg-primary/15 border border-primary/30 neon-glow"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                className={`w-5 h-5 relative z-10 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
