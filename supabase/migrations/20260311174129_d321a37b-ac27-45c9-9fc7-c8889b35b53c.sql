
-- Update default balances to use SOL instead of LTC
ALTER TABLE public.users ALTER COLUMN balances SET DEFAULT '{"USDT": 0, "BTC": 0, "ETH": 0, "SOL": 0}'::jsonb;

-- Migrate existing wallet_address values to random usernames
UPDATE public.users SET wallet_address = 'user_' || substr(md5(random()::text), 1, 8) WHERE wallet_address LIKE '0x%';

-- Update existing balances: rename LTC key to SOL
UPDATE public.users SET balances = (balances - 'LTC') || jsonb_build_object('SOL', COALESCE((balances->>'LTC')::numeric, 0)) WHERE balances ? 'LTC';

-- Migrate deposit_addresses assigned_to_wallet to match new usernames
UPDATE public.deposit_addresses da SET assigned_to_wallet = u.wallet_address FROM public.users u WHERE da.assigned = true AND da.assigned_to_wallet IS NOT NULL AND u.assigned_bep20_address = da.address;

-- Update transactions wallet_address to match new usernames
UPDATE public.transactions t SET wallet_address = u.wallet_address FROM public.users u WHERE t.wallet_address = u.wallet_address OR EXISTS (SELECT 1 FROM public.users WHERE wallet_address = t.wallet_address);
