import { Centrifuge, ConnectionTokenContext } from "centrifuge";
import { DexRequestContext } from "..";
import { TokenActivity, TokenStat, TokenHolder, WalletBalance } from "./stream.model";
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

  subscribeTokenStat({
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
    return this.subscribe(channel, callback);
  }

  subscribeTokenActivities({
    chain,
    tokenAddress,
    callback,
  }: {
    chain: string;
    tokenAddress: string;
    callback: (data: TokenActivity[]) => void;
  }): Unsubscrible {
    const channel = `dex-token-activities:${chain}_${tokenAddress}`;
    return this.subscribe(channel, callback);
  }

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
        amountInUsd: it.bais,
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

  subscribeBalance({
    chain,
    address,
    callback,
  }: {
    chain: string;
    address: string;
    callback: (data: any) => void;
  }): Unsubscrible {
    const channel = `dex-balance:${chain}_${address}`;
    return this.subscribe(channel, callback);
  }

  subscribeBalanceForToken({
    chain,
    walletAddress,
    tokenAddress,
    fn,
  }: {
    chain: string;
    tokenAddress: string;
    walletAddress: string;
    fn: (data: any) => void;
  }): Unsubscrible {
    const channel = `dex-token-balance:${chain}_${tokenAddress}_${walletAddress}`;
    return this.subscribe(channel, fn);
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
      wallet_address: data.a,
      token_address: data.ta,
      token_price_in_usd: data.tpiu,
      timestamp: data.t,
      buy_amount: data.ba,
      buy_amount_in_usd: data.baiu,
      buys: data.bs,
      sell_amount: data.sa,
      sell_amount_in_usd: data.saiu,
      sells: data.ss,
      average_buy_price: data.abp,
      average_sell_price: data.asp,
      unrealized_profit_in_usd: data.upiu,
      unrealized_profit_ratio: data.upr,
      realized_profit_in_usd: data.rpiu,
      realized_profit_ratio: data.rpr,
      total_realized_profit_in_usd: data.trpiu,
      total_realized_profit_ratio: data.trr,
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
      token_address: data.a,
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
