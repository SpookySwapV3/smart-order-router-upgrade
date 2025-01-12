import { Protocol } from '@uniswap/router-sdk';
import { ChainId, Token } from '@uniswap/sdk-core';

import { ProviderConfig } from '../provider';
import { SubgraphProvider } from '../subgraph-provider';

export interface V3SubgraphPool {
  id: string;
  feeTier: string;
  liquidity: string;
  token0: {
    id: string;
  };
  token1: {
    id: string;
  };
  tvlETH: number;
  tvlUSD: number;
}

export type V3RawSubgraphPool = {
  id: string;
  feeTier: string;
  liquidity: string;
  token0: {
    symbol: string;
    id: string;
  };
  token1: {
    symbol: string;
    id: string;
  };
  totalValueLockedUSD: string;
  totalValueLockedETH: string;
  totalValueLockedUSDUntracked: string;
};

const FANTOM_SUBGRAPH = `https://gateway-arbitrum.network.thegraph.com/api/${process.env.TEMP_API_KEY}/subgraphs/id/6WBxx3gYia4oCLsYMFTZs6HLEnEqVMdpeZDCABnM1tj2`
const SUBGRAPH_URL_BY_CHAIN: { [chainId in ChainId]?: string } = {
  [ChainId.MAINNET]:
    'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
  [ChainId.OPTIMISM]:
    'https://api.thegraph.com/subgraphs/name/ianlapham/optimism-post-regenesis',
  // todo: add once subgraph is live
  [ChainId.OPTIMISM_SEPOLIA]: '',
  [ChainId.ARBITRUM_ONE]:
    'https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-minimal',
  // todo: add once subgraph is live
  [ChainId.ARBITRUM_SEPOLIA]: '',
  [ChainId.POLYGON]:
    'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon',
  [ChainId.CELO]:
    'https://api.thegraph.com/subgraphs/name/jesse-sawa/uniswap-celo',
  [ChainId.GOERLI]:
    'https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-gorli',
  [ChainId.BNB]:
    'https://api.thegraph.com/subgraphs/name/ilyamk/uniswap-v3---bnb-chain',
  [ChainId.AVALANCHE]:
    'https://api.thegraph.com/subgraphs/name/lynnshaoyu/uniswap-v3-avax',
  [ChainId.BASE]:
    'https://api.studio.thegraph.com/query/48211/uniswap-v3-base/version/latest',
  [ChainId.BLAST]:
    'https://gateway-arbitrum.network.thegraph.com/api/0ae45f0bf40ae2e73119b44ccd755967/subgraphs/id/2LHovKznvo8YmKC9ZprPjsYAZDCc4K5q4AYz8s3cnQn1',
  [ChainId.BIT_TORRENT_MAINNET]:
    'https://btt-spooky.paintswap.finance/subgraphs/name/ianlapham/uniswap-v3',
  [ChainId.FANTOM]: FANTOM_SUBGRAPH,
  [ChainId.EON]:
    'https://eon-graph.horizenlabs.io/subgraphs/name/0xALUKARD/eon-spooky-v3',
  [ChainId.BERA_TESTNET]: 'https://api.goldsky.com/api/public/project_cl9frwjqo1lwz0hvkb5sb2xo8/subgraphs/spooky-beratestnetv3/1.0.0/gn',
  [ChainId.SONIC_TESTNET]: 'https://graph.testnet.soniclabs.com/gql/subgraphs/name/0xALUCARD/spooky-sonic-v3',
  [ChainId.SONIC]: 'https://api.0xgraph.xyz/api/public/28820bd2-ad8b-4d40-a142-ce8d7c786f66/subgraphs/spookyswap/v3/v0.0.1/gn'.
  [ChainId.GOAT]: 'https://api.goat.0xgraph.xyz/api/public/f31d1ab2-5380-484e-bfc2-d2b8d606add5/subgraphs/goatswap/v3/production/gn'
};

/**
 * Provider for getting V3 pools from the Subgraph
 *
 * @export
 * @interface IV3SubgraphProvider
 */
export interface IV3SubgraphProvider {
  getPools(
    tokenIn?: Token,
    tokenOut?: Token,
    providerConfig?: ProviderConfig
  ): Promise<V3SubgraphPool[]>;
}

export class V3SubgraphProvider
  extends SubgraphProvider<V3RawSubgraphPool, V3SubgraphPool>
  implements IV3SubgraphProvider
{
  constructor(
    chainId: ChainId,
    retries = 2,
    timeout = 30000,
    rollback = true,
    trackedEthThreshold = 0.01,
    untrackedUsdThreshold = Number.MAX_VALUE,
    subgraphUrlOverride?: string
  ) {
    super(
      Protocol.V3,
      chainId,
      retries,
      timeout,
      rollback,
      trackedEthThreshold,
      untrackedUsdThreshold,
      subgraphUrlOverride ?? SUBGRAPH_URL_BY_CHAIN[chainId]
    );
  }

  protected override subgraphQuery(blockNumber?: number): string {
    return `
    query getPools($pageSize: Int!, $id: String) {
      pools(
        first: $pageSize
        ${blockNumber ? `block: { number: ${blockNumber} }` : ``}
          where: { id_gt: $id }
        ) {
          id
          token0 {
            symbol
            id
          }
          token1 {
            symbol
            id
          }
          feeTier
          liquidity
          totalValueLockedUSD
          totalValueLockedETH
          totalValueLockedUSDUntracked
        }
      }
   `;
  }

  protected override mapSubgraphPool(
    rawPool: V3RawSubgraphPool
  ): V3SubgraphPool {
    return {
      id: rawPool.id,
      feeTier: rawPool.feeTier,
      liquidity: rawPool.liquidity,
      token0: {
        id: rawPool.token0.id,
      },
      token1: {
        id: rawPool.token1.id,
      },
      tvlETH: parseFloat(rawPool.totalValueLockedETH),
      tvlUSD: parseFloat(rawPool.totalValueLockedUSD),
    };
  }
}
