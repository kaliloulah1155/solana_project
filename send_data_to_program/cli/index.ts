import * as web3 from "@solana/web3.js";
import BN from "bn.js";
import fs from "fs";

const connection = new web3.Connection(
  web3.clusterApiUrl("devnet"),
  "confirmed"
);

async function main() {
  const key: Uint8Array = Uint8Array.from(
    JSON.parse(
      fs.readFileSync(new URL("my-wallet.json", import.meta.url), "utf-8")
    )
  );
  const signer = web3.Keypair.fromSecretKey(key);
  let programId = new web3.PublicKey(
    "95pjECscMErm4nPY4HNqBLKykstkAZMEowTNnaUnsXyD"
  );
  const data: Buffer = Buffer.from(
    Uint8Array.of(0, ...new BN(3).toArray("le", 8))
  );

  let transaction: web3.Transaction = new web3.Transaction();
  transaction.add(
    new web3.TransactionInstruction({
      keys: [],
      programId: programId,
      data: data,
    })
  );
  await web3
    .sendAndConfirmTransaction(connection, transaction, [signer])
    .then((sig) => console.log("Signature:", sig))
    .catch((err) => console.error(err));
}

main()
  .then(() => console.log("Finished"))
  .catch((err) => console.error(err));
