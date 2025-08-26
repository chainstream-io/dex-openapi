/**
 * Field mappings for CEL filter expressions
 * Maps human-readable field names to short field names used in the API
 * Organized by subscription method to handle field name conflicts
 */

export interface FieldMapping {
  readonly [key: string]: string;
}

export interface MethodFieldMappings {
  readonly [methodName: string]: FieldMapping;
}

/**
 * Field mappings organized by subscription method
 * Each method can have its own field mappings to handle conflicts
 */
export const CEL_FIELD_MAPPINGS: MethodFieldMappings = {
  // Wallet balance subscription fields
  "subscribeWalletBalance": {
    "walletAddress": "a",
    "tokenAddress": "ta",
    "tokenPriceInUsd": "tpiu",
    "balance": "b",
    "timestamp": "t",
  },

  // Token candles subscription fields
  "subscribeTokenCandles": {
    "open": "o",
    "close": "c",
    "high": "h",
    "low": "l",
    "volume": "v",
    "resolution": "r",
    "time": "t",
    "number": "n",
  },

  // Token stats subscription fields
  "subscribeTokenStats": {
    "address": "a",
    "timestamp": "t",
    "buys1m": "b1m",
    "sells1m": "s1m",
    "buyers1m": "be1m",
    "sellers1m": "se1m",
    "buyVolumeInUsd1m": "bviu1m",
    "sellVolumeInUsd1m": "sviu1m",
    "price1m": "p1m",
    "openInUsd1m": "oiu1m",
    "closeInUsd1m": "ciu1m",
    "buys5m": "b5m",
    "sells5m": "s5m",
    "buyers5m": "be5m",
    "sellers5m": "se5m",
    "buyVolumeInUsd5m": "bviu5m",
    "sellVolumeInUsd5m": "sviu5m",
    "price5m": "p5m",
    "openInUsd5m": "oiu5m",
    "closeInUsd5m": "ciu5m",
    "buys15m": "b15m",
    "sells15m": "s15m",
    "buyers15m": "be15m",
    "sellers15m": "se15m",
    "buyVolumeInUsd15m": "bviu15m",
    "sellVolumeInUsd15m": "sviu15m",
    "price15m": "p15m",
    "openInUsd15m": "oiu15m",
    "closeInUsd15m": "ciu15m",
    "buys30m": "b30m",
    "sells30m": "s30m",
    "buyers30m": "be30m",
    "sellers30m": "se30m",
    "buyVolumeInUsd30m": "bviu30m",
    "sellVolumeInUsd30m": "sviu30m",
    "price30m": "p30m",
    "openInUsd30m": "oiu30m",
    "closeInUsd30m": "ciu30m",
    "buys1h": "b1h",
    "sells1h": "s1h",
    "buyers1h": "be1h",
    "sellers1h": "se1h",
    "buyVolumeInUsd1h": "bviu1h",
    "sellVolumeInUsd1h": "sviu1h",
    "price1h": "p1h",
    "openInUsd1h": "oiu1h",
    "closeInUsd1h": "ciu1h",
    "buys4h": "b4h",
    "sells4h": "s4h",
    "buyers4h": "be4h",
    "sellers4h": "se4h",
    "buyVolumeInUsd4h": "bviu4h",
    "sellVolumeInUsd4h": "sviu4h",
    "price4h": "p4h",
    "openInUsd4h": "oiu4h",
    "closeInUsd4h": "ciu4h",
    "buys24h": "b24h",
    "sells24h": "s24h",
    "buyers24h": "be24h",
    "sellers24h": "se24h",
    "buyVolumeInUsd24h": "bviu24h",
    "sellVolumeInUsd24h": "sviu24h",
    "price24h": "p24h",
    "price": "p",
    "openInUsd24h": "oiu24h",
    "closeInUsd24h": "ciu24h",
  },

  // Token holder subscription fields
  "subscribeTokenHolders": {
    "tokenAddress": "a",
    "holders": "h",
    "top100Amount": "t100a",
    "top10Amount": "t10a",
    "top100Holders": "t100h",
    "top10Holders": "t10h",
    "top100Ratio": "t100r",
    "top10Ratio": "t10r",
    "timestamp": "ts",
  },

  // New token subscription fields
  "subscribeNewToken": {
    "tokenAddress": "a",
    "name": "n",
    "symbol": "s",
    "createdAtMs": "cts",
  },

  // Token supply subscription fields
  "subscribeTokenSupply": {
    "tokenAddress": "a",
    "supply": "s",
    "timestamp": "ts",
  },

  // Dex pool balance subscription fields
  "subscribeDexPoolBalance": {
    "poolAddress": "a",
    "tokenAAddress": "taa",
    "tokenALiquidityInUsd": "taliu",
    "tokenBAddress": "tba",
    "tokenBLiquidityInUsd": "tbliu",
  },

  // Token liquidity subscription fields
  "subscribeTokenLiquidity": {
    "tokenAddress": "a",
    "metricType": "t",
    "value": "v",
    "timestamp": "ts",
  },

  // New token metadata subscription fields
  "subscribeNewTokensMetadata": {
    "tokenAddress": "a",
    "name": "n",
    "symbol": "s",
    "imageUrl": "iu",
    "description": "de",
    "socialMedia": "sm",
    "createdAtMs": "cts",
  },

  // Token trades subscription fields
  "subscribeTokenTrades": {
    "tokenAddress": "a",
    "timestamp": "t",
    "kind": "k",
    "buyAmount": "ba",
    "buyAmountInUsd": "baiu",
    "buyTokenAddress": "btma",
    "buyTokenName": "btn",
    "buyTokenSymbol": "bts",
    "buyWalletAddress": "bwa",
    "sellAmount": "sa",
    "sellAmountInUsd": "saiu",
    "sellTokenAddress": "stma",
    "sellTokenName": "stn",
    "sellTokenSymbol": "sts",
    "sellWalletAddress": "swa",
    "txHash": "h",
  },

  // Wallet token PnL subscription fields
  "subscribeWalletPnl": {
    "walletAddress": "a",
    "tokenAddress": "ta",
    "tokenPriceInUsd": "tpiu",
    "timestamp": "t",
    "opentime": "ot",
    "lasttime": "lt",
    "closetime": "ct",
    "buyAmount": "ba",
    "buyAmountInUsd": "baiu",
    "buyCount": "bs",
    "buyCount30d": "bs30d",
    "buyCount7d": "bs7d",
    "sellAmount": "sa",
    "sellAmountInUsd": "saiu",
    "sellCount": "ss",
    "sellCount30d": "ss30d",
    "sellCount7d": "ss7d",
    "heldDurationTimestamp": "hdts",
    "averageBuyPriceInUsd": "abpiu",
    "averageSellPriceInUsd": "aspiu",
    "unrealizedProfitInUsd": "upiu",
    "unrealizedProfitRatio": "upr",
    "realizedProfitInUsd": "rpiu",
    "realizedProfitRatio": "rpr",
    "totalRealizedProfitInUsd": "trpiu",
    "totalRealizedProfitRatio": "trr",
  },
} as const;

/**
 * Get field mappings for a specific subscription method
 * @param methodName - The name of the subscription method
 * @returns Field mapping object for the method, or empty object if not found
 */
export function getFieldMappings(methodName: string): FieldMapping {
  return CEL_FIELD_MAPPINGS[methodName] || {};
}

/**
 * Replace long field names with short field names in a filter expression
 * Automatically adds meta. prefix if not present
 * @param filter - Original filter expression
 * @param methodName - The name of the subscription method
 * @returns Filter expression with short field names and meta. prefix
 */
export function replaceFilterFields(filter: string, methodName: string): string {
  if (!filter) {return filter}
  
  const fieldMappings = getFieldMappings(methodName);
  let result = filter;
  
  // Replace all long field names with short field names
  for (const [longField, shortField] of Object.entries(fieldMappings)) {
    // Handle both cases: with and without meta. prefix
    const patterns = [
      // Pattern 1: fieldName (without meta. prefix)
      new RegExp(`\\b${longField}\\b`, "g"),
      // Pattern 2: meta.fieldName (with meta. prefix)
      new RegExp(`\\bmeta\\.${longField}\\b`, "g"),
    ];
    
    patterns.forEach((pattern) => {
      result = result.replace(pattern, `meta.${shortField}`);
    });
  }
  
  return result;
}

/**
 * Type-safe field mapping for specific subscription methods
 */
export type SubscriptionMethod = keyof typeof CEL_FIELD_MAPPINGS;

/**
 * Get available field names for a specific subscription method
 * @param methodName - The name of the subscription method
 * @returns Array of available field names
 */
export function getAvailableFields(methodName: string): string[] {
  const mappings = getFieldMappings(methodName);
  return Object.keys(mappings);
}
