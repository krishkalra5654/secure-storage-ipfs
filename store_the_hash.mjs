import { create } from 'ipfs-http-client';
import Web3 from 'web3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import CryptoJS from 'crypto-js';

// For ES Modules, define __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    // IPFS setup
    const ipfs = create({ url: 'http://127.0.0.1:5001' });
    const web3 = new Web3('http://127.0.0.1:8545');
    const accounts = await web3.eth.getAccounts();
    console.log("Accounts:", accounts);
    const owner = accounts[0];
    const user = accounts[1];

    // Load contract ABI and address
    const contractPath = path.join(__dirname, 'build/contracts/SecureStorage.json');
    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
    const contractABI = contractJson.abi;
    const networkId = Object.keys(contractJson.networks)[0];
    const contractAddress = contractJson.networks[networkId].address;
    const contract = new web3.eth.Contract(contractABI, contractAddress);

    console.log(`Using contract at ${contractAddress} on network ${networkId}`);

    const SECRET_KEY = 'my-secret-key-123';
    const KEY_ENCRYPTION_KEY = 'key-encryption-key-456';

    // Encrypt and Upload function
    async function encryptAndUpload(fileContent, fileName, isPublic) {
        try {
            // Encrypt the file content
            const encryptedContent = CryptoJS.AES.encrypt(fileContent, SECRET_KEY).toString();
            const { cid } = await ipfs.add(encryptedContent);
            const ipfsHash = cid.toString();
            console.log(`Uploaded encrypted ${fileName} to IPFS: ${ipfsHash}`);

            // Encrypt the secret key for storage
            const encryptedKey = CryptoJS.AES.encrypt(SECRET_KEY, KEY_ENCRYPTION_KEY).toString();

            // Estimate gas first
            const gasEstimate = await contract.methods.storeFile(
                ipfsHash,
                fileName,
                encryptedKey,
                isPublic
            ).estimateGas({ from: owner });

            console.log(`Gas estimate: ${gasEstimate}`);

            // Convert BigInt to number for gas calculation
            const gasLimit = Number(gasEstimate) * 1.5;

            // Store on the blockchain
            const receipt = await contract.methods.storeFile(
                ipfsHash,
                fileName,
                encryptedKey,
                isPublic
            ).send({
                from: owner,
                gas: Math.floor(gasLimit).toString() // Convert to string to avoid BigInt issues
            });

            console.log('Transaction receipt:', receipt);

            const count = await contract.methods.getFileCount().call({ from: owner });
            const id = Number(count) - 1;
            const fileData = await contract.methods.getFile(id).call({ from: owner });
            console.log(`Stored file:`, {
                id: id,
                ipfsHash: fileData[0],
                fileName: fileData[1],
                encryptedKey: fileData[2],
                isPublic: fileData[4],
                timestamp: new Date(Number(fileData[3]) * 1000).toISOString()
            });

            // Verify the content
            const ipfsContent = await ipfs.cat(ipfsHash);
            const decrypted = CryptoJS.AES.decrypt(ipfsContent.toString(), SECRET_KEY).toString(CryptoJS.enc.Utf8);
            console.log(`Decrypted content: ${decrypted}`);

            return ipfsHash;
        } catch (error) {
            console.error(`Failed to upload ${fileName}:`, error);
            throw error;
        }
    }

    // Verify contract ownership
    try {
        const contractOwner = await contract.methods.owner().call();
        console.log(`Contract owner: ${contractOwner}`);
        console.log(`Current caller: ${owner}`);
        if (contractOwner.toLowerCase() !== owner.toLowerCase()) {
            throw new Error("Caller is not the contract owner!");
        }
    } catch (error) {
        console.error("Ownership verification failed:", error);
        process.exit(1);
    }

    // Admin tasks - updated to use correct function name
    try {
        console.log("Adding user to allowed list...");
        // Check if user is already allowed - update this to match your contract's function name
        const isAllowed = await contract.methods.isAllowed(user).call(); // Changed from allowedUsers
        if (!isAllowed) {
            const tx = await contract.methods.addAllowedUser(user).send({ from: owner });
            console.log("User added:", user, "Tx:", tx.transactionHash);
        } else {
            console.log("User already allowed:", user);
        }
    } catch (error) {
        console.error("Failed to add user:", error);
        // If isAllowed doesn't exist, just try to add the user directly
        try {
            const tx = await contract.methods.addAllowedUser(user).send({ from: owner });
            console.log("User added (fallback):", user, "Tx:", tx.transactionHash);
        } catch (fallbackError) {
            console.error("Fallback add user failed:", fallbackError);
        }
    }

    // Upload encrypted files with error handling
    const uploadFile = async (content, name, isPublic) => {
        try {
            console.log(`\nAttempting to upload ${name}...`);
            await encryptAndUpload(content, name, isPublic);
            console.log(`Successfully uploaded ${name}`);
        } catch (error) {
            console.error(`Failed to upload ${name}:`, error.message);
        }
    };

    await uploadFile("Hello, blockchain!", "greeting.txt", true);
    await uploadFile("Secret data", "data.txt", false);

    // List all stored files
    try {
        const fileCount = await contract.methods.getFileCount().call({ from: owner });
        console.log(`\nTotal files stored: ${fileCount}`);
        
        for (let i = 0; i < fileCount; i++) {
            try {
                const fileData = await contract.methods.getFile(i).call({ from: owner });
                console.log(`\nFile ${i}:`, {
                    ipfsHash: fileData[0],
                    fileName: fileData[1],
                    encryptedKey: fileData[2],
                    timestamp: new Date(Number(fileData[3]) * 1000).toISOString(),
                    isPublic: fileData[4]
                });
            } catch (error) {
                console.error(`Error reading file ${i}:`, error.message);
            }
        }
    } catch (error) {
        console.error("Failed to retrieve files:", error);
    }
}

main().catch(console.error);
