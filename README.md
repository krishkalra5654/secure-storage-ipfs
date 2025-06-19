# 🔐 Secure Storage dApp with IPFS & Smart Contracts

A decentralized file storage system that ensures **data privacy**, **integrity**, and **availability** — even if centralized systems fail. Built using **Solidity**, **IPFS**, and **Node.js**, with a simple HTML frontend.


---

## 🚀 Tech Stack

![Solidity](https://img.shields.io/badge/SmartContract-Solidity-blue)
![IPFS](https://img.shields.io/badge/Storage-IPFS-lightgrey)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green)
![JavaScript](https://img.shields.io/badge/Script-JavaScript-yellow)
![Truffle](https://img.shields.io/badge/Framework-Truffle-8A2BE2)
![Ganache](https://img.shields.io/badge/LocalChain-Ganache-orange)

---

## 🔍 Features

- 📦 Upload and store file **hashes** securely on-chain
- 🧠 Decentralized backend using **IPFS**
- 🔒 Data cannot be tampered once added
- 🌐 Connected to Ethereum test blockchain via **Truffle & Ganache**
- 💻 Frontend built using basic **HTML + JS**

---

## 📁 Project Structure

secure-storage/
├── contracts/ # Solidity smart contract
├── migrations/ # Truffle migration scripts
├── build/ # Compiled contract artifacts
├── store_the_hash.mjs # Node.js script to upload + interact
├── index.html # Simple UI for demo
├── package.json # Node dependencies
└── truffle-config.js # Local chain configuration


---

## ⚙️ How to Run Locally

### 1. Clone the Repo

```bash
git clone https://github.com/krishkalra5654/secure-storage-ipfs.git
cd secure-storage-ipfs

Install Node Dependencies
npm install
Start Ganache CLI or UI
Ensure it's running on port 8545.
compile & Migrate Contracts
truffle compile
truffle migrate



