import * as borsh from "borsh";
import * as web3 from "@solana/web3.js";
import fs from "fs";
import { Buffer } from "buffer";
 
let greetedPubkey: web3.PublicKey;

// Définition de la classe représentant le compte
class GreetingAccount {
  counter: number = 0;

  constructor(fields?: { counter: number }) {
    if (fields) {
      this.counter = fields.counter;
    }
  }
}

// Définition du schema Borsh
const GreetingSchema = new Map([
  [GreetingAccount, { kind: "struct", fields: [["counter", "u32"]] }],
]);

// Taille du compte
const GREETING_SIZE = borsh.serialize(GreetingSchema, new GreetingAccount()).length;

const connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");

async function main() {
  // Lecture de la clé secrète
  const key: Uint8Array = Uint8Array.from(
    JSON.parse(fs.readFileSync(new URL("my-wallet.json", import.meta.url), "utf-8"))
  );

  const signer = web3.Keypair.fromSecretKey(key);

  const programId = new web3.PublicKey(
    "DDPM5z1VT7oh1aSaQaZhkky4KGKnbAkNMnupbCeJbtQn"
  );

  const GREETING_SEED = "hello 333";

  // Création d'un compte avec seed
  greetedPubkey = await web3.PublicKey.createWithSeed(
    signer.publicKey,
    GREETING_SEED,
    programId
  );

  const lamports = await connection.getMinimumBalanceForRentExemption(GREETING_SIZE);

  const transaction = new web3.Transaction();

  // Création du compte
  transaction.add(
    web3.SystemProgram.createAccountWithSeed({
      fromPubkey: signer.publicKey,
      basePubkey: signer.publicKey,
      seed: GREETING_SEED,
      newAccountPubkey: greetedPubkey,
      lamports: lamports,
      space: GREETING_SIZE,
      programId: programId,
    })
  );
  // Encodage des données avec Borsh
  const data = Buffer.from(borsh.serialize(GreetingSchema, new GreetingAccount({ counter: 3 })));

  // Instruction pour le programme
  transaction.add(
    new web3.TransactionInstruction({
      keys: [{ pubkey: greetedPubkey, isSigner: false, isWritable: true }],
      programId: programId,
      data: data,
    })
  );
 

  // Envoi de la transaction
  await web3
    .sendAndConfirmTransaction(connection, transaction, [signer])
    .then((sig) => console.log("Signature:", sig))
    .catch((err) => console.error("Transaction failed:", err));

  // Lecture et affichage du compte
  await reportGreeting();
}

async function reportGreeting() {
  const accountInfo = await connection.getAccountInfo(greetedPubkey);
  if (!accountInfo) {
    console.log("Le compte n'existe pas.");
    return;
  }

  const greeting = borsh.deserialize(GreetingSchema, GreetingAccount, accountInfo.data);
  console.log(
    greetedPubkey.toBase58(),
    "has been greeted",
    greeting.counter,
    "time(s)"
  );
}

main()
  .then(() => console.log("Finished"))
  .catch((err) => console.error(err));
