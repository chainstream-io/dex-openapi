import { Resolution } from "../openapi";



export enum TokenActivityType {
  Sell = "sell",
  Buy = "buy",
  AddLiquidity = "add_liquidity",
  RemoveLiquidity = "remove_liquidity",
}

export enum ChannelType {
  New = "new",
  HOT = "trending",
  US_STOCKS = "us_stocks",
  COMPLETED = "completed",
  GRADUATED = "graduated",
}

export enum MetricType {
  LIQUIDITY_IN_USD = "liquidity_in_usd",
  MIGRATED_RATIO = "migrated_ratio",
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
  buys1m?: number;
  sells1m?: number;
  buyers1m?: number;
  sellers1m?: number;
  buyVolumeInUsd1m?: string;
  sellVolumeInUsd1m?: string;
  price1m?: string;
  openInUsd1m?: string;
  closeInUsd1m?: string;

  buys5m?: number;
  sells5m?: number;
  buyers5m?: number;
  sellers5m?: number;
  buyVolumeInUsd5m?: string;
  sellVolumeInUsd5m?: string;
  price5m?: string;
  openInUsd5m?: string;
  closeInUsd5m?: string;

  buys15m?: number;
  sells15m?: number;
  buyers15m?: number;
  sellers15m?: number;
  buyVolumeInUsd15m?: string;
  sellVolumeInUsd15m?: string;
  price15m?: string;
  openInUsd15m?: string;
  closeInUsd15m?: string;

  buys30m?: number;
  sells30m?: number;
  buyers30m?: number;
  sellers30m?: number;
  buyVolumeInUsd30m?: string;
  sellVolumeInUsd30m?: string;
  price30m?: string;
  openInUsd30m?: string;
  closeInUsd30m?: string;

  buys1h?: number;
  sells1h?: number;
  buyers1h?: number;
  sellers1h?: number;
  buyVolumeInUsd1h?: string;
  sellVolumeInUsd1h?: string;
  price1h?: string;
  openInUsd1h?: string;
  closeInUsd1h?: string;

  buys4h?: number;
  sells4h?: number;
  buyers4h?: number;
  sellers4h?: number;
  buyVolumeInUsd4h?: string;
  sellVolumeInUsd4h?: string;
  price4h?: string;
  openInUsd4h?: string;
  closeInUsd4h?: string;

  buys24h?: number;
  sells24h?: number;
  buyers24h?: number;
  sellers24h?: number;
  buyVolumeInUsd24h?: string;
  sellVolumeInUsd24h?: string;
  price24h?: string;
  openInUsd24h?: string;
  closeInUsd24h?: string;

  price?: string;
}

export interface TokenHolder {
  tokenAddress: string;
  holders?: number;
  top100Amount?: string;
  top10Amount?: string;
  top100Holders?: number;
  top10Holders?: number;
  top100Ratio?: string;
  top10Ratio?: string;
  creatorsHolders?: number;
  creatorsAmount?: string;
  creatorsRatio?: string;
  timestamp: number;
}

export interface WalletBalance {
  walletAddress: string;
  tokenAddress: string;
  tokenPriceInUsd: string;
  balance: string;
  timestamp: number;
}

export interface WalletPnl {
  walletAddress: string;
  buys: number;
  buyAmount: string;
  buyAmountInUsd: string;
  averageBuyPriceInUsd: string;
  sellAmount: string;
  sellAmountInUsd: string;
  sells: number;
  wins: number;
  winRatio: string;
  pnlInUsd: string;
  averagePnlInUsd: string;
  pnlRatio: string;
  profitableDays: number;
  losingDays: number;
  tokens: number;
  resolution: string;
}

export interface NewToken {
  tokenAddress: string;
  name: string;
  symbol: string;
  createdAtMs: number;
}

export interface TokenSupply {
  tokenAddress: string;
  supply?: string;
  marketCapInUsd?: string;
  timestamp: number;
}

export interface DexPoolBalance {
  poolAddress: string;
  tokenAAddress: string;
  tokenALiquidityInUsd: string;
  tokenBAddress: string;
  tokenBLiquidityInUsd: string;
}

export interface TokenLiquidity {
  tokenAddress: string;
  metricType: MetricType;
  value: string;
  timestamp: number;
}

export interface DexProtocol {
  programAddress?: string;
  protocolFamily?: string;
  protocolName?: string;
}

export interface TokenBondingCurve {
  progressRatio?: string;
}

export interface TokenMetadata {
  tokenAddress: string;
  name?: string;
  decimals?: number;
  symbol?: string;
  imageUrl?: string;
  description?: string;
  socialMedia?: socialMedia;
  createdAtMs?: number;
  launchFrom?: DexProtocol;
  migratedTo?: DexProtocol;
}

export interface socialMedia {
  twitter?: string;
  telegram?: string;
  website?: string;
  tiktok?: string;
  discord?: string;
  facebook?: string;
  github?: string;
  instagram?: string;
  linkedin?: string;
  medium?: string;
  reddit?: string;
  youtube?: string;
  bitbucket?: string;
}

export interface TokenCandle {
  open: string;
  close: string;
  high: string;
  low: string;
  volume: string;
  resolution: Resolution;
  time: number;
  number: number;
}

export interface TradeActivity {
  tokenAddress: string;
  timestamp: number;
  kind: string;
  buyAmount: string;
  buyAmountInUsd: string;
  buyTokenAddress: string;
  buyTokenName: string;
  buyTokenSymbol: string;
  buyWalletAddress: string;
  sellAmount: string;
  sellAmountInUsd: string;
  sellTokenAddress: string;
  sellTokenName: string;
  sellTokenSymbol: string;
  sellWalletAddress: string;
  txHash: string;
}

export interface WalletTokenPnl {
  walletAddress: string;
  tokenAddress: string;
  tokenPriceInUsd: string;
  timestamp: number;
  opentime: number;
  lasttime: number;
  closetime: number;
  buyAmount: string;
  buyAmountInUsd: string;
  buyCount: number;
  buyCount30d: number;
  buyCount7d: number;
  sellAmount: string;
  sellAmountInUsd: string;
  sellCount: number;
  sellCount30d: number;
  sellCount7d: number;
  heldDurationTimestamp: number;
  averageBuyPriceInUsd: string;
  averageSellPriceInUsd: string;
  unrealizedProfitInUsd: string;
  unrealizedProfitRatio: string;
  realizedProfitInUsd: string;
  realizedProfitRatio: string;
  totalRealizedProfitInUsd: string;
  totalRealizedProfitRatio: string;
}

export enum RankingType {
  NEW = "new",
  HOT = "trending",
  STOCKS = "stocks",
  FINALSTRETCH = "completed",
  MIGRATED = "graduated",
}

export enum Dex {
  PUMP_FUN = "pump_fun",
  RAYDIUM_LAUNCHPAD = "raydium_launchpad",
  METEOR_DYNAMIC_BOUNDING_CURVE = "meteora_dynamic_bounding_curve",
  BONK_FUN = "bonk_fun",
  BOOP_FUN = "boop_fun",
  MOONIT_FUN = "moonit_fun",
}

export interface RankingTokenList {
  metadata?: TokenMetadata;
  holder?: TokenHolder;
  supply?: TokenSupply;
  stat?: TokenStat;
  bondingCurve?: TokenBondingCurve;
}