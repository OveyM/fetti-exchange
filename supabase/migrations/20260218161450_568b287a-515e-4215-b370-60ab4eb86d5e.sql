
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

-- Function to get user wallet address (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_user_wallet(user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wallet_address FROM public.users WHERE id = user_id;
$$;
