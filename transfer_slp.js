import {getOrCreateAssociatedTokenAccount, createTransferInstruction, transfer} from "@solana/spl-token";
import {
    Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, VersionedTransaction
} from "@solana/web3.js";
import {homedir} from "os";
import * as fs from "fs";
import bs58 from "bs58";
import http from "http";
import url from "url";

async function transferSpl(connection, fromPair, toAddr, mint, amount) {
    console.log(`Sending ${amount} ${(mint)} from ${(fromPair.publicKey.toString())} to ${(toAddr)}.`);

    //Step 1
    console.log(`1 - Getting Source Token Account`);
    let sourceAccount = await getOrCreateAssociatedTokenAccount(connection, fromPair, new PublicKey(mint), fromPair.publicKey);
    console.log(`Source Account: ${sourceAccount.address.toString()}`);

    //Step 2
    console.log(`2 - Getting Destination Token Account`);
    let destinationAccount = await getOrCreateAssociatedTokenAccount(connection, fromPair, new PublicKey(mint), new PublicKey(toAddr));
    console.log(`Destination Account: ${destinationAccount.address.toString()}`);

    //Step 3
    console.log(`3 - Transferring`)
    const signature = await transfer(
        connection,
        fromPair,
        sourceAccount.address,
        destinationAccount.address,
        fromPair.publicKey,
        amount,
        // [fromPair]
    )
    console.log("Transferred", signature)
}

async function transferSpl2(connection, fromPvk, toAddr, mint, amount) {
    const fromPair = Keypair.fromSecretKey(bs58.decode(fromPvk));
    await transferSpl(connection, fromPair, toAddr, mint, amount)
}

async function getNumberDecimals(connection, mintAddress) {
    const info = await connection.getParsedAccountInfo(new PublicKey(mintAddress));
    return info.value?.data.parsed.info.decimals;
}

const ALCHEMY_API_KEY = fs.readFileSync(homedir() + "/key/alchemy/api_key", "utf8").slice(0, -1);

// const RPC = 'https://solana-mainnet.g.alchemy.com/v2/' + ALCHEMY_API_KEY;
const RPC = "https://api.mainnet-beta.solana.com"

console.log("RPC", RPC)

const connect = new Connection(RPC);

// getNumberDecimals(connect, "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82").then((value) => console.log(value))

const KEY_FILE = homedir() + '/key/solana/arbi1';

function readPrivateKey() {
    return fs.readFileSync(KEY_FILE, 'utf8');
}

const fromPair = Keypair.fromSecretKey(bs58.decode(readPrivateKey()));

console.log("Wallet", fromPair.publicKey.toString());

const bnSelfWalletAddr = "F7GgZyEtov9PdaU8mHN8fzxPRBewCe6gzoqUMsbUxqLU";
const bnHotWalletAddr = "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9";

transferSpl(connect, fromPair, bnSelfWalletAddr, "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82", 1_000000).then();

const swapServer = http.createServer(async (req, res) => {
    const q = url.parse(req.url, true).query;
    const mint = q.mint;
    const amount = q.amount;
    const fromPrivateKey = q.fromPrivateKey;
    const toAddress = q.toAddress

    const keyPair = Keypair.fromSecretKey(bs58.decode(fromPrivateKey))

    console.info("new request", "mint", mint, "amount", amount, "fromAddress", keyPair.publicKey.toString(), "toAddress", toAddress);
    if (mint === undefined || amount === undefined || fromPrivateKey === undefined || toAddress === undefined) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('params are not completed\n');
        return
    }
    try {
        const txId = await transferSpl(connect, keyPair, toAddress, mint, amount);
        console.info("txId", txId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end(txId + '\n');
    } catch (e) {
        res.statusCode = 501;
        res.setHeader('Content-Type', 'text/plain');
        res.end(e.toString())
    }
});

const hostname = '127.0.0.1';
const port = 3001;

// swapServer.listen(port, hostname, () => {
//     console.log(`Server running at ${port}`);
// });
