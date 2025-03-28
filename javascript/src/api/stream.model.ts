



export enum TokenActivityType {
  Sell = "sell",
  Buy = "buy",
  AddLiquidity = "add_liquidity",
  RemoveLiquidity = "remove_liquidity",
}

export interface TokenActivity {
  address: string;
  priceUsd: string;
  amount: string;
  type: TokenActivityType;
  // maker: string;
  txHash: string;
  timestamp: number;
}

export interface TokenStat {
  address: string;
  timestamp: number;
  buys1m: number;
  sells1m: number;
  buyers1m: number;
  sellers1m: number;
  buyVolumeInUsd1m: string;
  sellVolumeInUsd1m: string;
  price1m: string;

  buys5m: number;
  sells5m: number;
  buyers5m: number;
  sellers5m: number;
  buyVolumeInUsd5m: string;
  sellVolumeInUsd5m: string;
  price5m: string;

  buys15m: number;
  sells15m: number;
  buyers15m: number;
  sellers15m: number;
  buyVolumeInUsd15m: string;
  sellVolumeInUsd15m: string;
  price15m: string;

  buys30m: number;
  sells30m: number;
  buyers30m: number;
  sellers30m: number;
  buyVolumeInUsd30m: string;
  sellVolumeInUsd30m: string;
  price30m: string;

  buys1h: number;
  sells1h: number;
  buyers1h: number;
  sellers1h: number;
  buyVolumeInUsd1h: string;
  sellVolumeInUsd1h: string;
  price1h: string;

  buys4h: number;
  sells4h: number;
  buyers4h: number;
  sellers4h: number;
  buyVolumeInUsd4h: string;
  sellVolumeInUsd4h: string;
  price4h: string;

  buys24h: number;
  sells24h: number;
  buyers24h: number;
  sellers24h: number;
  buyVolumeInUsd24h: string;
  sellVolumeInUsd24h: string;
  price24h: string;
  price: string;
}

export interface TokenHolder {
  tokenAddress: string;
  holders: number;
  timestamp: number;
}

export interface WalletBalance {
  walletAddress: string;
  tokenAddress: string;
  tokenPriceInUsd: string;
  timestamp: number;
  buyAmount: string;
  buyAmountInUsd: string;
  buys: string;
  sellAmount: string;
  sellAmountInUsd: string;
  sells: string;
  averageBuyPrice: string;
  averageSellPrice: string; 
  unrealizedProfitInUsd: string;
  unrealizedProfitRatio: string;
  realizedProfitInUsd: string;
  realizedProfitRatio: string;
  totalRealizedProfitInUsd: string;
  totalRealizedProfitRatio: string;
}