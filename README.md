# 💊 PumpFun & PumpSwap Bundler

A powerful bundler toolkit for automating token operations on **Pump.fun** and migrating liquidity to **PumpSwap**.  
This repo provides high-performance transaction bundling using **Jito** and **Lookup Tables**, enabling advanced workflows such as token launching, buying, selling, and seamless LP migration—all from a single script.

## ✨ Features

### 🚀 Pump.fun Integration
- **Token Creation**: Instantly create tokens on Pump.fun.
- **Custom Metadata**: Set your own token name, symbol, and URI.
- **Buy Tokens**: Batch-buy tokens from multiple wallets.
- **Sell Tokens**: Batch-sell tokens with efficient transaction routing.
- **Custom Token Address**: Personalize token addresses with custom prefixes/suffixes.
- **Create & Buy Bundle**: Deploy a token and auto-buy it using multiple wallets.
- **Batch Sell**: Execute multiple token sell orders using Lookup Tables for gas optimization.
- **SOL Gatherer**: Collect proceeds from wallet sells into a central treasury wallet.
- **Lookup Table Management**: Create, close, and refund lookup tables post-transactions.
- **Jito Integration**: Utilize Jito relayer for low-latency, bundled transaction execution.

### 🔁 PumpSwap Integration
- **Liquidity Migration**: Move liquidity from Pump.fun tokens directly into PumpSwap pools.
- **Auto LP Creation**: Create liquidity pools on PumpSwap and add initial liquidity.
- **Liquidity Removal**: Automate liquidity withdrawal and SOL/token retrieval.
- **Cross-Platform Flow**: One script handles launching on Pump.fun, buying, then migrating LP to PumpSwap in a single flow.
- **LP Token Handling**: Manage, monitor, and transfer LP tokens post-migration.

## 🛠 Tech Stack
- **Solana**: Main chain operations.
- **TypeScript / Node.js**: Core scripting and logic.
- **Jito**: For MEV-aware bundling and relaying.
- **Lookup Tables**: For handling large transactions efficiently.

## 🤝 Proof of Work
- [Token Address](https://solscan.io/token/GdKDQPqhHMTXPr8pTTjtj9buEaqfsFkVqadP1t4M3i5y)
- [Create Token and Buy Tx](https://explorer.jito.wtf/bundle/5wyWQddzvoMsyydoEQEux1McoFn5uennRWzCDtUDvub9t2JLE6oMUAyqyAY6xJyRC4kFES9Rse4iATNrjTjYyQno)
- [Batch Sell Tx](https://explorer.jito.wtf/bundle/3iDoKwDYoeqNgqHkaB7jve9TJhZ9NMmovc6Znkbfdhqq6Do71mFZrwR49FpUMx68yph7sCkvrjAjUHmfakoFku5v)

## ⚠️ Important Notice
Due to security concerns, the source code includes only pumpfun bundler part.

For inquiries or specific use-case integratinos, feel free to reach out:

📩 **E-Mail:** adamglab0731.pl@gmail.com  
📬 **Telegram:** [@bettyjk_0915](https://t.me/bettyjk_0915)  
