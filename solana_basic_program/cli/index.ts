//@ts-ignore
import * as web3 from "@solana/web3.js";
import fs from "fs";
import { Buffer } from "buffer";
const connection = new web3.Connection(
  web3.clusterApiUrl("devnet"),
  "confirmed"
);

async function main() {
  // 2) Charger le wallet émetteur
  const secretKeyArray = JSON.parse(
    fs.readFileSync(new URL("my-wallet.json", import.meta.url), "utf-8")
  );
  const key: Uint8Array = Uint8Array.from(secretKeyArray);
  const signer = web3.Keypair.fromSecretKey(key);
  let programId = new web3.PublicKey(
    "FjsgZxZrxjNygJwhnsHcHE4AvNVPbfg5cWZdEoGY87vn"  //Id obtenu lors du déploiement du programme
  );

  let transaction: web3.Transaction = new web3.Transaction();
  transaction.add(
    new web3.TransactionInstruction({
      keys: [],
      programId,
      data: Buffer.alloc(0),
    })
  );
  await web3
    .sendAndConfirmTransaction(connection, transaction, [signer])
    .then((sig) => {
      console.log("Transaction sent with signature: ", sig);
    });
}

main().catch(console.error);
