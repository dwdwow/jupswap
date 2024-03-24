import {getOrCreateAssociatedTokenAccount, createTransferInstruction} from "@solana/spl-token";
import {
    Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, VersionedTransaction
} from "@solana/web3.js";
import {homedir} from "os";
import * as fs from "fs";
import {Wallet} from "@project-serum/anchor";
import bs58 from "bs58";

async function transferSpl(connection, fromPair, toAddr, mint, amount) {
    console.log(`Sending ${amount} ${(mint)} from ${(fromPair.publicKey.toString())} to ${(toAddr)}.`)

    //Step 1
    console.log(`1 - Getting Source Token Account`);
    let sourceAccount = await getOrCreateAssociatedTokenAccount(connection, fromPair, new PublicKey(mint), fromPair.publicKey);
    console.log(`Source Account: ${sourceAccount.address.toString()}`);

    //Step 2
    console.log(`2 - Getting Destination Token Account`);
    let destinationAccount = await getOrCreateAssociatedTokenAccount(connection, fromPair, new PublicKey(mint), new PublicKey(toAddr));
    console.log(`Destination Account: ${destinationAccount.address.toString()}`);

    //Step 3
    console.log(`3 - Creating Transaction`);
    const tx = new Transaction();
    // const latestBlockHash = await connection.getLatestBlockhash('confirmed');
    // tx.recentBlockhash = await latestBlockHash.blockhash;
    tx.add(createTransferInstruction(sourceAccount.address, destinationAccount.address, fromPair.publicKey, amount))
    console.log("Transfer Instruction Created")


    // TODO

    //Step 4
    // console.log(`4 - Signing Transaction`)
    // tx.sign([fromPair.payer])
    // console.log(`Transaction Signed`)

    //Step 5
    // console.log(`5 - Sending Transaction`)
    // const rawTransaction = tx.serialize()
    // const sendResult = await connection.sendRawTransaction(rawTransaction, {
    //     skipPreflight: true, maxRetries: 2, preflightCommitment: "processed"
    // });
    // console.log(`Transaction Send`)
    //
    // return sendResult

    //Step 4
    console.log(`4 - Sending Transaction`)
    const latestBlockHash = await connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = await latestBlockHash.blockhash;
    const signature = await sendAndConfirmTransaction(connection, tx, [fromPair.payer]);
    console.log('\x1b[32m', //Green Text
        `   Transaction Success!🎉`, `\n    https://explorer.solana.com/tx/${signature}?cluster=devnet`);
}

async function getNumberDecimals(connection, mintAddress) {
    const info = await connection.getParsedAccountInfo(new PublicKey(mintAddress));
    return info.value?.data.parsed.info.decimals;
}

const ALCHEMY_API_KEY = fs.readFileSync(homedir() + "/key/alchemy/api_key", "utf8").slice(0, -1)

const RPC = 'https://solana-mainnet.g.alchemy.com/v2/' + ALCHEMY_API_KEY;

const connect = new Connection(RPC)

// getNumberDecimals(connect, "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82").then((value) => console.log(value))

const KEY_FILE = homedir() + '/key/solana/arbi1';

function readPrivateKey() {
    return fs.readFileSync(KEY_FILE, 'utf8');
}

const fromPair = new Wallet(Keypair.fromSecretKey(bs58.decode(readPrivateKey())));

console.log("Wallet", fromPair.publicKey.toString())

transferSpl(connect, fromPair, "F7GgZyEtov9PdaU8mHN8fzxPRBewCe6gzoqUMsbUxqLU", "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82", 300000000).then()
