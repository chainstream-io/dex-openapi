import { StreamApi } from "./api/stream";
import {
  DexApi,
  Configuration,
  TransactionApi,
  DefiSolanaMoonshotApi,
  DefiSolanaPumpfunApi,
  DexPoolApi,
  TokenApi,
  RankingApi,
  TradeApi,
  WalletApi,
  createConfiguration,
  ServerConfiguration,
  ResponseContext,
  RequestContext,
  Middleware,
  BearerAuthentication,
  RedPacketApi,
} from "./openapi";
import { EventSourcePolyfill } from "event-source-polyfill";

export interface TokenProvider {
  getToken(): Promise<string> | string;
}

export interface DexRequestContext {
  baseUrl: string;
  streamUrl: string;
  accessToken: string | TokenProvider;
}

export interface DexAggregatorOptions {
  debug?: boolean;
  serverUrl?: string;
  streamUrl?: string;
}

export const LIB_VERSION = "0.0.76";

class UserAgentMiddleware implements Middleware {
  public pre(context: RequestContext): Promise<RequestContext> {
    context.setHeaderParam("User-Agent", `dex/${LIB_VERSION}/javascript`);
    return Promise.resolve(context);
  }

  public post(context: ResponseContext): Promise<ResponseContext> {
    return Promise.resolve(context);
  }
}

export class DexClient {
  public readonly requestCtx: DexRequestContext;
  public readonly _configuration: Configuration;
  public readonly dex: DexApi;
  public readonly dexpool: DexPoolApi;
  public readonly token: TokenApi;
  public readonly wallet: WalletApi;
  public readonly trade: TradeApi;
  public readonly ranking: RankingApi;
  public readonly transaction: TransactionApi;
  public readonly moonshot: DefiSolanaMoonshotApi;
  public readonly pumpfun: DefiSolanaPumpfunApi;
  public readonly stream: StreamApi;
  public readonly redPacket: RedPacketApi;
  public constructor(
    accessToken: string | TokenProvider,
    options: DexAggregatorOptions = {}
  ) {
    const baseUrl: string = options.serverUrl ?? "https://api-dex.chainstream.io";
    const streamUrl: string =
      options.streamUrl ?? "wss://realtime-dex.chainstream.io/connection/websocket";

    const tokenProvider =
      typeof accessToken === "string"
        ? {
            getToken: () => accessToken,
          }
        : accessToken;

    this.requestCtx = { baseUrl, streamUrl, accessToken };

    const config = createConfiguration({
      baseServer: new ServerConfiguration<any>(baseUrl, {}),
      promiseMiddleware: [new UserAgentMiddleware()],
      authMethods: {
        default: new BearerAuthentication(tokenProvider),
      },
    });

    this._configuration = config;
    // this.authentication = new Authentication(config);
    this.dex = new DexApi(config);
    this.dexpool = new DexPoolApi(config);
    this.token = new TokenApi(config);
    this.trade = new TradeApi(config);
    this.ranking = new RankingApi(config);
    this.transaction = new TransactionApi(config);
    this.moonshot = new DefiSolanaMoonshotApi(config);
    this.pumpfun = new DefiSolanaPumpfunApi(config);
    this.stream = new StreamApi(this.requestCtx);
    this.wallet = new WalletApi(config);
    this.redPacket = new RedPacketApi(config);
    this.stream.connect();
  }

  async waitForJob<T>(jobId: string, timeout = 60000): Promise<T> {
    const accessToken =
      typeof this.requestCtx.accessToken === "string"
        ? this.requestCtx.accessToken
        : await this.requestCtx.accessToken.getToken();

    return new Promise((resolve, reject) => {
      const sse = new EventSourcePolyfill(
        `${this.requestCtx.baseUrl}/jobs/${jobId}/streaming`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const timeoutId = setTimeout(() => {
        sse.close();
        reject(new Error(`Job ${jobId} timed out after ${timeout}ms`));
      }, timeout);

      sse.onmessage = (event: any) => {
        try {
          console.log("event.data: ", event.data);
          const data = JSON.parse(event.data);

          if (data.status === "error") {
            sse.close();
            reject(new Error(`Error: ${data.message}`));
          } else if (data.status === "completed") {
            clearTimeout(timeoutId);
            sse.close();
            resolve(data as T);
          }
        } catch (e) {
          clearTimeout(timeoutId);
          sse.close();
          reject(new Error("Error parsing event data"));
        }
      };

      sse.onopen = () => {
        console.log("SSE connection opened");
      };

      sse.onerror = (error: any) => {
        if (error.message?.includes("No activity within")) {
          console.log("SSE reconnecting due to inactivity...");
          return;
        }

        clearTimeout(timeoutId);

        sse.close();
        reject(new Error(`Error in SSE connection: ${error}`));
      };
    });
  }
}

export interface PostOptions {
  idempotencyKey?: string;
}

/*
class Authentication {
  private readonly api: AuthenticationApi;

  public constructor(config: Configuration) {
    this.api = new AuthenticationApi(config);
  }

  public appPortalAccess(
    appId: string,
    appPortalAccessIn: AppPortalAccessIn,
    options?: PostOptions
  ): Promise<AppPortalAccessOut> {
    return this.api.v1AuthenticationAppPortalAccess({
      appId,
      appPortalAccessIn,
      ...options,
    });
  }

  public dashboardAccess(
    appId: string,
    options?: PostOptions
  ): Promise<DashboardAccessOut> {
    return this.api.v1AuthenticationDashboardAccess({
      appId,
      ...options,
    });
  }

  public logout(options?: PostOptions): Promise<void> {
    return this.api.v1AuthenticationLogout({ ...options });
  }
}
*/
