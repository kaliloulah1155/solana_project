import {
  Keypair,
  PublicKey,
  Connection,
  clusterApiUrl,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs";
import {
  createAssociatedTokenAccountIdempotent,
  getAssociatedTokenAddress,
  createTransferInstruction,
  createMint,
  mintTo,
} from "@solana/spl-token";

(async () => {
  // 1) Connexion Devnet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // 2) Charger le wallet émetteur
  const secretKeyArray = JSON.parse(
    fs.readFileSync(new URL("my-wallet.json", import.meta.url), "utf-8")
  );
  const payer = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
  console.log("PRIVATE KEY (base58) :", bs58.encode(payer.secretKey));
  console.log("ADRESSE DU WALLET-FICHIER :", payer.publicKey.toBase58());

  // 3) Créer un mint dont tu es l'autorité
  /*const mint = await createMint(
    connection,
    payer,              // payeur
    payer.publicKey,    // mint authority
    null,               // freeze authority (none)
    6                   // décimales
  );
  console.log("Mint créé :", mint.toBase58());*/
  const mint = new PublicKey("5qiZxPJdJmmYtnXKbFVYWW5a44u23E8trmL7VwAYD5Q2");
 // à remplacer par le mint créé

  // 4) Adresse du destinataire
  const dest = new PublicKey("C4BBg4ZyhVU1ai6J5W3zGuFjKwkERcYCL8GCiyvKqb8A");

  // 5) Créer (si besoin) les ATA source et destination
  await createAssociatedTokenAccountIdempotent(connection, payer, mint, payer.publicKey);
  await createAssociatedTokenAccountIdempotent(connection, payer, mint, dest);

  // 6) Récupérer les adresses de token-account
  const srcTokenAddr = await getAssociatedTokenAddress(mint, payer.publicKey);
  const dstTokenAddr = await getAssociatedTokenAddress(mint, dest);

  // 7) Mint 50 tokens si tu n’en as pas assez
  const info = await connection.getTokenAccountBalance(srcTokenAddr);
  if (!info.value.uiAmount || info.value.uiAmount < 33) {
    await mintTo(connection, payer, mint, srcTokenAddr, payer, 50 * 10 ** 6);
  }

  // 8) Transfert de 33 tokens
  const ix = createTransferInstruction(
    srcTokenAddr,
    dstTokenAddr,
    payer.publicKey,
    33 * 10 ** 6 // 6 décimales
  );

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer]);

  console.log("✅ Transaction réussie :", sig);
})();