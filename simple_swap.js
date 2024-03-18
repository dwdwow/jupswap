import {Connection, Keypair, VersionedTransaction} from '@solana/web3.js';
import fetch from 'cross-fetch';
import {Wallet} from '@project-serum/anchor';
import bs58 from 'bs58';
import fs from 'node:fs';

const RPC = 'https://neat-hidden-sanctuary.solana-mainnet.discover.quiknode.pro/2af5315d336f9ae920028bbb90a73b724dc1bbed/'
const KEY_FILE = ''

function readPrivateKey(filePath: string): string {
    return fs.readFileSync(filePath, 'utf8')
}

async function swap(privateKey: string, inputMint: string, outputMint: string, amount: number, slippageBps: number = 50): Promise<string> {
    // It is recommended that you use your own RPC endpoint.
    // This RPC endpoint is only for demonstration purposes so that this example will run.
    const connection = new Connection(RPC);

    const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(privateKey)));

    const quoteResponse = await (await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`)).json();

    // get serialized transactions for the swap
    const {swapTransaction} = await (await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST', headers: {
            'Content-Type': 'application/json'
        }, body: JSON.stringify({
            // quoteResponse from /quote api
            quoteResponse, // user public key to be used for the swap
            userPublicKey: wallet.publicKey.toString(), // auto wrap and unwrap SOL. default is true
            wrapAndUnwrapSol: true, // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
            // feeAccount: "fee_account_public_key"
        })
    })).json();

    // deserialize the transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    console.log(transaction);

    // sign the transaction
    transaction.sign([wallet.payer]);

    // Execute the transaction
    const rawTransaction = transaction.serialize()
    return await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true, maxRetries: 2
    });
}