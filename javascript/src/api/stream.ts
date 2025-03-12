import { Centrifuge, ConnectionTokenContext } from "centrifuge";
import { DexRequestContext } from "..";
import { TokenStat, TokenHolder, WalletBalance } from "./stream.model";
import { Candle, Resolution, TradeEvent } from "../openapi";


export interface Unsubscrible {
  unsubscribe(): void;
}

export class StreamApi {
  private realtimeClient: Centrifuge;
  private listenersMap: Map<string, Set<(data: any) => void>>;

  constructor(context: DexRequestContext) {
    const realtimeEndpoint = context.streamUrl;
    this.realtimeClient = new Centrifuge(realtimeEndpoint, {
      getToken: async (_ctx: ConnectionTokenContext) => {
        return context.accessToken as string;
      },
    });

    this.realtimeClient.on("connected", () => {
      console.log("[streaming] connected");
    }).on("disconnected", (err) => {
      console.warn("[streaming] disconnected", err);
    }).on("error", (err) => {
      console.error("[streaming] error: ", err);
    });

    this.listenersMap = new Map();
  }

  connect() {
    this.realtimeClient.connect();
  }

  subscribe<T = any>(channel: string, fn: (data: T) => void): Unsubscrible {
    let sub = this.realtimeClient.getSubscription(channel);
    let listeners = this.listenersMap.get(channel);

    if (!sub) {
      listeners = new Set();
      this.listenersMap.set(channel, listeners);

      console.log("[xrealtime] create new sub: ", channel);
      sub = this.realtimeClient.newSubscription(channel, {
        delta: "fossil",
      });

      sub.on("subscribed", () => {
        console.log("[xrealtime] subscribed", channel);
      }).on("unsubscribed", () => {
        console.log("[xrealtime] unsubscribed", channel);
      }).on("publication", (ctx) => {
        // console.log('[xrealtime] publication, ctx.data: ', ctx.data);
        listeners?.forEach((it) => it(ctx.data));
      }).subscribe();
    }

    listeners?.add(fn);

    return new StreamUnsubscrible<T>(this, channel, fn);
  }

  unsubscribe<T = any>(channel: string, fn: (data: T) => void) {
    const listeners = this.listenersMap.get(channel);
    if (!listeners) {
      return;
    }

    listeners.delete(fn);
    console.log("unsubscribe, remain listeners: ", listeners.size);

    if (listeners.size === 0) {
      console.log("unsubscribe channel: ", channel);

      const sub = this.realtimeClient.getSubscription(channel);
      if (sub) {
        sub.unsubscribe();
        this.realtimeClient.removeSubscription(sub);
      }

      this.listenersMap.delete(channel);
    }
  }

  private formatScientificNotation(value: any): string {
    if (value === null || value === undefined) {
      return "0";
    }
    
    const strValue = value.toString();
    if (strValue.includes("e-") || strValue.includes("E-")) {
      return Number(value).toFixed(20).replace(/\.?0+$/, "");
    }
    
    return strValue;
  }

  subscribeTokenCandles({
    chain,
    tokenAddress,
    resolution,
    callback,
  }: {
    chain: string;
    tokenAddress: string;
    resolution: Resolution;
    callback: (data: Candle) => void;
  }): Unsubscrible {
    const channel = `dex-candle:${chain}_${tokenAddress}_${resolution}`;
    return this.subscribe(channel, (data: any) => {
      callback({
        open: data.o,
        close: data.c,
        high: data.h,
        low: data.l,
        volume: data.v,
        resolution: data.r,
        time: data.t,
      });
    });
  }

  subscribeTokenStats({
    chain,
    tokenAddress,
    callback,
  }: {
    chain: string;
    tokenAddress: string;
    callback: (data: TokenStat) => void;
  }
  ): Unsubscrible {
    const channel = `dex-token-stats:${chain}_${tokenAddress}`;
    return this.subscribe(channel, (data: any) => callback({
        address: data.a,
        timestamp: data.t,
        buys1m: data.b1m,
        sells1m: data.s1m,
        buyers1m: data.be1m,
        sellers1m: data.se1m,
        buyVolumeInUsd1m: this.formatScientificNotation(data.bviu1m),
        sellVolumeInUsd1m: this.formatScientificNotation(data.sviu1m),
        price1m: this.formatScientificNotation(data.p1m),
        buys5m: data.b5m,
        sells5m: data.s5m,
        buyers5m: data.be5m,
        sellers5m: data.se5m,
        buyVolumeInUsd5m: this.formatScientificNotation(data.bviu5m),
        sellVolumeInUsd5m: this.formatScientificNotation(data.sviu5m),
        price5m: this.formatScientificNotation(data.p5m),
        buys15m: data.b15m,
        sells15m: data.s15m,
        buyers15m: data.be15m,
        sellers15m: data.se15m,
        buyVolumeInUsd15m: this.formatScientificNotation(data.bviu15m),
        sellVolumeInUsd15m: this.formatScientificNotation(data.sviu15m),
        price15m: this.formatScientificNotation(data.p15m),
        buys30m: data.b30m,
        sells30m: data.s30m,
        buyers30m: data.be30m,
        sellers30m: data.se30m,
        buyVolumeInUsd30m: this.formatScientificNotation(data.bviu30m),
        sellVolumeInUsd30m: this.formatScientificNotation(data.sviu30m),
        price30m: this.formatScientificNotation(data.p30m),
        buys1h: data.b1h,
        sells1h: data.s1h,
        buyers1h: data.be1h,
        sellers1h: data.se1h,
        buyVolumeInUsd1h: this.formatScientificNotation(data.bviu1h),
        sellVolumeInUsd1h: this.formatScientificNotation(data.sviu1h),
        price1h: this.formatScientificNotation(data.p1h),
        buys4h: data.b4h,
        sells4h: data.s4h,
        buyers4h: data.be4h,
        sellers4h: data.se4h,
        buyVolumeInUsd4h: this.formatScientificNotation(data.bviu4h),
        sellVolumeInUsd4h: this.formatScientificNotation(data.sviu4h),
        price4h: this.formatScientificNotation(data.p4h),
        buys24h: data.b24h,
        sells24h: data.s24h,
        buyers24h: data.be24h,
        sellers24h: data.se24h,
        buyVolumeInUsd24h: this.formatScientificNotation(data.bviu24h),
        sellVolumeInUsd24h: this.formatScientificNotation(data.sviu24h),
        price24h: this.formatScientificNotation(data.p24h),
        price: this.formatScientificNotation(data.p),
      } as TokenStat));
    }

  // subscribeTokenActivities({
  //   chain,
  //   tokenAddress,
  //   callback,
  // }: {
  //   chain: string;
  //   tokenAddress: string;
  //   callback: (data: TokenActivity[]) => void;
  // }): Unsubscrible {
  //   const channel = `dex-token-activities:${chain}_${tokenAddress}`;
  //   return this.subscribe(channel, callback);
  // }

  subscribeTokenTrades({
    chain,
    tokenAddress,
    callback,
  }: {
    chain: string;
    tokenAddress: string;
    callback: (data: TradeEvent[]) => void;
  }): Unsubscrible {
    const channel = `dex-trades:${chain}_${tokenAddress}`;
    return this.subscribe(channel, (data: any[]) => callback(
      data?.map((it: any) => ({
        maker: it.bwa,
        baseAmount: it.ba,
        quoteAmount: it.sa,
        // quoteSymbol: ,
        quoteAddress: it.swa,
        amountInUsd: it.baiu,
        timestamp: it.t,
        event: it.k,
        txHash: it.h,
        // priceInUsd: ,
        // id: ,
        // buyCostUsd: it.,
        tokenAddress: it.a,
      } as TradeEvent))
    ));
  }

  subscribeWalletBalance({
    chain,
    walletAddress,
    callback,
  }: {
    chain: string;
    walletAddress: string;
    callback: (data: WalletBalance[]) => void;
  }): Unsubscrible {
    const channel = `dex-wallet-balance:${chain}_${walletAddress}`;
    return this.subscribe(channel, (data: any) => callback([{
      walletAddress: data.a,
      tokenAddress: data.ta,
      tokenPriceInUsd: data.tpiu,
      timestamp: data.t,
      buyAmount: data.ba,
      buyAmountInUsd: data.baiu,
      buys: data.bs,
      sellAmount: data.sa,
      sellAmountInUsd: data.saiu,
      sells: data.ss,
      averageBuyPrice: data.abp,
      averageSellPrice: data.asp,
      unrealizedProfitInUsd: data.upiu,
      unrealizedProfitRatio: this.formatScientificNotation(data.upr),
      realizedProfitInUsd: data.rpiu,
      realizedProfitRatio: this.formatScientificNotation(data.rpr),
      totalRealizedProfitInUsd: data.trpiu,
      totalRealizedProfitRatio: this.formatScientificNotation(data.trr),
    } as WalletBalance]));
  }

  subscribeTokenHolders({
    chain,
    tokenAddress,
    callback,
  }: {
    chain: string;
    tokenAddress: string;
    callback: (data: TokenHolder) => void;
  }
  ): Unsubscrible {
    const channel = `dex-token-general-stat-num:${chain}_${tokenAddress}`;
    return this.subscribe(channel, (data: any) => callback({
      tokenAddress: data.a,
      holders: data.v,
      timestamp: data.ts,
    }));
  }
}
class StreamUnsubscrible<T> {
  constructor(
    private readonly streamApi: StreamApi,
    private readonly channel: string,
    private readonly fn: (data: T) => void
  ) { }

  unsubscribe() {
    this.streamApi.unsubscribe(this.channel, this.fn);
  }
}
