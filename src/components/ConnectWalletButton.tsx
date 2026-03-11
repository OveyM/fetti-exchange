import { useState } from "react";
import { motion } from "framer-motion";
import { User, Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ConnectWalletButton = () => {
  const { session, user, login, signup, disconnect, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter username and password");
      return;
    }
    setSubmitting(true);
    try {
      if (isSignup) {
        await signup(username.trim().toLowerCase(), password);
        toast.success("Account created!");
      } else {
        await login(username.trim().toLowerCase(), password);
        toast.success("Logged in!");
      }
      setShowModal(false);
      setUsername("");
      setPassword("");
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (session && user) {
    return (
      <div className="flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
          {user.username}
        </div>
        <button
          onClick={disconnect}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm neon-glow"
      >
        <User className="w-4 h-4" />
        Login
      </motion.button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 w-full max-w-sm space-y-4"
          >
            <h2 className="text-lg font-bold text-foreground">
              {isSignup ? "Create Account" : "Login"}
            </h2>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-glass w-full"
              autoFocus
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="input-glass w-full"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50 neon-glow"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSignup ? "Sign Up" : "Login"}
            </button>
            <p className="text-xs text-center text-muted-foreground">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignup(!isSignup)}
                className="text-primary hover:underline"
              >
                {isSignup ? "Login" : "Sign Up"}
              </button>
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2 rounded-xl border border-glass-border text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default ConnectWalletButton;
