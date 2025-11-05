// Importation des librairies nécessaires
import * as borsh from "borsh";              // Pour sérialiser/désérialiser les données (même format que Rust)
import * as web3 from "@solana/web3.js";     // SDK officiel Solana pour interagir avec la blockchain
import fs from "fs";                         // Pour lire des fichiers locaux (ici la clé privée)
import { Buffer } from "buffer";             // Pour manipuler des buffers binaires
 
// Variable globale qui contiendra la clé publique du compte de données
let greetedPubkey: web3.PublicKey;

// -----------------------------------------------------------------------------
// 🧱 1️⃣ Définition du modèle de données (équivalent du struct Rust)
// -----------------------------------------------------------------------------
class GreetingAccount {
  counter: number = 0; // Compteur (valeur numérique stockée sur la blockchain)

  constructor(fields?: { counter: number }) {
    if (fields) {
      this.counter = fields.counter;
    }
  }
}

// -----------------------------------------------------------------------------
// 📦 2️⃣ Schéma Borsh — définit la structure binaire des données
// -----------------------------------------------------------------------------
const GreetingSchema = new Map([
  // La classe GreetingAccount correspond à une structure avec un champ "counter" de type u32
  [GreetingAccount, { kind: "struct", fields: [["counter", "u32"]] }],
]);

// -----------------------------------------------------------------------------
// 📏 3️⃣ Calcul de la taille du compte (nombre d’octets à réserver sur Solana)
// -----------------------------------------------------------------------------
const GREETING_SIZE = borsh.serialize(GreetingSchema, new GreetingAccount()).length;

// -----------------------------------------------------------------------------
// 🌐 4️⃣ Connexion au réseau Solana (ici Devnet)
// -----------------------------------------------------------------------------
const connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");

// -----------------------------------------------------------------------------
// 🚀 5️⃣ Fonction principale : envoie une transaction au programme Solana
// -----------------------------------------------------------------------------
async function main() {
  // 🔑 Lecture de la clé secrète depuis le fichier `my-wallet.json`
  const key: Uint8Array = Uint8Array.from(
    JSON.parse(fs.readFileSync(new URL("my-wallet.json", import.meta.url), "utf-8"))
  );

  // Création du portefeuille (Keypair) à partir de la clé secrète
  const signer = web3.Keypair.fromSecretKey(key);

  // ID du programme Solana déployé (ton programme on-chain)
  const programId = new web3.PublicKey(
    "DDPM5z1VT7oh1aSaQaZhkky4KGKnbAkNMnupbCeJbtQn"
  );

  // 🔹 Seed pour dériver une adresse (désactivé ici car le compte existe déjà)
  // const GREETING_SEED = "hello 333";

  // 🔹 Si tu voulais créer un compte dérivé :
  // greetedPubkey = await web3.PublicKey.createWithSeed(
  //   signer.publicKey,
  //   GREETING_SEED,
  //   programId
  // );

  // 🔹 On réutilise un compte déjà existant sur la blockchain
  greetedPubkey = new web3.PublicKey("88mpksGMAwrp21JfP8UjizaULaN7PJMd66zbzVfye6XZ");

  // Calcul du minimum de SOL à déposer pour que le compte soit "rent-exempt" (non supprimé)
  const lamports = await connection.getMinimumBalanceForRentExemption(GREETING_SIZE);

  // Création d’une nouvelle transaction Solana
  const transaction = new web3.Transaction();

  // ---------------------------------------------------------------------------
  // 🏗️ (Optionnel) Création du compte — désactivé car déjà existant
  // ---------------------------------------------------------------------------
  // transaction.add(
  //   web3.SystemProgram.createAccountWithSeed({
  //     fromPubkey: signer.publicKey,
  //     basePubkey: signer.publicKey,
  //     seed: GREETING_SEED,
  //     newAccountPubkey: greetedPubkey,
  //     lamports: lamports,
  //     space: GREETING_SIZE,
  //     programId: programId,
  //   })
  // );

  // ---------------------------------------------------------------------------
  // 📤 6️⃣ Sérialisation des données avec Borsh
  // Ici, on crée un objet { counter: n } et on le convertit en Buffer binaire
  // ---------------------------------------------------------------------------
  const data = Buffer.from(
    borsh.serialize(GreetingSchema, new GreetingAccount({ counter: 2 }))
  );

  // ---------------------------------------------------------------------------
  // 🧩 7️⃣ Création de l’instruction pour appeler le programme on-chain
  // ---------------------------------------------------------------------------
  transaction.add(
    new web3.TransactionInstruction({
      // Liste des comptes utilisés par le programme
      keys: [
        { pubkey: greetedPubkey, isSigner: false, isWritable: true }, // Le compte où on écrit les données
      ],
      programId: programId, // Le programme qui va exécuter la logique
      data: data, // Les données à lui transmettre (binaire encodé en Borsh)
    })
  );
 
  // ---------------------------------------------------------------------------
  // 📬 8️⃣ Envoi et confirmation de la transaction sur le réseau Solana
  // ---------------------------------------------------------------------------
  await web3
    .sendAndConfirmTransaction(connection, transaction, [signer])
    .then((sig) => console.log("✅ Signature:", sig))
    .catch((err) => console.error("❌ Transaction failed:", err));

  // ---------------------------------------------------------------------------
  // 📖 9️⃣ Lecture du compte après exécution pour afficher le compteur
  // ---------------------------------------------------------------------------
  await reportGreeting();
}

// -----------------------------------------------------------------------------
// 🧾 10️⃣ Fonction utilitaire : lit les données du compte sur Solana
// -----------------------------------------------------------------------------
async function reportGreeting() {
  // Lecture des informations du compte
  const accountInfo = await connection.getAccountInfo(greetedPubkey);

  if (!accountInfo) {
    console.log("⚠️ Le compte n'existe pas sur la blockchain.");
    return;
  }

  // Désérialisation des données binaires pour obtenir l’objet GreetingAccount
  const greeting = borsh.deserialize(
    GreetingSchema,
    GreetingAccount,
    accountInfo.data
  );

  // Affichage du compteur lu depuis la blockchain
  console.log(
    "📊 Compte:",
    greetedPubkey.toBase58(),
    "→ Counter:",
    greeting.counter,
    "time(s)"
  );
}

// -----------------------------------------------------------------------------
// ▶️ 11️⃣ Exécution du programme principal
// -----------------------------------------------------------------------------
main()
  .then(() => console.log("🏁 Finished"))
  .catch((err) => console.error("💥 Erreur:", err));
