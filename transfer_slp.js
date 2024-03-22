import {getOrCreateAssociatedTokenAccount, createTransferInstruction} from "@solana/spl-token";
import {
    Connection,
    Keypair,
    PublicKey,
    sendAndConfirmTransaction,
    Transaction
} from "@solana/web3.js";
import {homedir} from "os";
import * as fs from "fs";

async function transferSpl(connection, fromPair, toPair, mint, amount) {

}

async function getNumberDecimals(connection, mintAddress) {
    const info = await connection.getParsedAccountInfo(new PublicKey(mintAddress));
    return info.value?.data.parsed.info.decimals;
}

const ALCHEMY_API_KEY = fs.readFileSync(homedir() + "/key/alchemy/api_key", "utf8").slice(0, -1)

const RPC = 'https://solana-mainnet.g.alchemy.com/v2/' + ALCHEMY_API_KEY;

const connect = new Connection(RPC)

getNumberDecimals(connect, "ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82").then((value) => console.log(value))


