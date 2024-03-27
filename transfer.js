import {homedir} from "os";
import {
    Connection, Transaction, SystemProgram, Keypair, VersionedTransaction, LAMPORTS_PER_SOL, sendAndConfirmTransaction
} from "@solana/web3.js";
import * as fs from "fs";
import base58 from "bs58";
import http from "http";
import url from "url";
import bs58 from "bs58";

const ALCHEMY_API_KEY = fs.readFileSync(homedir() + "/key/alchemy/api_key", "utf8").slice(0, -1)
const RPC = 'https://solana-mainnet.g.alchemy.com/v2/' + ALCHEMY_API_KEY;
const KEY_FILE = homedir() + '/key/solana/arbi1';

const connection = new Connection(RPC)

async function transferSol(fromKeyPair, toAddress, amount) {
    console.log("transferring", amount, "sol", fromKeyPair.publicKey.toString(), "to", toAddress)
    const transaction = new Transaction().add(SystemProgram.transfer({
        fromPubkey: fromKeyPair.publicKey, toPubkey: toAddress, lamports: amount,
    }));

    // Sign transaction, broadcast, and confirm
    return await sendAndConfirmTransaction(connection, transaction, [fromKeyPair]);
}

async function transferWithArbi1() {
    const keyStr = fs.readFileSync(KEY_FILE, 'utf8')
    const fromKeyPair = Keypair.fromSecretKey(base58.decode(keyStr))
    // const toKeyPair = Keypair.generate()
    await transferSol(fromKeyPair, "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9", 1)
}

const server = http.createServer(async (req, res) => {
    const q = url.parse(req.url, true).query;
    const amount = q.amount;
    const fromPrivateKey = q.fromPrivateKey;
    const toAddress = q.toAddress

    const keyPair = Keypair.fromSecretKey(bs58.decode(fromPrivateKey))

    console.info("new request", "amount", amount, "fromAddress", keyPair.publicKey.toString(), "toAddress", toAddress);
    if (amount === undefined || fromPrivateKey === undefined || toAddress === undefined) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('params are not completed\n');
        return
    }
    try {
        const txId = await transferSol(keyPair, toAddress, amount);
        console.info("txId", txId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end(txId + '\n');
    } catch (e) {
        console.error(e.toString())
        res.statusCode = 501;
        res.setHeader('Content-Type', 'text/plain');
        res.end(e.toString() + "\n")
    }
});

const hostname = '127.0.0.1';
const port = 2999;

server.listen(port, hostname, () => {
    console.log(`Server running at ${port}`);
});
