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

## 📋 Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Solana CLI (optional, for advanced users)
- Sufficient SOL balance for:
  - Token creation fees
  - Distribution to bundler wallets
  - Jito tips
  - Transaction fees
 
## 🛠️ Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd pump.fun-bundler
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with the following variables:

```env
# Required Configuration
PRIVATE_KEY=your_main_wallet_private_key_in_base58
RPC_ENDPOINT=https://your-solana-rpc-endpoint
RPC_WEBSOCKET_ENDPOINT=wss://your-solana-websocket-endpoint

# Bundle Execution Configuration
LIL_JIT_MODE=true
LIL_JIT_ENDPOINT=https://your-lil-jit-endpoint
LIL_JIT_WEBSOCKET_ENDPOINT=wss://your-lil-jit-websocket-endpoint

# Token Configuration
TOKEN_NAME=Your Token Name
TOKEN_SYMBOL=SYMBOL
TOKEN_SHOW_NAME=Display Name
DESCRIPTION=Your token description
TOKEN_CREATE_ON=Launch Date
TWITTER=https://twitter.com/yourhandle
TELEGRAM=https://t.me/yourchannel
WEBSITE=https://yourwebsite.com
FILE=./image/your_token_image.jpg

# Bundling Configuration
SWAP_AMOUNT=0.1
DISTRIBUTION_WALLETNUM=10
JITO_FEE=0.001
VANITY_MODE=false

# Single Wallet Mode (for oneWalletBundle.ts)
BUYER_WALLET=buyer_wallet_private_key_in_base58
BUYER_AMOUNT=0.5

SIMULATE_ONLY = false
```
## 🎯 Usage

### Multi-Wallet Bundling (Recommended)

Run the main bundler script:

```bash
npm start
```

This will:

1. Generate or use a vanity address (if enabled)
2. Create the token with metadata
3. Distribute SOL to multiple wallets
4. Create and populate an Address Lookup Table
5. Execute coordinated buy transactions via Jito bundles

### Single Wallet Mode

For simpler operations with a single buyer wallet:

```bash
npm run single
```

### Additional Scripts

- **Close LUT**: `npm run close` - Closes the Address Lookup Table
- **Gather Funds**: `npm run gather` - Collects funds from bundler wallets
- **Check Status**: `npm run status` - Checks the status of transactions

## 🔀 Choosing Between Jito and Lil Jito

The bundler supports two different bundle execution services:

### Jito Mode (Default)

- **Configuration**: Set `LIL_JIT_MODE=false` in `.env`
- **Features**:
  - Multi-regional endpoint submission (NY, Tokyo)
  - Automatic failover between endpoints
  - Well-established service with high reliability
  - Requires `JITO_FEE` for tipping
- **Best for**: Production deployments requiring maximum redundancy

### Lil Jito Mode

- **Configuration**: Set `LIL_JIT_MODE=true` in `.env`
- **Features**:
  - Single endpoint configuration
  - Simplified setup process
  - Alternative bundle execution service
  - May offer different performance characteristics
- **Best for**: Testing alternative execution paths or when Jito is congested

**Recommendation**: Start with Jito mode (default) for most use cases. Switch to Lil Jito if you experience persistent issues with standard Jito or want to test alternative execution.

## 🤝 Proof of Work
- [Token Address](https://solscan.io/token/GdKDQPqhHMTXPr8pTTjtj9buEaqfsFkVqadP1t4M3i5y)
- [Create Token and Buy Tx](https://explorer.jito.wtf/bundle/5wyWQddzvoMsyydoEQEux1McoFn5uennRWzCDtUDvub9t2JLE6oMUAyqyAY6xJyRC4kFES9Rse4iATNrjTjYyQno)
- [Batch Sell Tx](https://explorer.jito.wtf/bundle/3iDoKwDYoeqNgqHkaB7jve9TJhZ9NMmovc6Znkbfdhqq6Do71mFZrwR49FpUMx68yph7sCkvrjAjUHmfakoFku5v)

## ⚠️ Important Notice
Due to security concerns, the source code includes only pumpfun bundler part.

For inquiries or specific use-case integratinos, feel free to reach out:

📩 **E-Mail:** adamglab0731.pl@gmail.com  
📬 **Telegram:** [@bettyjk_0915](https://t.me/bettyjk_0915)  
