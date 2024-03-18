import {homedir} from "os";
import {
    Connection, Transaction, SystemProgram, Keypair, VersionedTransaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction
} from "@solana/web3.js";
import * as fs from "fs";
import base58 from "bs58";

const ALCHEMY_API_KEY = fs.readFileSync(homedir() + "/key/alchemy/api_key", "utf8").slice(0, -1)
const RPC = 'https://solana-mainnet.g.alchemy.com/v2/' + ALCHEMY_API_KEY;
;
const KEY_FILE = homedir() + '/key/solana/arbi1';

function transferSol(fromKeyPair, toPubkey, amount) {
    (async () => {
        console.log(fromKeyPair.publicKey.toString(), "to", toPubkey)
        const connection = new Connection(RPC)
        const transaction = new Transaction().add(SystemProgram.transfer({
            fromPubkey: fromKeyPair.publicKey, toPubkey: toPubkey, lamports: amount,
        }));

        // Sign transaction, broadcast, and confirm
        const signature = sendAndConfirmTransaction(connection, transaction, [fromKeyPair]);
        console.log('SIGNATURE', signature);
    })()
}

function transferWithArbi1() {
    const keyStr = fs.readFileSync(KEY_FILE, 'utf8')
    const fromKeyPair = Keypair.fromSecretKey(base58.decode(keyStr))
    // const toKeyPair = Keypair.generate()
    transferSol(fromKeyPair, "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9", 1)
}

transferWithArbi1()