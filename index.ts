import { VersionedTransaction, Keypair, Connection, ComputeBudgetProgram, TransactionInstruction, TransactionMessage, PublicKey } from "@solana/web3.js"
import base58 from "bs58"

import { DISTRIBUTION_WALLETNUM, LIL_JIT_MODE, PRIVATE_KEY, RPC_ENDPOINT, RPC_WEBSOCKET_ENDPOINT, SWAP_AMOUNT, VANITY_MODE } from "./constants"
import { generateVanityAddress, saveDataToFile, sleep } from "./utils"
import { createTokenTx, distributeSol, createLUT, makeBuyIx, addAddressesToTableMultiExtend } from "./src/main";
import { executeJitoTx } from "./executor/jito";
import { sendBundle } from "./executor/liljito";



const commitment = "confirmed"

const connection = new Connection(RPC_ENDPOINT, {
  wsEndpoint: RPC_WEBSOCKET_ENDPOINT, commitment
})
const mainKp = Keypair.fromSecretKey(base58.decode(PRIVATE_KEY))
console.log("mainKp", mainKp.publicKey.toBase58());
let kps: Keypair[] = []
const transactions: VersionedTransaction[] = []
let mintKp = Keypair.generate()
console.log("mintKp", mintKp.publicKey.toBase58());
if (VANITY_MODE) {
  const { keypair, pubkey } = generateVanityAddress("pump")
  mintKp = keypair
  console.log(`Keypair generated with "pump" ending: ${pubkey}`);
}
const mintAddress = mintKp.publicKey //new PublicKey("CaMN8votThqcfkyRHPHHNsZMH6zurM4BPFfcjbcR5SV4")
console.log("mintAddress", mintAddress.toBase58());


const main = async () => {

  const mainBal = await connection.getBalance(mainKp.publicKey)
  console.log((mainBal / 10 ** 9).toFixed(3), "SOL in main keypair")

  console.log("Mint address of token ", mintAddress.toBase58())
  saveDataToFile([base58.encode(mintKp.secretKey)], "mint.json")

  const tokenCreationIxs = await createTokenTx(mainKp, mintKp)
  if (tokenCreationIxs.length == 0) {
    console.log("Token creation failed")
    return
  }
  const minimumSolAmount = (SWAP_AMOUNT + 0.01) * DISTRIBUTION_WALLETNUM + 0.04

  if (mainBal / 10 ** 9 < minimumSolAmount) {
    console.log("Main wallet balance is not enough to run the bundler")
    console.log(`Plz charge the wallet more than ${minimumSolAmount}SOL`)
    return
  }

  console.log("Distributing SOL to wallets...")
  let result = await distributeSol(connection, mainKp, DISTRIBUTION_WALLETNUM)
  if (!result) {
    console.log("Distribution failed")
    return
  } else {
    kps = result
  }

  console.log("Creating LUT started")
  const lutAddress = await createLUT(mainKp)
  if (!lutAddress) {
    console.log("Lut creation failed")
    return
  }
  console.log("LUT Address:", lutAddress.toBase58())
  saveDataToFile([lutAddress.toBase58()], "lut.json")
  if (!(await addAddressesToTableMultiExtend(lutAddress, mintAddress, kps, mainKp))) {
    console.log("Adding addresses to table failed")
    return
  }

  const buyIxs: TransactionInstruction[] = []

  for (let i = 0; i < DISTRIBUTION_WALLETNUM; i++) {
    const ix = await makeBuyIx(kps[i], Math.floor(SWAP_AMOUNT * 10 ** 9), i, mainKp.publicKey, mintAddress)
    buyIxs.push(...ix)
  }

  const lookupTable = (await connection.getAddressLookupTable(lutAddress)).value;
  if (!lookupTable) {
    console.log("Lookup table not ready")
    return
  }

  const latestBlockhash = await connection.getLatestBlockhash()

  const tokenCreationTx = new VersionedTransaction(
    new TransactionMessage({
      payerKey: mainKp.publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: tokenCreationIxs
    }).compileToV0Message()
  )

  tokenCreationTx.sign([mainKp, mintKp])

  // const simResult = await connection.simulateTransaction(tokenCreationTx, { sigVerify: false });
  // console.log("Simulation result:", simResult.value);
  // if (simResult.value.err) {
  //   console.log("Simulation failed. Adjust compute units or batch size.");
  //   return;
  // }

  // const sig = await connection.sendTransaction(tokenCreationTx, { skipPreflight: true })
  // console.log("Transaction sent:", sig)
  // const confirmation = await connection.confirmTransaction(sig, "confirmed")
  // console.log("Transaction confirmed:", confirmation)
  // if (confirmation.value.err) {
  //   console.log("Transaction failed")
  //   return
  // }

  transactions.push(tokenCreationTx)
  for (let i = 0; i < Math.ceil(DISTRIBUTION_WALLETNUM / 4); i++) {
    const latestBlockhash = await connection.getLatestBlockhash()
    const instructions: TransactionInstruction[] = [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 5_000_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 20_000 }),
    ]

    for (let j = 0; j < 4; j++) {
      const index = i * 4 + j
      if (kps[index]) {
        instructions.push(buyIxs[index * 2], buyIxs[index * 2 + 1])
        console.log("Transaction instruction added:", kps[index].publicKey.toString())
      }
    }
    const msg = new TransactionMessage({
      payerKey: kps[i * 4].publicKey,
      recentBlockhash: latestBlockhash.blockhash,
      instructions
    }).compileToV0Message([lookupTable])
    console.log("Transaction message compiled:", msg)

    const tx = new VersionedTransaction(msg)
    console.log("Transaction created:", tx)

    for (let j = 0; j < 4; j++) {
      const index = i * 4 + j
      if (kps[index]) {
        tx.sign([kps[index]])
        console.log("Transaction signed:", kps[index].publicKey.toString())
      }
    }
    console.log("transaction size", tx.serialize().length)

    // const simResult = await connection.simulateTransaction(tx, { sigVerify: false });
    // console.log("Simulation result:", simResult.value);
    // if (simResult.value.err) {
    //   console.log("Simulation failed. Adjust compute units or batch size.");
    //   return;
    // }

    // const sig = await connection.sendTransaction(tx, { skipPreflight: true })
    // console.log("Transaction sent:", sig)
    // const confirmation = await connection.confirmTransaction(sig, "confirmed")
    // console.log("Transaction confirmed:", confirmation)
    // if (confirmation.value.err) {
    //   console.log("Transaction failed")
    //   return
    // }

    transactions.push(tx)
  }

  // transactions.map(async (tx, i) => console.log(i, " | ", tx.serialize().length, "bytes | \n", (await connection.simulateTransaction(tx, { sigVerify: true }))))

  console.log("Sending bundle...")
  if (LIL_JIT_MODE) {
    const bundleId = await sendBundle(transactions)
    if (!bundleId) {
      console.log("Failed to send bundle")
      return
    }
  } else {
    await executeJitoTx(transactions, mainKp, commitment)
  }
  await sleep(10000)
}

main()
