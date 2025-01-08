import { AnchorProvider, Program } from '@project-serum/anchor';
import { Connection, PublicKey, Keypair, clusterApiUrl } from '@solana/web3.js';
import fs from 'fs';
import readline from 'readline';

// Suppress punycode deprecation warning
process.removeAllListeners('warning');

async function processIdl(programId) {
    try {
        const connection = new Connection(
            clusterApiUrl('mainnet-beta'),
            'confirmed'
        );
        
        const wallet = {
            publicKey: Keypair.generate().publicKey,
            signTransaction: () => Promise.reject(),
            signAllTransactions: () => Promise.reject(),
        };
        
        const provider = new AnchorProvider(
            connection,
            wallet,
            {
                commitment: 'confirmed',
                preflightCommitment: 'confirmed',
            }
        );

        const pubKey = new PublicKey(programId);
        console.log(`Processing program ID: ${programId}`);
        
        const idl = await Program.fetchIdl(pubKey, provider);
        
        if (!idl) {
            throw new Error(`IDL not found for ${programId}`);
        }
        
        const filename = `${programId}_idl.json`;
        fs.writeFileSync(
            filename,
            JSON.stringify(idl, null, 2),
            'utf8'
        );
        
        console.log(`IDL written to ${filename}`);
        
    } catch (error) {
        console.error(`Error processing ${programId}:`, error.message);
    }
}

async function main() {
    try {
        const fileStream = fs.createReadStream('programid.txt');
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            const programId = line.trim();
            if (programId) {  // Skip empty lines
                await processIdl(programId);
                // Add a small delay between requests to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('Complete - all program IDs processed');
        
    } catch (error) {
        console.error('Error reading program IDs:', error);
        process.exit(1);
    }
}

main().catch(console.error);