# FettiSwap - Complete Setup Guide

## Overview
FettiSwap is a crypto swap platform that lets users buy BTC, ETH, and LTC with USDT (BEP20). LTC is offered at a $17 discount. Authentication is wallet-based (MetaMask / SIWE).

---

## Complete SQL Schema

Run this in your Supabase SQL Editor if setting up a fresh database:

```sql
-- ===========================
-- FETTISWAP DATABASE SCHEMA
-- ===========================

-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL UNIQUE,
  assigned_bep20_address TEXT UNIQUE,
  balances JSONB NOT NULL DEFAULT '{"USDT": 0, "BTC": 0, "ETH": 0, "LTC": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Deposit addresses table
CREATE TABLE public.deposit_addresses (
  address TEXT PRIMARY KEY,
  assigned BOOLEAN NOT NULL DEFAULT false,
  assigned_to_wallet TEXT UNIQUE
);

ALTER TABLE public.deposit_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their assigned address" ON public.deposit_addresses
  FOR SELECT TO authenticated
  USING (
    assigned_to_wallet = (SELECT wallet_address FROM public.users WHERE id = auth.uid())
  );

-- Transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'swap')),
  coin TEXT NOT NULL,
  usdt_amount NUMERIC NOT NULL,
  coin_amount NUMERIC NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (
    wallet_address = (SELECT wallet_address FROM public.users WHERE id = auth.uid())
  );

-- Helper function
CREATE OR REPLACE FUNCTION public.get_user_wallet(user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wallet_address FROM public.users WHERE id = user_id;
$$;
```

---

## Environment Secrets

Set these secrets in your Supabase project (Dashboard → Settings → Edge Functions → Secrets):

| Secret Name | Description | Example / Default |
|---|---|---|
| `ADMIN_PASSWORD` | Password for the admin panel at `/admin` | `password` |
| `BSC_RPC_URL` | BSC mainnet RPC endpoint | `https://bsc-dataseed.binance.org/` (default if not set) |
| `USDT_BEP20_CONTRACT` | USDT contract address on BSC | `0x55d398326f99059fF775485246999027B3197955` (default if not set) |

**Note:** `BSC_RPC_URL` and `USDT_BEP20_CONTRACT` have hardcoded defaults. You only need to set them if you want to override them.

The following secrets are auto-configured by Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PUBLISHABLE_KEY`

---

## Edge Functions

There are 4 edge functions:

### 1. `siwe-auth` — Wallet Authentication
- Verifies MetaMask signature (SIWE)
- Creates Supabase auth user mapped to wallet address
- Auto-assigns a deposit address from the pool on first login
- **No JWT required** (handles its own auth)

### 2. `verify-tx` — Transaction Verification
- Requires authenticated user (JWT)
- Accepts `tx_hash`, `coin`, `usdt_amount`, `coin_amount`
- Fetches BSC transaction receipt via RPC
- Validates USDT transfer to user's assigned deposit address
- Credits user balance on success

### 3. `prices` — Live Price Feed
- Fetches BTC, ETH, LTC, USDT prices from CoinGecko
- Applies $17 LTC discount for Fetti pricing
- Falls back to static prices if CoinGecko is down
- Refreshes every 30s on the frontend

### 4. `admin` — Admin Panel API
- Password-protected (uses `ADMIN_PASSWORD` secret)
- Actions: `list-users`, `list-transactions`, `update-balance`, `update-tx-status`, `add-addresses`, `list-addresses`

---

## Deposit Address Setup

1. Go to `/admin` in the app
2. Enter your admin password (default: `password`)
3. Click the **Addresses** tab
4. Paste your BEP20 wallet addresses (one per line)
5. Click "Add Addresses"

When a new user connects their wallet, they're automatically assigned the next available address.

---

## How It Works

### User Flow:
1. User clicks **Connect Wallet** → MetaMask popup
2. User signs a message (SIWE) → Backend verifies and creates session
3. User goes to **Swap** page → Sees their assigned deposit address + QR code
4. User sends USDT (BEP20) to their deposit address
5. User pastes the BSC tx hash → Clicks **Verify & Swap**
6. Backend verifies the tx on-chain → Credits coin balance
7. User sees updated balance on Home and transaction in History

### Admin Flow:
1. Navigate to `/admin`
2. Login with admin password
3. Manage users, transactions, and deposit addresses

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Deploy edge functions (if using Supabase CLI)
supabase functions deploy siwe-auth
supabase functions deploy verify-tx
supabase functions deploy prices
supabase functions deploy admin
```

---

## Tech Stack
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + Framer Motion
- **Backend:** Supabase (Auth, Database, Edge Functions)
- **Auth:** SIWE (Sign-In With Ethereum) via MetaMask
- **On-chain:** BSC (BEP20 USDT) verification via JSON-RPC
- **Prices:** CoinGecko API (free tier)
