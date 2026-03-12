import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Loader2, LogOut, Eye, EyeOff, Copy, ShieldCheck, KeyRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ConnectWalletButton = () => {
  const { session, user, login, signup, disconnect, loading, loginWithRecovery } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Recovery code displayed after signup
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);

  // Forgot password flow
  const [forgotMode, setForgotMode] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [forgotUsername, setForgotUsername] = useState("");

  const resetModal = () => {
    setShowModal(false);
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setRecoveryCode(null);
    setForgotMode(false);
    setRecoveryInput("");
    setForgotUsername("");
  };

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      return toast.error("Please enter username and password");
    }
    setSubmitting(true);
    try {
      if (isSignup) {
        const code = await signup(username.trim().toLowerCase(), password);
        setRecoveryCode(code || null);
        toast.success("Account created!");
      } else {
        await login(username.trim().toLowerCase(), password);
        toast.success("Logged in!");
        resetModal();
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecoveryLogin = async () => {
    if (!forgotUsername.trim() || !recoveryInput.trim()) {
      return toast.error("Enter your username and recovery code");
    }
    setSubmitting(true);
    try {
      await loginWithRecovery(forgotUsername.trim().toLowerCase(), recoveryInput.trim());
      toast.success("Logged in with recovery code!");
      resetModal();
    } catch (err: any) {
      toast.error(err.message || "Recovery failed");
    } finally {
      setSubmitting(false);
    }
  };

  const copyRecoveryCode = () => {
    if (recoveryCode) {
      navigator.clipboard.writeText(recoveryCode);
      toast.success("Recovery code copied! Save it somewhere safe.");
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
        onClick={() => { setShowModal(true); setIsSignup(false); setForgotMode(false); }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm neon-glow"
      >
        <User className="w-4 h-4" />
        Login
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 w-full max-w-sm space-y-4"
            >
              {/* Recovery code display after signup */}
              {recoveryCode ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-foreground">Save Your Recovery Code</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    If you forget your password, use this code to log in. <span className="text-destructive font-semibold">Save it now — you won't see it again!</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="input-glass flex-1 font-mono text-sm font-semibold text-primary tracking-wider text-center">
                      {recoveryCode}
                    </div>
                    <button
                      onClick={copyRecoveryCode}
                      className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center hover:bg-primary/25 transition-colors"
                    >
                      <Copy className="w-4 h-4 text-primary" />
                    </button>
                  </div>
                  <button
                    onClick={resetModal}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold neon-glow"
                  >
                    I've Saved It — Continue
                  </button>
                </div>
              ) : forgotMode ? (
                /* Forgot password / recovery code login */
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-secondary" />
                    <h2 className="text-lg font-bold text-foreground">Recover Account</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter your username and recovery code to log in.
                  </p>
                  <input
                    type="text"
                    placeholder="Username"
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    className="input-glass w-full"
                    autoFocus
                  />
                  <input
                    type="text"
                    placeholder="Recovery Code"
                    value={recoveryInput}
                    onChange={(e) => setRecoveryInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRecoveryLogin()}
                    className="input-glass w-full font-mono tracking-wider"
                  />
                  <button
                    onClick={handleRecoveryLogin}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50 cyan-glow"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Login with Recovery Code
                  </button>
                  <button
                    onClick={() => setForgotMode(false)}
                    className="w-full text-xs text-center text-primary hover:underline"
                  >
                    Back to Login
                  </button>
                  <button
                    onClick={resetModal}
                    className="w-full py-2 rounded-xl border border-glass-border text-muted-foreground text-sm hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* Normal login / signup */
                <>
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
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      className="input-glass w-full pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50 neon-glow"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSignup ? "Sign Up" : "Login"}
                  </button>
                  {!isSignup && (
                    <button
                      onClick={() => setForgotMode(true)}
                      className="w-full text-xs text-center text-muted-foreground hover:text-secondary transition-colors"
                    >
                      Forgot password? Use recovery code
                    </button>
                  )}
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
                    onClick={resetModal}
                    className="w-full py-2 rounded-xl border border-glass-border text-muted-foreground text-sm hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ConnectWalletButton;
