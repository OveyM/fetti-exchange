export interface CoinPrice {
  coin: string;
  marketPrice: number;
  fettiPrice: number;
  change24h: number;
}

export const MOCK_PRICES: CoinPrice[] = [
  { coin: "BTC", marketPrice: 67432.18, fettiPrice: 67432.18, change24h: 2.4 },
  { coin: "ETH", marketPrice: 3521.85, fettiPrice: 3521.85, change24h: -0.8 },
  { coin: "SOL", marketPrice: 145.0, fettiPrice: 129.0, change24h: 1.2 },
  { coin: "USDT", marketPrice: 1.0, fettiPrice: 1.0, change24h: 0.01 },
];

export const MOCK_BALANCES: Record<string, number> = {
  USDT: 250.0,
  BTC: 0.00045,
  ETH: 0.012,
  SOL: 1.85,
};

export interface Transaction {
  id: string;
  type: "deposit" | "swap";
  coin: string;
  usdtAmount: number;
  coinAmount: number;
  txHash: string;
  status: "pending" | "confirmed" | "failed";
  createdAt: string;
}

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    type: "swap",
    coin: "BTC",
    usdtAmount: 100,
    coinAmount: 0.00148,
    txHash: "abc123def456789abc123def456789abc123def456789abc123def456789abcd",
    status: "confirmed",
    createdAt: "2026-02-18T10:30:00Z",
  },
  {
    id: "2",
    type: "swap",
    coin: "SOL",
    usdtAmount: 50,
    coinAmount: 0.387,
    txHash: "def456789abc123def456789abc123def456789abc123def456789abc123defa",
    status: "pending",
    createdAt: "2026-02-18T09:15:00Z",
  },
  {
    id: "3",
    type: "deposit",
    coin: "USDT",
    usdtAmount: 200,
    coinAmount: 200,
    txHash: "789abc123def456789abc123def456789abc123def456789abc123def456789b",
    status: "failed",
    createdAt: "2026-02-17T18:45:00Z",
  },
];

export const MOCK_WALLET = "guest";
export const MOCK_DEPOSIT_ADDRESS = "ABC123DEF456GHI789JKL012MNO345PQR678STU901";
