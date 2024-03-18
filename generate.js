import {Keypair} from "@solana/web3.js";
import * as fs from "fs";
import {homedir} from "os";

function generateAndSavePrivateKey() {
    const pair = Keypair.generate()
    const privateKey = pair.secretKey

    const newPair = Keypair.fromSecretKey(privateKey)
    if (newPair.publicKey.toString() !== pair.publicKey.toString()) {
        console.error("public key is not equal")
        return
    } else {
        console.info(newPair.publicKey.toString())
    }

    fs.writeFileSync(homedir() + "/key/solana/arbi1", pair.secretKey)
    fs.writeFileSync(homedir() + "/key_copied/solana/arbi1", pair.secretKey)
}

// generateAndSavePrivateKey()
