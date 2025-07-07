import { Centrifuge, ConnectionTokenContext } from "centrifuge";
import { DexRequestContext } from "..";
import { Candle, Resolution, TradeEvent } from "../openapi";
import {
  DexPoolBalance,
  NewToken,
  NewTokenMetadata,
  TokenHolder,
  TokenStat,
  TokenLiquidity,
  WalletBalance,
  TokenSupply,
  WalletPnl,
  ChannelType,
} from "./stream.model";

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
        return typeof context.accessToken === "string"
          ? context.accessToken
          : await context.accessToken.getToken();
      },
    });

    this.realtimeClient
      .on("connected", () => {
        console.log("[streaming] connected");
      })
      .on("disconnected", (err) => {
        console.warn("[streaming] disconnected", err);
      })
      .on("error", (err) => {
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

      sub
        .on("subscribed", () => {
          console.log("[xrealtime] subscribed", channel);
        })
        .on("unsubscribed", () => {
          console.log("[xrealtime] unsubscribed", channel);
        })
        .on("publication", (ctx) => {
          // console.log('[xrealtime] publication, ctx.data: ', ctx.data);
          listeners?.forEach((it) => it(ctx.data));
        })
        .subscribe();
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
      return Number(value)
        .toFixed(20)
        .replace(/\.?0+$/, "");
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

  subscribeTokenCandlesV1({
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
    const channel = `dex-candle-v1:${chain}_${tokenAddress}_${resolution}`;
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
  }): Unsubscrible {
    const channel = `dex-token-stats:${chain}_${tokenAddress}`;
    return this.subscribe(channel, (data: any) =>
      callback({
        address: data.a,
        timestamp: data.t,
        buys1m: data.b1m,
        sells1m: data.s1m,
        buyers1m: data.be1m,
        sellers1m: data.se1m,
        buyVolumeInUsd1m: this.formatScientificNotation(data.bviu1m),
        sellVolumeInUsd1m: this.formatScientificNotation(data.sviu1m),
        price1m: this.formatScientificNotation(data.p1m),
        openInUsd1m: this.formatScientificNotation(data.oiu1m),
        closeInUsd1m: this.formatScientificNotation(data.ciu1m),
        buys5m: data.b5m,
        sells5m: data.s5m,
        buyers5m: data.be5m,
        sellers5m: data.se5m,
        buyVolumeInUsd5m: this.formatScientificNotation(data.bviu5m),
        sellVolumeInUsd5m: this.formatScientificNotation(data.sviu5m),
        price5m: this.formatScientificNotation(data.p5m),
        openInUsd5m: this.formatScientificNotation(data.oiu5m),
        closeInUsd5m: this.formatScientificNotation(data.ciu5m),
        buys15m: data.b15m,
        sells15m: data.s15m,
        buyers15m: data.be15m,
        sellers15m: data.se15m,
        buyVolumeInUsd15m: this.formatScientificNotation(data.bviu15m),
        sellVolumeInUsd15m: this.formatScientificNotation(data.sviu15m),
        price15m: this.formatScientificNotation(data.p15m),
        openInUsd15m: this.formatScientificNotation(data.oiu15m),
        closeInUsd15m: this.formatScientificNotation(data.ciu15m),
        buys30m: data.b30m,
        sells30m: data.s30m,
        buyers30m: data.be30m,
        sellers30m: data.se30m,
        buyVolumeInUsd30m: this.formatScientificNotation(data.bviu30m),
        sellVolumeInUsd30m: this.formatScientificNotation(data.sviu30m),
        price30m: this.formatScientificNotation(data.p30m),
        openInUsd30m: this.formatScientificNotation(data.oiu30m),
        closeInUsd30m: this.formatScientificNotation(data.ciu30m),
        buys1h: data.b1h,
        sells1h: data.s1h,
        buyers1h: data.be1h,
        sellers1h: data.se1h,
        buyVolumeInUsd1h: this.formatScientificNotation(data.bviu1h),
        sellVolumeInUsd1h: this.formatScientificNotation(data.sviu1h),
        price1h: this.formatScientificNotation(data.p1h),
        openInUsd1h: this.formatScientificNotation(data.oiu1h),
        closeInUsd1h: this.formatScientificNotation(data.ciu1h),
        buys4h: data.b4h,
        sells4h: data.s4h,
        buyers4h: data.be4h,
        sellers4h: data.se4h,
        buyVolumeInUsd4h: this.formatScientificNotation(data.bviu4h),
        sellVolumeInUsd4h: this.formatScientificNotation(data.sviu4h),
        price4h: this.formatScientificNotation(data.p4h),
        openInUsd4h: this.formatScientificNotation(data.oiu4h),
        closeInUsd4h: this.formatScientificNotation(data.ciu4h),
        buys24h: data.b24h,
        sells24h: data.s24h,
        buyers24h: data.be24h,
        sellers24h: data.se24h,
        buyVolumeInUsd24h: this.formatScientificNotation(data.bviu24h),
        sellVolumeInUsd24h: this.formatScientificNotation(data.sviu24h),
        price24h: this.formatScientificNotation(data.p24h),
        price: this.formatScientificNotation(data.p),
        openInUsd24h: this.formatScientificNotation(data.oiu24h),
        closeInUsd24h: this.formatScientificNotation(data.ciu24h),
      } as TokenStat)
    );
  }

  subscribeRankingTokensStats({
    chain,
    channelType,
    callback,
  }: {
    chain: string;
    channelType: ChannelType;
    callback: (data: TokenStat[]) => void;
  }): Unsubscrible {
    const channel = `dex-ranking-token-stats-list:${chain}_${channelType}`;
    return this.subscribe(channel, (data: any[]) =>
      callback(
        data?.map(
          (it: any) =>
            ({
              address: it.a,
              timestamp: it.t,
              buys1m: it.b1m,
              sells1m: it.s1m,
              buyers1m: it.be1m,
              sellers1m: it.se1m,
              buyVolumeInUsd1m: this.formatScientificNotation(it.bviu1m),
              sellVolumeInUsd1m: this.formatScientificNotation(it.sviu1m),
              price1m: this.formatScientificNotation(it.p1m),
              openInUsd1m: this.formatScientificNotation(it.oiu1m),
              closeInUsd1m: this.formatScientificNotation(it.ciu1m),
              buys5m: it.b5m,
              sells5m: it.s5m,
              buyers5m: it.be5m,
              sellers5m: it.se5m,
              buyVolumeInUsd5m: this.formatScientificNotation(it.bviu5m),
              sellVolumeInUsd5m: this.formatScientificNotation(it.sviu5m),
              price5m: this.formatScientificNotation(it.p5m),
              openInUsd5m: this.formatScientificNotation(it.oiu5m),
              closeInUsd5m: this.formatScientificNotation(it.ciu5m),
              buys15m: it.b15m,
              sells15m: it.s15m,
              buyers15m: it.be15m,
              sellers15m: it.se15m,
              buyVolumeInUsd15m: this.formatScientificNotation(it.bviu15m),
              sellVolumeInUsd15m: this.formatScientificNotation(it.sviu15m),
              price15m: this.formatScientificNotation(it.p15m),
              openInUsd15m: this.formatScientificNotation(it.oiu15m),
              closeInUsd15m: this.formatScientificNotation(it.ciu15m),
              buys30m: it.b30m,
              sells30m: it.s30m,
              buyers30m: it.be30m,
              sellers30m: it.se30m,
              buyVolumeInUsd30m: this.formatScientificNotation(it.bviu30m),
              sellVolumeInUsd30m: this.formatScientificNotation(it.sviu30m),
              price30m: this.formatScientificNotation(it.p30m),
              openInUsd30m: this.formatScientificNotation(it.oiu30m),
              closeInUsd30m: this.formatScientificNotation(it.ciu30m),
              buys1h: it.b1h,
              sells1h: it.s1h,
              buyers1h: it.be1h,
              sellers1h: it.se1h,
              buyVolumeInUsd1h: this.formatScientificNotation(it.bviu1h),
              sellVolumeInUsd1h: this.formatScientificNotation(it.sviu1h),
              price1h: this.formatScientificNotation(it.p1h),
              openInUsd1h: this.formatScientificNotation(it.oiu1h),
              closeInUsd1h: this.formatScientificNotation(it.ciu1h),
              buys4h: it.b4h,
              sells4h: it.s4h,
              buyers4h: it.be4h,
              sellers4h: it.se4h,
              buyVolumeInUsd4h: this.formatScientificNotation(it.bviu4h),
              sellVolumeInUsd4h: this.formatScientificNotation(it.sviu4h),
              price4h: this.formatScientificNotation(it.p4h),
              openInUsd4h: this.formatScientificNotation(it.oiu4h),
              closeInUsd4h: this.formatScientificNotation(it.ciu4h),
              buys24h: it.b24h,
              sells24h: it.s24h,
              buyers24h: it.be24h,
              sellers24h: it.se24h,
              buyVolumeInUsd24h: this.formatScientificNotation(it.bviu24h),
              sellVolumeInUsd24h: this.formatScientificNotation(it.sviu24h),
              price24h: this.formatScientificNotation(it.p24h),
              price: this.formatScientificNotation(it.p),
              openInUsd24h: this.formatScientificNotation(it.oiu24h),
              closeInUsd24h: this.formatScientificNotation(it.ciu24h),
            }) as TokenStat
        )
      )
    );
  }

  subscribeTokenHolders({
    chain,
    tokenAddress,
    callback,
  }: {
    chain: string;
    tokenAddress: string;
    callback: (data: TokenHolder) => void;
  }): Unsubscrible {
    const channel = `dex-token-holding:${chain}_${tokenAddress}`;
    return this.subscribe(channel, (data: any) => {
      callback({
        tokenAddress: data.a,
        holders: data.h,
        top100Amount: this.formatScientificNotation(data.t100a),
        top10Amount: this.formatScientificNotation(data.t10a),
        top100Holders: data.t100h,
        top10Holders: data.t10h,
        top100Ratio: this.formatScientificNotation(data.t100r),
        top10Ratio: this.formatScientificNotation(data.t10r),
        timestamp: data.ts,
      });
    });
  }

  subscribeRankingTokensHolders({
    chain,
    channelType,
    callback,
  }: {
    chain: string;
    channelType: ChannelType;
    callback: (data: TokenHolder[]) => void;
  }): Unsubscrible {
    const channel = `dex-ranking-token-holding-list:${chain}_${channelType}`;
    return this.subscribe(channel, (data: any[]) =>
      callback(
        data?.map(
          (it: any) =>
            ({
              tokenAddress: it.a,
              holders: it.h,
              top100Amount: this.formatScientificNotation(it.t100a),
              top10Amount: this.formatScientificNotation(it.t10a),
              top100Holders: it.t100h,
              top10Holders: it.t10h,
              top100Ratio: this.formatScientificNotation(it.t100r),
              top10Ratio: this.formatScientificNotation(it.t10r),
              timestamp: it.ts,
            }) as TokenHolder
        )
      )
    );
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
    return this.subscribe(channel, (data: any[]) =>
      callback(
        data?.map(
          (it: any) =>
            ({
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
            }) as TradeEvent
        )
      )
    );
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
    return this.subscribe(channel, (data: any) =>
      callback([
        {
          walletAddress: data.a,
          tokenAddress: data.ta,
          tokenPriceInUsd: data.tpiu,
          timestamp: data.t,
        } as WalletBalance,
      ])
    );
  }

  subscribeWalletPnl({
    chain,
    walletAddress,
    callback,
  }: {
    chain: string;
    walletAddress: string;
    callback: (data: WalletPnl[]) => void;
  }): Unsubscrible {
    const channel = `dex-wallet-pnl-list:${chain}_${walletAddress}`;
    return this.subscribe(channel, (data: any[]) =>
      callback(
        data?.map(
          (it: any) =>
            ({
              walletAddress: it.a,
              buys: it.bs,
              buyAmount: it.ba,
              buyAmountInUsd: it.baiu,
              averageBuyPriceInUsd: it.abpiu,
              sellAmount: it.sa,
              sellAmountInUsd: it.saiu,
              sells: it.ss,
              wins: it.ws,
              winRatio: it.wr,
              pnlInUsd: it.piu,
              averagePnlInUsd: it.apiu,
              pnlRatio: it.pr,
              profitableDays: it.pd,
              losingDays: it.ld,
              tokens: it.ts,
              resolution: it.r,
            }) as WalletPnl
        )
      )
    );
  }

  subscribeNewTokensMetadata({
    chain,
    callback,
  }: {
    chain: string;
    callback: (data: NewTokenMetadata[]) => void;
  }): Unsubscrible {
    const channel = `dex-new-tokens-metadata:${chain}`;
    return this.subscribe(channel, (data: any[]) =>
      callback(
        data.map(
          (it: any) =>
            ({
              tokenAddress: it.a,
              name: it.n,
              symbol: it.s,
              imageUrl: it.iu,
              description: it.de,
              socialMedia: {
                twitter: it.sm?.tw || "",
                telegram: it.sm?.tg || "",
                website: it.sm?.w || "",
                tiktok: it.sm?.tt || "",
                discord: it.sm?.dc || "",
                facebook: it.sm?.fb || "",
                github: it.sm?.gh || "",
                instagram: it.sm?.ig || "",
                linkedin: it.sm?.li || "",
                medium: it.sm?.md || "",
                reddit: it.sm?.rd || "",
                youtube: it.sm?.yt || "",
                bitbucket: it.sm?.bb || "",
              },
              createdAtMs: it.cts,
            }) as NewTokenMetadata
        )
      )
    );
  }

  subscribeNewTokens({
    chain,
    callback,
  }: {
    chain: string;
    callback: (data: NewToken[]) => void;
  }): Unsubscrible {
    const channel = `dex-new-tokens:${chain}`;
    return this.subscribe(channel, (data: any[]) =>
      callback(
        data.map(
          (it: any) =>
            ({
              tokenAddress: it.a,
              name: it.n,
              symbol: it.s,
              description: it.de,
              createdAtMs: it.cts,
            }) as NewToken
        )
      )
    );
  }

  subscribeTokenSupply({
    chain,
    tokenAddress,
    callback,
  }: {
    chain: string;
    tokenAddress: string;
    callback: (data: TokenSupply) => void;
  }): Unsubscrible {
    const channel = `dex-token-supply:${chain}_${tokenAddress}`;
    return this.subscribe(channel, (data: any) =>
      callback({
        tokenAddress: data.a,
        supply: data.s,
        marketCapInUsd: data.mc,
        timestamp: data.ts,
      })
    );
  }

  subscribeRankingTokensSupply({
    chain,
    channelType,
    callback,
  }: {
    chain: string;
    channelType: ChannelType;
    callback: (data: TokenSupply[]) => void;
  }): Unsubscrible {
    const channel = `dex-ranking-token-supply-list:${chain}_${channelType}`;
    return this.subscribe(channel, (data: any[]) =>
      callback(
        data?.map(
          (it: any) =>
            ({
              tokenAddress: it.a,
              supply: it.s,
              marketCapInUsd: it.mc,
              timestamp: it.ts,
            }) as TokenSupply
        )
      )
    );
  }

  subscribeDexPoolBalance({
    chain,
    poolAddress,
    callback,
  }: {
    chain: string;
    poolAddress: string;
    callback: (data: DexPoolBalance) => void;
  }): Unsubscrible {
    const channel = `dex-pool-balance:${chain}_${poolAddress}`;
    return this.subscribe(channel, (data: any) =>
      callback({
        poolAddress: data.a,
        tokenAAddress: data.taa,
        tokenALiquidityInUsd: data.taliu,
        tokenBAddress: data.tba,
        tokenBLiquidityInUsd: data.tbliu,
      })
    );
  }

  subscribeTokenLiquidity({
    chain,
    tokenAddress,
    callback,
  }: {
    chain: string;
    tokenAddress: string;
    callback: (data: TokenLiquidity) => void;
  }): Unsubscrible {
    const channel = `dex-token-general-stat-num:${chain}_${tokenAddress}`;
    return this.subscribe(channel, (data: any) =>
      callback({
        tokenAddress: data.a,
        metricType: data.t,
        value: data.v,
        timestamp: data.ts,
      })
    );
  }

  subscribeRankingTokensLiquidity({
    chain,
    channelType,
    callback,
  }: {
    chain: string;
    channelType: ChannelType;
    callback: (data: TokenLiquidity[]) => void;
  }): Unsubscrible {
    const channel = `dex-ranking-token-general_stat_num-list:${chain}_${channelType}`;
    return this.subscribe(channel, (data: any[]) =>
      callback(
        data?.map(
          (it: any) =>
            ({
              tokenAddress: it.a,
              metricType: it.t,
              value: it.v,
              timestamp: it.ts,
            }) as TokenLiquidity
        )
      )
    );
  }

  subscribeWalletTrade({
    chain,
    walletAddress,
    callback,
  }: {
    chain: string;
    walletAddress: string;
    callback: (data: TradeEvent) => void;
  }): Unsubscrible {
    const channel = `dex-wallet-trade:${chain}_${walletAddress}`;
    return this.subscribe(channel, (data: any) =>
      callback({
        maker: data.bwa,
        baseAmount: data.ba,
        quoteAmount: data.sa,
        quoteAddress: data.swa,
        amountInUsd: data.baiu,
        timestamp: data.t,
        event: data.k,
        txHash: data.h,
        tokenAddress: data.a,
      } as TradeEvent)
    );
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
