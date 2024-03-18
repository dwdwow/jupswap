import {Keypair} from "@solana/web3.js";
import * as fs from "fs";
import {homedir} from "os";
import base58 from "bs58";

function readAndPrintKey() {
    const data = fs.readFileSync(homedir() + "/key/solana/arbi1", "utf8")
    const pair = Keypair.fromSecretKey(base58.decode(data))
    console.log(pair.publicKey.toString())
}

readAndPrintKey()
