import {http, cookieStorage, createConfig, createStorage} from 'wagmi'
import {avalancheFuji, Chain} from 'wagmi/chains'
import {coinbaseWallet, injected, walletConnect} from 'wagmi/connectors'

export function getConfig() {
    return createConfig({
        chains: [avalancheFuji, Faal_L1],
        connectors: [
            injected(),
            walletConnect({projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID as string}),
            coinbaseWallet(),
        ],
        storage: createStorage({
            storage: cookieStorage,
        }),
        ssr: true,
        transports: {
            [avalancheFuji.id]: http("https://api.avax-test.network/ext/bc/C/rpc"),
            [Faal_L1.id]: http("https://178.233.192.26:9650/ext/bc/2wfeNARjnmpRyR5HAkbFoSXdkrkXhqvM8KoBQNFHt3V9h8iZpF/rpc"),
        },

    })
}

export const Faal_L1: Chain = {
    id: 9031,
    name: "FAAL",
    nativeCurrency: {
        decimals: 18,
        name: "USD Coin",
        symbol: "USDC",
    },
    rpcUrls: {
        default: {
            http: [
                "https://178.233.192.26:9650/ext/bc/2wfeNARjnmpRyR5HAkbFoSXdkrkXhqvM8KoBQNFHt3V9h8iZpF/rpc"]
        },
    },
    testnet: true,
};

declare module 'wagmi' {
    interface Register {
        config: ReturnType<typeof getConfig>
    }
}
