module.exports = {
  networks: {
    development: {
      host: "127.0.0.1", // Localhost (Ganache default)
      port: 8545,        // Ganache default port (check Ganache settings)
      network_id: "*",   // Match any network ID (Ganache uses 5777 or similar)
    },
  },

  // Configure the Solidity compiler
  compilers: {
    solc: {
      version: "0.8.20", // Use a specific version compatible with your contract
    },
  },
};
