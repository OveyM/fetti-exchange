import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Users, ArrowLeftRight, MapPin, Shield, Plus } from "lucide-react";

const AdminPage = () => {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "transactions" | "addresses">("users");
  const [data, setData] = useState<any[]>([]);

  // Balance update form
  const [editUserId, setEditUserId] = useState("");
  const [editCoin, setEditCoin] = useState("USDT");
  const [editAmount, setEditAmount] = useState("");

  // Add addresses form
  const [newAddresses, setNewAddresses] = useState("");

  // Tx status update
  const [editTxId, setEditTxId] = useState("");
  const [editTxStatus, setEditTxStatus] = useState("confirmed");

  // Add transaction form
  const [newTxUsername, setNewTxUsername] = useState("");
  const [newTxType, setNewTxType] = useState("swap");
  const [newTxCoin, setNewTxCoin] = useState("SOL");
  const [newTxUsdtAmount, setNewTxUsdtAmount] = useState("");
  const [newTxCoinAmount, setNewTxCoinAmount] = useState("");
  const [newTxHash, setNewTxHash] = useState("");
  const [newTxStatus, setNewTxStatus] = useState("confirmed");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const adminFetch = async (action: string, body?: any) => {
    const url = `https://${projectId}.supabase.co/functions/v1/admin?action=${action}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey },
      body: JSON.stringify({ password, ...body }),
    });
    return res.json();
  };

  const handleLogin = async () => {
    setLoading(true);
    const result = await adminFetch("list-users");
    setLoading(false);
    if (result.error) return toast.error("Invalid password");
    setAuthenticated(true);
    setData(result);
    toast.success("Admin access granted");
  };

  const loadTab = async (tab: string) => {
    setLoading(true);
    const action = tab === "users" ? "list-users" : tab === "transactions" ? "list-transactions" : "list-addresses";
    const result = await adminFetch(action);
    setData(result || []);
    setLoading(false);
  };

  const handleTabChange = (tab: "users" | "transactions" | "addresses") => {
    setActiveTab(tab);
    loadTab(tab);
  };

  const handleUpdateBalance = async () => {
    if (!editUserId || !editAmount) return;
    const result = await adminFetch("update-balance", {
      username: editUserId,
      coin: editCoin,
      amount: parseFloat(editAmount),
    });
    if (result.success) {
      toast.success("Balance updated");
      loadTab("users");
    } else {
      toast.error(result.error || "Failed");
    }
  };

  const handleUpdateTxStatus = async () => {
    if (!editTxId) return;
    const result = await adminFetch("update-tx-status", {
      tx_id: editTxId,
      status: editTxStatus,
    });
    if (result.success) {
      toast.success("Transaction updated");
      loadTab("transactions");
    } else {
      toast.error(result.error || "Failed");
    }
  };

  const handleAddTransaction = async () => {
    if (!newTxUsername || !newTxHash) return toast.error("Username and tx hash required");
    const result = await adminFetch("add-transaction", {
      username: newTxUsername,
      type: newTxType,
      coin: newTxCoin,
      usdt_amount: parseFloat(newTxUsdtAmount) || 0,
      coin_amount: parseFloat(newTxCoinAmount) || 0,
      tx_hash: newTxHash,
      status: newTxStatus,
    });
    if (result.success) {
      toast.success("Transaction added");
      setNewTxUsername("");
      setNewTxHash("");
      setNewTxUsdtAmount("");
      setNewTxCoinAmount("");
      loadTab("transactions");
    } else {
      toast.error(result.error || "Failed");
    }
  };

  const handleAddAddresses = async () => {
    const addresses = newAddresses.split("\n").map((a) => a.trim()).filter(Boolean);
    if (addresses.length === 0) return;
    const result = await adminFetch("add-addresses", { addresses });
    if (result.success) {
      toast.success(`${result.count} addresses added`);
      setNewAddresses("");
      loadTab("addresses");
    } else {
      toast.error(result.error || "Failed");
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 w-full max-w-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="input-glass w-full mb-4"
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold">Admin Panel</h1>

        {/* Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "users" as const, icon: Users, label: "Users" },
            { key: "transactions" as const, icon: ArrowLeftRight, label: "Transactions" },
            { key: "addresses" as const, icon: MapPin, label: "Addresses" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-primary/15 border border-primary/30 text-primary"
                  : "bg-card/60 border border-glass-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
          </div>
        )}

        {!loading && activeTab === "users" && (
          <div className="space-y-4">
            <div className="glass-card p-4 space-y-3">
              <h3 className="font-semibold text-sm">Update User Balance</h3>
              <input
                placeholder="User ID (UUID)"
                value={editUserId}
                onChange={(e) => setEditUserId(e.target.value)}
                className="input-glass w-full text-sm"
              />
              <div className="flex gap-2">
                <select
                  value={editCoin}
                  onChange={(e) => setEditCoin(e.target.value)}
                  className="input-glass text-sm"
                >
                  {["USDT", "BTC", "ETH", "SOL"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="input-glass flex-1 text-sm"
                />
                <button onClick={handleUpdateBalance} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
                  Update
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {data.map((u: any) => (
                <div key={u.id} className="glass-card p-4 text-sm space-y-1">
                  <p className="font-mono text-xs text-muted-foreground">{u.id}</p>
                  <p><span className="text-muted-foreground">Username:</span> {u.wallet_address}</p>
                  <p><span className="text-muted-foreground">Deposit Addr:</span> {u.assigned_bep20_address || "None"}</p>
                  <p><span className="text-muted-foreground">Balances:</span> {JSON.stringify(u.balances)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && activeTab === "transactions" && (
          <div className="space-y-4">
            {/* Add transaction */}
            <div className="glass-card p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Transaction for User
              </h3>
              <input
                placeholder="Username"
                value={newTxUsername}
                onChange={(e) => setNewTxUsername(e.target.value)}
                className="input-glass w-full text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <select value={newTxType} onChange={(e) => setNewTxType(e.target.value)} className="input-glass text-sm">
                  {["swap", "deposit", "withdrawal"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={newTxCoin} onChange={(e) => setNewTxCoin(e.target.value)} className="input-glass text-sm">
                  {["SOL", "BTC", "ETH", "USDT"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="USDT Amount" value={newTxUsdtAmount} onChange={(e) => setNewTxUsdtAmount(e.target.value)} className="input-glass text-sm" />
                <input type="number" placeholder="Coin Amount" value={newTxCoinAmount} onChange={(e) => setNewTxCoinAmount(e.target.value)} className="input-glass text-sm" />
              </div>
              <input placeholder="Tx Hash" value={newTxHash} onChange={(e) => setNewTxHash(e.target.value)} className="input-glass w-full text-sm font-mono" />
              <div className="flex gap-2">
                <select value={newTxStatus} onChange={(e) => setNewTxStatus(e.target.value)} className="input-glass text-sm">
                  {["pending", "confirmed", "failed"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={handleAddTransaction} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex-1">
                  Add Transaction
                </button>
              </div>
            </div>

            {/* Update tx status */}
            <div className="glass-card p-4 space-y-3">
              <h3 className="font-semibold text-sm">Update Transaction Status</h3>
              <div className="flex gap-2">
                <input
                  placeholder="Transaction ID (UUID)"
                  value={editTxId}
                  onChange={(e) => setEditTxId(e.target.value)}
                  className="input-glass flex-1 text-sm"
                />
                <select value={editTxStatus} onChange={(e) => setEditTxStatus(e.target.value)} className="input-glass text-sm">
                  {["pending", "confirmed", "failed"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={handleUpdateTxStatus} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
                  Update
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {data.map((tx: any) => (
                <div key={tx.id} className="glass-card p-4 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium capitalize">{tx.type} · {tx.coin}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      tx.status === "confirmed" ? "status-confirmed" : tx.status === "pending" ? "status-pending" : "status-failed"
                    }`}>{tx.status}</span>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground truncate">{tx.tx_hash}</p>
                  <p><span className="text-muted-foreground">User:</span> {tx.wallet_address}</p>
                  <p><span className="text-muted-foreground">Amount:</span> {tx.coin_amount} {tx.coin} (${tx.usdt_amount})</p>
                  <p className="text-xs text-muted-foreground">ID: {tx.id}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && activeTab === "addresses" && (
          <div className="space-y-4">
            <div className="glass-card p-4 space-y-3">
              <h3 className="font-semibold text-sm">Add Solana Deposit Addresses (one per line)</h3>
              <textarea
                placeholder={"ABC123...\nDEF456...\nGHI789..."}
                value={newAddresses}
                onChange={(e) => setNewAddresses(e.target.value)}
                className="input-glass w-full h-32 font-mono text-sm resize-none"
              />
              <button onClick={handleAddAddresses} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
                Add Addresses
              </button>
            </div>

            <div className="space-y-2">
              {data.map((addr: any) => (
                <div key={addr.address} className="glass-card p-3 text-sm flex justify-between items-center">
                  <span className="font-mono text-xs truncate flex-1">{addr.address}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    addr.assigned ? "status-confirmed" : "status-pending"
                  }`}>
                    {addr.assigned ? `Assigned (${addr.assigned_to_wallet})` : "Available"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
