import {Connection, Keypair, VersionedTransaction} from '@solana/web3.js';
import fetch from 'cross-fetch';
import {Wallet} from '@project-serum/anchor';
import bs58 from 'bs58';
import fs from 'node:fs';
import url from "url";
import * as http from "http";
import {homedir} from "os";

const ALCHEMY_API_KEY = fs.readFileSync(homedir() + "/key/alchemy/api_key", "utf8").slice(0, -1)

const RPC = 'https://solana-mainnet.g.alchemy.com/v2/' + ALCHEMY_API_KEY;
// const RPC = 'https://solana-mainnet.g.alchemy.com/v2/alch-demo/';
// const RPC = 'https://neat-hidden-sanctuary.solana-mainnet.discover.quiknode.pro/2af5315d336f9ae920028bbb90a73b724dc1bbed/'
const KEY_FILE = homedir() + '/key/solana/arbi1';

console.log("RPC", RPC);

const connection = new Connection(RPC, "confirmed");

// TODO

function readPrivateKey(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

async function swap(keyPair, inputMint, outputMint, amount, slippageBps = 50) {
    console.log("using wallet", keyPair.publicKey.toString());

    console.log(inputMint, outputMint, amount, slippageBps);
    const quoteResponse = await (await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`)).json();

    console.log(quoteResponse);

    // get serialized transactions for the swap
    const {swapTransaction} = await (await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST', headers: {
            'Content-Type': 'application/json'
        }, body: JSON.stringify({
            // quoteResponse from /quote api
            quoteResponse, // user public key to be used for the swap
            userPublicKey: keyPair.publicKey.toString(), // auto wrap and unwrap SOL. default is true
            wrapAndUnwrapSol: true, // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
            // feeAccount: "fee_account_public_key"
        })
    })).json();

    // deserialize the transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    // sign the transaction
    transaction.sign([keyPair]);

    console.log(transaction);

    // Execute the transaction
    const rawTransaction = transaction.serialize();

    return await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true, maxRetries: 2, preflightCommitment: "processed"
    });

}

async function swapWithPvk(privateKey, inputMint, outputMint, amount, slippageBps = 50) {
    // It is recommended that you use your own RPC endpoint.
    // This RPC endpoint is only for demonstration purposes so that this example will run.
    const keyPair = Keypair.fromSecretKey(bs58.decode(privateKey));
    return swap(keyPair, inputMint, outputMint, amount, slippageBps);
}

const hostname = '127.0.0.1';
const port = 3000;

const privateKey = readPrivateKey(KEY_FILE);

const swapServer = http.createServer(async (req, res) => {
    const q = url.parse(req.url, true).query;
    const fromPrivateKey = q.fromPrivateKey;
    const inputMint = q.inputMint;
    const outputMint = q.outputMint;
    const amount = q.amount;

    const keyPair = Keypair.fromSecretKey(bs58.decode(fromPrivateKey));

    console.info("new request", "signer", keyPair.publicKey.toString(), "inputMint", inputMint, "outputMin", outputMint, "amount", amount, "slippage", q.slippageBps);
    if (fromPrivateKey === undefined || inputMint === undefined || outputMint === undefined || amount === undefined) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('params are not completed\n');
        return
    }

    try {
        const txId = await swap(keyPair, inputMint, outputMint, amount, q.slippageBps);
        console.info("txId", txId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end(txId + '\n');
    } catch (e) {
        console.error(e.toString());
        res.statusCode = 501;
        res.setHeader("Content-Type", "text/plain");
        res.end(e.toString + "\n");
    }
});

swapServer.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
