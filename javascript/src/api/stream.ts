import { Centrifuge, ConnectionTokenContext } from "@chainstream-io/centrifuge";
import { DexRequestContext } from "..";
import { Resolution } from "../openapi";
import {
  DexPoolBalance,
  NewToken,
  TokenMetadata,
  TokenHolder,
  TokenStat,
  TokenLiquidity,
  WalletBalance,
  TokenSupply,
  WalletPnl,
  ChannelType,
  TokenCandle,
  TradeActivity,
  WalletTokenPnl,
  RankingType,
  Dex,
  RankingTokenList,
} from "./stream.model";
import { replaceFilterFields } from "./stream.fields";

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

  /**
   * Start batching commands for efficient bulk operations
   * All subscription commands after this call will be batched until stopBatching is called
   */
  startBatching() {
    this.realtimeClient.startBatching();
  }

  /**
   * Stop batching and flush all collected commands to the server
   * This will send all batched subscription commands in a single network request
   */
  stopBatching() {
    this.realtimeClient.stopBatching();
  }

  /**
   * Batch subscribe method that accepts a function containing subscription calls
   * All subscription methods called within the function will be batched
   * @param batchFunction Function containing subscription method calls
   * @returns Array of unsubscribe functions
   */
  batchSubscribe(batchFunction: () => Unsubscrible[]): Unsubscrible[] {
    // Start batching commands
    this.startBatching();

    // Execute the batch function (all subscription calls will be batched)
    const unsubscribles = batchFunction();

    // Stop batching and flush all commands
    this.stopBatching();

    return unsubscribles;
  }

  subscribe<T = any>(channel: string, fn: (data: T) => void, filter?: string, methodName?: string): Unsubscrible {
    let sub = this.realtimeClient.getSubscription(channel);
    let listeners = this.listenersMap.get(channel);

    if (!sub) {
      listeners = new Set();
      this.listenersMap.set(channel, listeners);

      console.log("[xrealtime] create new sub: ", channel);

      // Process filter expression with method-specific field mappings
      const processedFilter = filter && methodName ? replaceFilterFields(filter, methodName) : filter;

      sub = this.realtimeClient.newSubscription(channel, {
        delta: "fossil",
        ...(processedFilter && { filter: processedFilter }),
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
    filter,
  }: {
    chain: string;
    tokenAddress: string;
    resolution: Resolution;
    callback: (data: TokenCandle) => void;
    filter?: string;
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
        number: data.n,
      });
    }, filter, "subscribeTokenCandles");
  }

  subscribeTokenStats({
    chain,
    tokenAddress,
    callback,
    filter,
  }: {
    chain: string;
    tokenAddress: string;
    callback: (data: TokenStat) => void;
    filter?: string;
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
        openInUsd24h: this.formatScientificNotation(data.oiu24h),
        closeInUsd24h: this.formatScientificNotation(data.ciu24h),
        
        price: this.formatScientificNotation(data.p),
      }), filter, "subscribeTokenStats");
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
    filter,
  }: {
    chain: string;
    tokenAddress: string;
    callback: (data: TokenHolder) => void;
    filter?: string;
  }): Unsubscrible {
    const channel = `dex-token-holding:${chain}_${tokenAddress}`;
    return this.subscribe(channel, (data: any) =>
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
      }), filter, "subscribeTokenHolders");
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

  // subscribeTokenTrades({
  //   chain,
  //   tokenAddress,
  //   callback,
  // }: {
  //   chain: string;
  //   tokenAddress: string;
  //   callback: (data: TradeEvent[]) => void;
  // }): Unsubscrible {
  //   const channel = `dex-trades:${chain}_${tokenAddress}`;
  //   return this.subscribe(channel, (data: any[]) =>
  //     callback(
  //       data?.map(
  //         (it: any) =>
  //           ({
  //             maker: it.bwa,
  //             baseAmount: it.ba,
  //             quoteAmount: it.sa,
  //             // quoteSymbol: ,
  //             quoteAddress: it.swa,
  //             amountInUsd: it.baiu,
  //             timestamp: it.t,
  //             event: it.k,
  //             txHash: it.h,
  //             // priceInUsd: ,
  //             // id: ,
  //             // buyCostUsd: it.,
  //             tokenAddress: it.a,
  //           }) as TradeEvent
  //       )
  //     )
  //   );
  // }
  subscribeTokenTrades({
    chain,
    tokenAddress,
    callback,
    filter,
  }: {
    chain: string;
    tokenAddress: string;
    callback: (data: TradeActivity) => void;
    filter?: string;
  }): Unsubscrible {
    const channel = `dex-trade:${chain}_${tokenAddress}`;
    return this.subscribe(channel, (data: any) =>
      callback({
        tokenAddress: data.a,
        timestamp: data.t,
        kind: data.k,
        buyAmount: data.ba,
        buyAmountInUsd: data.baiu,
        buyTokenAddress: data.btma,
        buyTokenName: data.btn,
        buyTokenSymbol: data.bts,
        buyWalletAddress: data.bwa,
        sellAmount: data.sa,
        sellAmountInUsd: data.saiu,
        sellTokenAddress: data.stma,
        sellTokenName: data.stn,
        sellTokenSymbol: data.sts,
        sellWalletAddress: data.swa,
        txHash: data.h,
      }), filter, "subscribeTokenTrades");
  }

  subscribeWalletBalance({
    chain,
    walletAddress,
    callback,
    filter,
  }: {
    chain: string;
    walletAddress: string;
    callback: (data: WalletBalance[]) => void;
    filter?: string;
  }): Unsubscrible {
    const channel = `dex-wallet-balance:${chain}_${walletAddress}`;
    return this.subscribe(channel, (data: any) =>
      callback([
        {
          walletAddress: data.a,
          tokenAddress: data.ta,
          tokenPriceInUsd: data.tpiu,
          balance: data.b,
          timestamp: data.t,
        } as WalletBalance,
      ]), filter, "subscribeWalletBalance");
  }

  subscribeWalletPnl({
    chain,
    walletAddress,
    callback,
    filter,
  }: {
    chain: string;
    walletAddress: string;
    callback: (data: WalletTokenPnl) => void;
    filter?: string;
  }): Unsubscrible {
    const channel = `dex-wallet-token-pnl:${chain}_${walletAddress}`;
    return this.subscribe(channel, (data: any) =>
      callback({
        walletAddress: data.a,
        tokenAddress: data.ta,
        tokenPriceInUsd: data.tpiu,
        timestamp: data.t,
        opentime: data.ot,
        lasttime: data.lt,
        closetime: data.ct,
        buyAmount: data.ba,
        buyAmountInUsd: data.baiu,
        buyCount: data.bs,
        buyCount30d: data.bs30d,
        buyCount7d: data.bs7d,
        sellAmount: data.sa,
        sellAmountInUsd: data.saiu,
        sellCount: data.ss,
        sellCount30d: data.ss30d,
        sellCount7d: data.ss7d,
        heldDurationTimestamp: data.hdts,
        averageBuyPriceInUsd: data.abpiu,
        averageSellPriceInUsd: data.aspiu,
        unrealizedProfitInUsd: data.upiu,
        unrealizedProfitRatio: data.upr,
        realizedProfitInUsd: data.rpiu,
        realizedProfitRatio: data.rpr,
        totalRealizedProfitInUsd: data.trpiu,
        totalRealizedProfitRatio: data.trr,
      }), filter, "subscribeWalletPnl");
  }

  subscribeWalletPnlList({
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
    callback: (data: TokenMetadata[]) => void;
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
              socialMedia: (() => {
                const socialMedia: any = {};
                if (it.sm?.tw) {socialMedia.twitter = it.sm.tw}
                if (it.sm?.tg) {socialMedia.telegram = it.sm.tg}
                if (it.sm?.w) {socialMedia.website = it.sm.w}
                if (it.sm?.tt) {socialMedia.tiktok = it.sm.tt}
                if (it.sm?.dc) {socialMedia.discord = it.sm.dc}
                if (it.sm?.fb) {socialMedia.facebook = it.sm.fb}
                if (it.sm?.gh) {socialMedia.github = it.sm.gh}
                if (it.sm?.ig) {socialMedia.instagram = it.sm.ig}
                if (it.sm?.li) {socialMedia.linkedin = it.sm.li}
                if (it.sm?.md) {socialMedia.medium = it.sm.md}
                if (it.sm?.rd) {socialMedia.reddit = it.sm.rd}
                if (it.sm?.yt) {socialMedia.youtube = it.sm.yt}
                if (it.sm?.bb) {socialMedia.bitbucket = it.sm.bb}
                return socialMedia;
              })(),
              createdAtMs: it.cts,
            })
        )
      )
    );
  }

  // subscribeNewTokens({
  //   chain,
  //   callback,
  // }: {
  //   chain: string;
  //   callback: (data: NewToken[]) => void;
  // }): Unsubscrible {
  //   const channel = `dex-new-tokens:${chain}`;
  //   return this.subscribe(channel, (data: any[]) =>
  //     callback(
  //       data.map(
  //         (it: any) =>
  //           ({
  //             tokenAddress: it.a,
  //             name: it.n,
  //             symbol: it.s,
  //             description: it.de,
  //             createdAtMs: it.cts,
  //           }) as NewToken
  //       )
  //     )
  //   );
  // }

  subscribeNewToken({
    chain,
    callback,
    filter,
  }: {
    chain: string;
    callback: (data: NewToken) => void;
    filter?: string;
  }): Unsubscrible {
    const channel = `dex-new-token:${chain}`;
    return this.subscribe(channel, (data: any) =>
      callback({
        tokenAddress: data.a,
        name: data.n,
        symbol: data.s,
        createdAtMs: data.cts,
      }), filter, "subscribeNewToken");
  }

  subscribeTokenSupply({
    chain,
    tokenAddress,
    callback,
    filter,
  }: {
    chain: string;
    tokenAddress: string;
    callback: (data: TokenSupply) => void;
    filter?: string;
  }): Unsubscrible {
    const channel = `dex-token-supply:${chain}_${tokenAddress}`;
    return this.subscribe(channel, (data: any) =>
      callback({
        tokenAddress: data.a,
        supply: data.s,
        marketCapInUsd: data.mc,
        timestamp: data.ts,
      }), filter, "subscribeTokenSupply");
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
            })
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
    filter,
  }: {
    chain: string;
    tokenAddress: string;
    callback: (data: TokenLiquidity) => void;
    filter?: string;
  }): Unsubscrible {
    const channel = `dex-token-general-stat-num:${chain}_${tokenAddress}`;
    return this.subscribe(channel, (data: any) =>
      callback({
        tokenAddress: data.a,
        metricType: data.t,
        value: data.v,
        timestamp: data.ts,
      }), filter, "subscribeTokenLiquidity");
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

  subscribeRankingTokensList({
    chain,
    ranking_type,
    dex,
    callback,
  }: {
    chain: string;
    ranking_type: RankingType;
    dex?: Dex;
    callback: (data: RankingTokenList[]) => void;
  }): Unsubscrible {
    const channel = dex 
      ? `dex-ranking-list:${chain}_${ranking_type}_${dex}`
      : `dex-ranking-list:${chain}_${ranking_type}`;
    return this.subscribe(channel, (data: any[]) =>
      callback(
        data?.map((item: any) => {
          const result: RankingTokenList = {} as RankingTokenList;

          // TokenMetadata (t)
          if (item.t) {
            result.tokenAddress = item.t.a;
            if (item.t.n) {result.name = item.t.n}
            if (item.t.s) {result.symbol = item.t.s}
            if (item.t.iu) {result.imageUrl = item.t.iu}
            if (item.t.de) {result.description = item.t.de}
            if (item.t.sm) {
              result.socialMedia = {};
              if (item.t.sm.tw) {result.socialMedia.twitter = item.t.sm.tw}
              if (item.t.sm.tg) {result.socialMedia.telegram = item.t.sm.tg}
              if (item.t.sm.w) {result.socialMedia.website = item.t.sm.w}
              if (item.t.sm.tt) {result.socialMedia.tiktok = item.t.sm.tt}
              if (item.t.sm.dc) {result.socialMedia.discord = item.t.sm.dc}
              if (item.t.sm.fb) {result.socialMedia.facebook = item.t.sm.fb}
              if (item.t.sm.gh) {result.socialMedia.github = item.t.sm.gh}
              if (item.t.sm.ig) {result.socialMedia.instagram = item.t.sm.ig}
              if (item.t.sm.li) {result.socialMedia.linkedin = item.t.sm.li}
              if (item.t.sm.md) {result.socialMedia.medium = item.t.sm.md}
              if (item.t.sm.rd) {result.socialMedia.reddit = item.t.sm.rd}
              if (item.t.sm.yt) {result.socialMedia.youtube = item.t.sm.yt}
              if (item.t.sm.bb) {result.socialMedia.bitbucket = item.t.sm.bb}
            }
            if (item.t.cts) {result.createdAtMs = item.t.cts}
          }

          // TokenHolder (h)
          if (item.h) {
            if (item.h.a) {result.tokenAddress = item.h.a}
            if (item.h.h !== undefined) {result.holders = item.h.h}
            if (item.h.t100a !== undefined) {result.top100Amount = this.formatScientificNotation(item.h.t100a)}
            if (item.h.t10a !== undefined) {result.top10Amount = this.formatScientificNotation(item.h.t10a)}
            if (item.h.t100h !== undefined) {result.top100Holders = item.h.t100h}
            if (item.h.t10h !== undefined) {result.top10Holders = item.h.t10h}
            if (item.h.t100r !== undefined) {result.top100Ratio = this.formatScientificNotation(item.h.t100r)}
            if (item.h.t10r !== undefined) {result.top10Ratio = this.formatScientificNotation(item.h.t10r)}
            if (item.h.ts !== undefined) {result.timestamp = item.h.ts}
          }

          // TokenSupply (s)
          if (item.s) {
            if (item.s.a) {result.tokenAddress = item.s.a}
            if (item.s.s !== undefined) {result.supply = item.s.s}
            if (item.s.mc !== undefined) {result.marketCapInUsd = item.s.mc}
            if (item.s.ts !== undefined) {result.timestamp = item.s.ts}
          }

          // TokenStat (ts)
          if (item.ts) {
            if (item.ts.a) {result.address = item.ts.a}
            if (item.ts.t !== undefined) {result.timestamp = item.ts.t}
            
            // 1m data
            if (item.ts.b1m !== undefined) {result.buys1m = item.ts.b1m}
            if (item.ts.s1m !== undefined) {result.sells1m = item.ts.s1m}
            if (item.ts.be1m !== undefined) {result.buyers1m = item.ts.be1m}
            if (item.ts.se1m !== undefined) {result.sellers1m = item.ts.se1m}
            if (item.ts.bviu1m !== undefined) {result.buyVolumeInUsd1m = this.formatScientificNotation(item.ts.bviu1m)}
            if (item.ts.sviu1m !== undefined) {result.sellVolumeInUsd1m = this.formatScientificNotation(item.ts.sviu1m)}
            if (item.ts.p1m !== undefined) {result.price1m = this.formatScientificNotation(item.ts.p1m)}
            if (item.ts.oiu1m !== undefined) {result.openInUsd1m = this.formatScientificNotation(item.ts.oiu1m)}
            if (item.ts.ciu1m !== undefined) {result.closeInUsd1m = this.formatScientificNotation(item.ts.ciu1m)}

            // 5m data
            if (item.ts.b5m !== undefined) {result.buys5m = item.ts.b5m}
            if (item.ts.s5m !== undefined) {result.sells5m = item.ts.s5m}
            if (item.ts.be5m !== undefined) {result.buyers5m = item.ts.be5m}
            if (item.ts.se5m !== undefined) {result.sellers5m = item.ts.se5m}
            if (item.ts.bviu5m !== undefined) {result.buyVolumeInUsd5m = this.formatScientificNotation(item.ts.bviu5m)}
            if (item.ts.sviu5m !== undefined) {result.sellVolumeInUsd5m = this.formatScientificNotation(item.ts.sviu5m)}
            if (item.ts.p5m !== undefined) {result.price5m = this.formatScientificNotation(item.ts.p5m)}
            if (item.ts.oiu5m !== undefined) {result.openInUsd5m = this.formatScientificNotation(item.ts.oiu5m)}
            if (item.ts.ciu5m !== undefined) {result.closeInUsd5m = this.formatScientificNotation(item.ts.ciu5m)}

            // 15m data
            if (item.ts.b15m !== undefined) {result.buys15m = item.ts.b15m}
            if (item.ts.s15m !== undefined) {result.sells15m = item.ts.s15m}
            if (item.ts.be15m !== undefined) {result.buyers15m = item.ts.be15m}
            if (item.ts.se15m !== undefined) {result.sellers15m = item.ts.se15m}
            if (item.ts.bviu15m !== undefined) {result.buyVolumeInUsd15m = this.formatScientificNotation(item.ts.bviu15m)}
            if (item.ts.sviu15m !== undefined) {result.sellVolumeInUsd15m = this.formatScientificNotation(item.ts.sviu15m)}
            if (item.ts.p15m !== undefined) {result.price15m = this.formatScientificNotation(item.ts.p15m)}
            if (item.ts.oiu15m !== undefined) {result.openInUsd15m = this.formatScientificNotation(item.ts.oiu15m)}
            if (item.ts.ciu15m !== undefined) {result.closeInUsd15m = this.formatScientificNotation(item.ts.ciu15m)}

            // 30m data
            if (item.ts.b30m !== undefined) {result.buys30m = item.ts.b30m}
            if (item.ts.s30m !== undefined) {result.sells30m = item.ts.s30m}
            if (item.ts.be30m !== undefined) {result.buyers30m = item.ts.be30m}
            if (item.ts.se30m !== undefined) {result.sellers30m = item.ts.se30m}
            if (item.ts.bviu30m !== undefined) {result.buyVolumeInUsd30m = this.formatScientificNotation(item.ts.bviu30m)}
            if (item.ts.sviu30m !== undefined) {result.sellVolumeInUsd30m = this.formatScientificNotation(item.ts.sviu30m)}
            if (item.ts.p30m !== undefined) {result.price30m = this.formatScientificNotation(item.ts.p30m)}
            if (item.ts.oiu30m !== undefined) {result.openInUsd30m = this.formatScientificNotation(item.ts.oiu30m)}
            if (item.ts.ciu30m !== undefined) {result.closeInUsd30m = this.formatScientificNotation(item.ts.ciu30m)}

            // 1h data
            if (item.ts.b1h !== undefined) {result.buys1h = item.ts.b1h}
            if (item.ts.s1h !== undefined) {result.sells1h = item.ts.s1h}
            if (item.ts.be1h !== undefined) {result.buyers1h = item.ts.be1h}
            if (item.ts.se1h !== undefined) {result.sellers1h = item.ts.se1h}
            if (item.ts.bviu1h !== undefined) {result.buyVolumeInUsd1h = this.formatScientificNotation(item.ts.bviu1h)}
            if (item.ts.sviu1h !== undefined) {result.sellVolumeInUsd1h = this.formatScientificNotation(item.ts.sviu1h)}
            if (item.ts.p1h !== undefined) {result.price1h = this.formatScientificNotation(item.ts.p1h)}
            if (item.ts.oiu1h !== undefined) {result.openInUsd1h = this.formatScientificNotation(item.ts.oiu1h)}
            if (item.ts.ciu1h !== undefined) {result.closeInUsd1h = this.formatScientificNotation(item.ts.ciu1h)}

            // 4h data
            if (item.ts.b4h !== undefined) {result.buys4h = item.ts.b4h}
            if (item.ts.s4h !== undefined) {result.sells4h = item.ts.s4h}
            if (item.ts.be4h !== undefined) {result.buyers4h = item.ts.be4h}
            if (item.ts.se4h !== undefined) {result.sellers4h = item.ts.se4h}
            if (item.ts.bviu4h !== undefined) {result.buyVolumeInUsd4h = this.formatScientificNotation(item.ts.bviu4h)}
            if (item.ts.sviu4h !== undefined) {result.sellVolumeInUsd4h = this.formatScientificNotation(item.ts.sviu4h)}
            if (item.ts.p4h !== undefined) {result.price4h = this.formatScientificNotation(item.ts.p4h)}
            if (item.ts.oiu4h !== undefined) {result.openInUsd4h = this.formatScientificNotation(item.ts.oiu4h)}
            if (item.ts.ciu4h !== undefined) {result.closeInUsd4h = this.formatScientificNotation(item.ts.ciu4h)}

            // 24h data
            if (item.ts.b24h !== undefined) {result.buys24h = item.ts.b24h}
            if (item.ts.s24h !== undefined) {result.sells24h = item.ts.s24h}
            if (item.ts.be24h !== undefined) {result.buyers24h = item.ts.be24h}
            if (item.ts.se24h !== undefined) {result.sellers24h = item.ts.se24h}
            if (item.ts.bviu24h !== undefined) {result.buyVolumeInUsd24h = this.formatScientificNotation(item.ts.bviu24h)}
            if (item.ts.sviu24h !== undefined) {result.sellVolumeInUsd24h = this.formatScientificNotation(item.ts.sviu24h)}
            if (item.ts.p24h !== undefined) {result.price24h = this.formatScientificNotation(item.ts.p24h)}
            if (item.ts.oiu24h !== undefined) {result.openInUsd24h = this.formatScientificNotation(item.ts.oiu24h)}
            if (item.ts.ciu24h !== undefined) {result.closeInUsd24h = this.formatScientificNotation(item.ts.ciu24h)}

            // Current price
            if (item.ts.p !== undefined) {result.price = this.formatScientificNotation(item.ts.p)}
          }

          return result;
        })
      )
    );
  }

  subscribeWalletTrade({
    chain,
    walletAddress,
    callback,
    filter,
  }: {
    chain: string;
    walletAddress: string;
    callback: (data: TradeActivity) => void;
    filter?: string;
  }): Unsubscrible {
    const channel = `dex-wallet-trade:${chain}_${walletAddress}`;
    return this.subscribe(channel, (data: any) =>
      callback({
        tokenAddress: data.a,
        timestamp: data.t,
        kind: data.k,
        buyAmount: data.ba,
        buyAmountInUsd: data.baiu,
        buyTokenAddress: data.btma,
        buyTokenName: data.btn,
        buyTokenSymbol: data.bts,
        buyWalletAddress: data.bwa,
        sellAmount: data.sa,
        sellAmountInUsd: data.saiu,
        sellTokenAddress: data.stma,
        sellTokenName: data.stn,
        sellTokenSymbol: data.sts,
        sellWalletAddress: data.swa,
        txHash: data.h,
      }), filter, "subscribeTokenTrades");
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