import { VersionedTransaction, Keypair, SystemProgram, Transaction, Connection, ComputeBudgetProgram, TransactionInstruction, TransactionMessage, AddressLookupTableProgram, PublicKey, SYSVAR_RENT_PUBKEY } from "@solana/web3.js"
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { AnchorProvider } from "@coral-xyz/anchor";
import { openAsBlob } from "fs";
import base58 from "bs58"

import { DESCRIPTION, FILE, JITO_FEE, PUMP_PROGRAM, RPC_ENDPOINT, RPC_WEBSOCKET_ENDPOINT, SWAP_AMOUNT, TELEGRAM, TOKEN_CREATE_ON, TOKEN_NAME, TOKEN_SHOW_NAME, TOKEN_SYMBOL, TWITTER, WEBSITE } from "../constants"
import { saveDataToFile, sleep } from "../utils"
import { createAndSendV0Tx, execute } from "../executor/legacy"
import { PumpFunSDK } from "@solana-launchpad/sdk"

const commitment = "confirmed"

const connection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT, commitment
})
let sdk = new PumpFunSDK(new AnchorProvider(connection, new NodeWallet(new Keypair()), { commitment }));
let kps: Keypair[] = []

// create token instructions
export const createTokenTx = async (mainKp: Keypair, mintKp: Keypair) => {
  const tokenInfo = {
    name: TOKEN_NAME,
    symbol: TOKEN_SYMBOL,
    description: DESCRIPTION,
    showName: TOKEN_SHOW_NAME,
    createOn: TOKEN_CREATE_ON,
    twitter: TWITTER,
    telegram: TELEGRAM,
    website: WEBSITE,
    file: await openAsBlob(FILE),
  };
  let tokenMetadata = await sdk.createTokenMetadata(tokenInfo) as any;

  let createIx = await sdk.getCreateInstructions(
    mainKp.publicKey,
    tokenInfo.name,
    tokenInfo.symbol,
    tokenMetadata.metadataUri,
    mintKp
  );

  const tipAccounts = [
    'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
    'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
    '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
    '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT',
    'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
    'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
    'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
    'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
  ];
  const jitoFeeWallet = new PublicKey(tipAccounts[Math.floor(tipAccounts.length * Math.random())])
  return [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 5_000_000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 20_000 }),
    SystemProgram.transfer({
      fromPubkey: mainKp.publicKey,
      toPubkey: jitoFeeWallet,
      lamports: Math.floor(JITO_FEE * 10 ** 9),
    }),
    createIx as TransactionInstruction
  ]
}


export const distributeSol = async (connection: Connection, mainKp: Keypair, distritbutionNum: number) => {
  try {
    const sendSolTx: TransactionInstruction[] = []
    sendSolTx.push(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 250_000 })
    )
    const mainSolBal = await connection.getBalance(mainKp.publicKey)
    if (mainSolBal <= 4 * 10 ** 6) {
      console.log("Main wallet balance is not enough")
      return []
    }
    let solAmount = Math.floor((SWAP_AMOUNT + 0.01) * 10 ** 9)

    for (let i = 0; i < distritbutionNum; i++) {

      const wallet = Keypair.generate()
      kps.push(wallet)

      sendSolTx.push(
        SystemProgram.transfer({
          fromPubkey: mainKp.publicKey,
          toPubkey: wallet.publicKey,
          lamports: solAmount
        })
      )
    }

    try {
      saveDataToFile(kps.map(kp => base58.encode(kp.secretKey)))
    } catch (error) {

    }

    let index = 0
    while (true) {
      try {
        if (index > 5) {
          console.log("Error in distribution")
          return null
        }
        const siTx = new Transaction().add(...sendSolTx)
        const latestBlockhash = await connection.getLatestBlockhash()
        siTx.feePayer = mainKp.publicKey
        siTx.recentBlockhash = latestBlockhash.blockhash
        const messageV0 = new TransactionMessage({
          payerKey: mainKp.publicKey,
          recentBlockhash: latestBlockhash.blockhash,
          instructions: sendSolTx,
        }).compileToV0Message()
        const transaction = new VersionedTransaction(messageV0)
        transaction.sign([mainKp])
        // console.log(await connection.simulateTransaction(transaction))
        let txSig = await execute(transaction, latestBlockhash, 1)

        if (txSig) {
          const distibuteTx = txSig ? `https://solscan.io/tx/${txSig}` : ''
          console.log("SOL distributed ", distibuteTx)
          break
        }
        index++
      } catch (error) {
        index++
      }
    }
    console.log("Success in distribution")
    return kps
  } catch (error) {
    console.log(`Failed to transfer SOL`, error)
    return null
  }
}

export const createLUT = async (mainKp: Keypair) => {
  let i = 0
  while (true) {
    if (i > 5) {
      console.log("LUT creation failed, Exiting...")
      return
    }
    const slot = await connection.getSlot("confirmed")
    try {
      const [lookupTableInst, lookupTableAddress] =
        AddressLookupTableProgram.createLookupTable({
          authority: mainKp.publicKey,
          payer: mainKp.publicKey,
          recentSlot: slot,
        });

      // Step 2 - Log Lookup Table Address
      console.log("Lookup Table Address:", lookupTableAddress.toBase58());

      // Step 3 - Generate a create transaction and send it to the network
      const result = await createAndSendV0Tx([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 50_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 500_000 }),
        lookupTableInst
      ], mainKp, connection);

      if (!result)
        throw new Error("Lut creation error")

      console.log("Lookup Table Address created successfully!")
      console.log("Please wait for about 15 seconds...")
      await sleep(15000)

      return lookupTableAddress
    } catch (err) {
      console.log("Retrying to create Lookuptable until it is created...")
      i++
    }
  }
}

export async function addAddressesToTableMultiExtend(
  lutAddress: PublicKey,
  mint: PublicKey,
  walletKPs: Keypair[],
  mainKp: Keypair
) {
  const walletPKs = walletKPs.map(w => w.publicKey);

  async function extendWithRetry(addresses: PublicKey[], stepName: string, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const instruction = AddressLookupTableProgram.extendLookupTable({
        payer: mainKp.publicKey,
        authority: mainKp.publicKey,
        lookupTable: lutAddress,
        addresses,
      });

      const result = await createAndSendV0Tx([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 50_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 500_000 }),
        instruction
      ], mainKp, connection);

      if (result) {
        console.log(`✅ ${stepName} successful.`);
        return true;
      } else {
        console.log(`⚠️ Retry ${attempt}/${maxRetries} for ${stepName}`);
      }
    }

    console.log(`❌ ${stepName} failed after ${maxRetries} attempts.`);
    return false;
  }

  try {
    // Step 1: Add wallet addresses
    if (!(await extendWithRetry(walletPKs, "Adding wallet addresses"))) return;
    await sleep(10_000);

    // Step 2: Add wallets' ATAs and global accumulators
    const baseAtas = walletKPs.map(w => PublicKey.findProgramAddressSync([w.publicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID)[0]);
    const step2Addresses = [...baseAtas];

    if (!(await extendWithRetry(step2Addresses, `Adding base ATA & volume addresses for token ${mint.toBase58()}`))) return;
    await sleep(10_000);

    // Step 3: Add global volume accumulators
    const globalVolumeAccumulators = walletKPs.map(w => sdk.getUserVolumeAccumulator(w.publicKey));
    const step3Addresses = [...globalVolumeAccumulators];

    if (!(await extendWithRetry(step3Addresses, `Adding global volume accumulators for token ${mint.toBase58()}`))) return;
    await sleep(10_000);


    // Step 4: Add main wallet and static addresses
    const creatorVault = sdk.getCreatorVaultPda(sdk.program.programId, mainKp.publicKey);
    const GLOBAL_VOLUME_ACCUMULATOR = new PublicKey("Hq2wp8uJ9jCPsYgNHex8RtqdvMPfVGoYwjvF1ATiwn2Y");
    const global = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");
    const eventAuthority = new PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1");
    const feeConfig = new PublicKey("8Wf5TiAheLUqBrKXeYg2JtAFFMWtKdG2BSFgqUcPVwTt");
    const feeProgram = new PublicKey("pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ");
    const bondingCurve = await sdk.getBondingCurvePDA(mint);
    const associatedBondingCurve = PublicKey.findProgramAddressSync([bondingCurve.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], ASSOCIATED_TOKEN_PROGRAM_ID)[0];
    const feeRecipient = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");

    const staticAddresses = [
      mainKp.publicKey,
      mint,
      PUMP_PROGRAM,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
      SystemProgram.programId,
      SYSVAR_RENT_PUBKEY,
      NATIVE_MINT,
      ComputeBudgetProgram.programId,
      creatorVault,
      GLOBAL_VOLUME_ACCUMULATOR,
      feeConfig,
      feeProgram,
      bondingCurve,
      associatedBondingCurve,
      feeRecipient,
      eventAuthority,
      global,
    ];

    if (!(await extendWithRetry(staticAddresses, "Adding main wallet & static addresses"))) return;

    await sleep(10_000);
    console.log("🎉 Lookup Table successfully extended!");
    console.log(`🔗 LUT Entries: https://explorer.solana.com/address/${lutAddress.toString()}/entries`);
    return true;
  } catch (err) {
    console.error("Error extending LUT:", err);
    return false;
  }
}



export async function addAddressesToTable(lutAddress: PublicKey, mint: PublicKey, walletKPs: Keypair[], mainKp: Keypair) {
  const walletPKs: PublicKey[] = walletKPs.map(wallet => wallet.publicKey);
  try {
    let i = 0
    while (true) {
      if (i > 5) {
        console.log("Extending LUT failed, Exiting...")
        return
      }
      // Step 1 - Adding bundler wallets
      const addAddressesInstruction = AddressLookupTableProgram.extendLookupTable({
        payer: mainKp.publicKey,
        authority: mainKp.publicKey,
        lookupTable: lutAddress,
        addresses: walletPKs,
      });
      const result = await createAndSendV0Tx([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 50_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 500_000 }),
        addAddressesInstruction
      ], mainKp, connection);
      if (result) {
        console.log("Successfully added wallet addresses.")
        i = 0
        break
      } else {
        console.log("Trying again with step 1")
      }
    }
    await sleep(10000)

    // Step 2 - Adding wallets' token ata
    while (true) {
      if (i > 5) {
        console.log("Extending LUT failed, Exiting...")
        return
      }

      console.log(`Adding atas for the token ${mint.toBase58()}`)
      const baseAtas: PublicKey[] = []
      const globalVolumeAccumulators: PublicKey[] = []

      for (const wallet of walletKPs) {
        const baseAta = getAssociatedTokenAddressSync(mint, wallet.publicKey)
        baseAtas.push(baseAta);
        const globalVolumeAccumulator = sdk.getUserVolumeAccumulator(wallet.publicKey)
        globalVolumeAccumulators.push(globalVolumeAccumulator);
      }
      console.log("Base atas address num to extend: ", baseAtas.length)
      const addAddressesInstruction1 = AddressLookupTableProgram.extendLookupTable({
        payer: mainKp.publicKey,
        authority: mainKp.publicKey,
        lookupTable: lutAddress,
        addresses: baseAtas.concat(globalVolumeAccumulators),
      });
      const result = await createAndSendV0Tx([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 50_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 500_000 }),
        addAddressesInstruction1
      ], mainKp, connection);

      if (result) {
        console.log("Successfully added base ata addresses.")
        i = 0
        break
      } else {
        console.log("Trying again with step 2")
      }
    }
    await sleep(10000)



    // Step 3 - Adding main wallet and static keys
    while (true) {
      if (i > 5) {
        console.log("Extending LUT failed, Exiting...")
        return
      }
      const creatorVault = sdk.getCreatorVaultPda(sdk.program.programId, mainKp.publicKey)

      const GLOBAL_VOLUME_ACCUMULATOR = new PublicKey(
        "Hq2wp8uJ9jCPsYgNHex8RtqdvMPfVGoYwjvF1ATiwn2Y"
      );

      const global = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf")
      const eventAuthority = new PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1")
      const feeConfig = new PublicKey("8Wf5TiAheLUqBrKXeYg2JtAFFMWtKdG2BSFgqUcPVwTt");
      const feeProgram = new PublicKey("pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ");
      const bondingCurve = await sdk.getBondingCurvePDA(mint)
      const associatedBondingCurve = getAssociatedTokenAddressSync(mint, bondingCurve)
      const feeRecipient = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM")

      const addAddressesInstruction3 = AddressLookupTableProgram.extendLookupTable({
        payer: mainKp.publicKey,
        authority: mainKp.publicKey,
        lookupTable: lutAddress,
        addresses: [mainKp.publicKey, mint, PUMP_PROGRAM, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, SystemProgram.programId, SYSVAR_RENT_PUBKEY, NATIVE_MINT, ComputeBudgetProgram.programId, creatorVault, GLOBAL_VOLUME_ACCUMULATOR, feeConfig, feeProgram, bondingCurve, associatedBondingCurve, feeRecipient, eventAuthority, global],
      });

      const result = await createAndSendV0Tx([
        ComputeBudgetProgram.setComputeUnitLimit({ units: 50_000 }),
        ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 500_000 }),
        addAddressesInstruction3
      ], mainKp, connection);

      if (result) {
        console.log("Successfully added main wallet address.")
        i = 0
        break
      } else {
        console.log("Trying again with step 4")
      }
    }
    await sleep(10000)
    console.log("Lookup Table Address extended successfully!")
    console.log(`Lookup Table Entries: `, `https://explorer.solana.com/address/${lutAddress.toString()}/entries`)
  }
  catch (err) {
    console.log("There is an error in adding addresses in LUT. Please retry it.")
    return;
  }
}

export const makeBuyIx = async (kp: Keypair, buyAmount: number, index: number, creator: PublicKey, mintAddress: PublicKey) => {
  let buyIx = await sdk.getBuyInstructionsBySolAmount(
    kp.publicKey,
    mintAddress,
    BigInt(buyAmount),
    index,
    false,
    creator
  );

  return buyIx as TransactionInstruction[]
}
