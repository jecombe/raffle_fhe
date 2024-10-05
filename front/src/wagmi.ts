import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  sepolia,
} from 'wagmi/chains';


const zama = {
    id: 9000,
    name: 'Zama',
    iconUrl: 'https://downloads.intercomcdn.com/i/o/492340/d5d93c23711a04c22be3e182/fefacd820a895bb9613b5a3837fdfec3.jpg',
    iconBackground: '#fff',
    nativeCurrency: { name: 'ZAMA', symbol: 'ZAMA', decimals: 18 },
    rpcUrls: {
      default: { http: ['https://devnet.zama.ai/'] },
    },
    blockExplorers: {
      default: { name: 'zama devnet', url: '"https://main.explorer.zama.ai"' },
    },
    contracts: {
      multicall3: {
        address: '0xca11bde05977b3631167028862be2a173976ca11',
        blockCreated: 11_907_934,
      },
    },
  } as const satisfies Chain;

export const config = getDefaultConfig({
  appName: 'RainbowKit demo',
  projectId: 'YOUR_PROJECT_ID',
  chains: [
    zama,
  ],
  ssr: true,
});




  

