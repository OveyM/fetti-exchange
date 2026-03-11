# FettiSwap - Complete Setup Guide

## Overview
FettiSwap is a crypto swap platform that lets users buy BTC, ETH, and SOL with USDT. SOL is offered at a $16 discount. Authentication is username-based (no wallet connection required).

---

## Complete SQL Schema

Run this in your Supabase SQL Editor if setting up a fresh database:

```sql
-- ===========================
-- FETTISWAP DATABASE SCHEMA
-- ===========================

-- Users table (wallet_address column stores the username)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL UNIQUE,
  assigned_bep20_address TEXT UNIQUE,
  balances JSONB NOT NULL DEFAULT '{"USDT": 0, "BTC": 0, "ETH": 0, "SOL": 0}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Deposit addresses table (Solana wallet addresses)
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

The following secrets are auto-configured by Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PUBLISHABLE_KEY`

---

## Edge Functions

There are 4 edge functions:

### 1. `username-auth` — Username Authentication
- Users create accounts with a username (3-20 chars, lowercase letters/numbers/underscores) and password (6+ chars)
- Creates Supabase auth user mapped to the username
- Auto-assigns a Solana deposit address from the pool on signup
- **No JWT required** (handles its own auth)

### 2. `verify-tx` — Transaction Verification
- Requires authenticated user (JWT)
- Accepts `tx_hash`, `coin`, `usdt_amount`, `coin_amount`
- Records the transaction as pending for admin review
- Admin confirms via the admin panel

### 3. `prices` — Live Price Feed
- Fetches BTC, ETH, SOL, USDT prices from CoinGecko
- Applies $16 SOL discount for Fetti pricing
- Falls back to static prices if CoinGecko is down
- Refreshes every 30s on the frontend

### 4. `admin` — Admin Panel API
- Password-protected (uses `ADMIN_PASSWORD` secret, default: `password`)
- Actions: `list-users`, `list-transactions`, `update-balance`, `update-tx-status`, `add-addresses`, `list-addresses`

---

## Deposit Address Setup

1. Go to `/admin` in the app
2. Enter your admin password (default: `password`)
3. Click the **Addresses** tab
4. Paste your **Solana wallet addresses** (one per line)
5. Click "Add Addresses"

When a new user signs up, they're automatically assigned the next available Solana address.

---

## How It Works

### User Flow:
1. User clicks **Login** → Enters username & password (or signs up)
2. User goes to **Swap** page → Sees their assigned Solana deposit address + QR code
3. User sends USDT to their deposit address on Solana
4. User pastes the tx hash → Clicks **Verify & Swap**
5. Transaction is recorded as pending → Admin confirms it
6. User sees updated balance on Home and transaction in History

### Admin Flow:
1. Navigate to `/admin`
2. Login with admin password
3. Manage users, transactions, and deposit addresses
4. Confirm pending transactions to credit user balances

---

## Column Mapping Note

For legacy reasons, the database uses these column names:
- `users.wallet_address` → stores the **username**
- `deposit_addresses.assigned_to_wallet` → stores the **username** it's assigned to
- `transactions.wallet_address` → stores the **username**
- `users.assigned_bep20_address` → stores the **Solana deposit address**

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Deploy edge functions (if using Supabase CLI)
supabase functions deploy username-auth
supabase functions deploy verify-tx
supabase functions deploy prices
supabase functions deploy admin
```

---

## Tech Stack
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + Framer Motion
- **Backend:** Supabase (Auth, Database, Edge Functions)
- **Auth:** Username/Password via Edge Function
- **Deposit:** Solana wallet addresses (USDT)
- **Prices:** CoinGecko API (free tier)
