import path from "path";

// local file name where we are storing the contract addresses
export const contractAddressStoreName = "contractAddresses.json";
// local file name where we are storing a previous deployment's contract addresses
export const oldContractAddressStoreName = "contractAddresses.old.json";
// local file path where we are storing the contract addresses
export const contractAddressesStore = path.resolve(__dirname, "..", "..", contractAddressStoreName);
// local file path where we are storing a previous deployment's contract addresses
export const oldContractAddressesStore = path.resolve(__dirname, "..", "..", oldContractAddressStoreName);
// local file name in subgraph module where we are storing the MACI contract address and block number
export const subgraphNetworkStoreName = "networks.json";
// local file name in subgraph module where we are storing the previous deployment's MACI contract address and block number
export const oldSubgraphNetworkStoreName = "networks.old.json";
// local file path in subgraph module where we are storing the MACI contract address and block number
export const subgraphNetworkStore = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "subgraph",
  subgraphNetworkStoreName,
);
// local file path in subgraph module where we are storing the previous deployment's MACI contract address and block number
export const oldSubgraphNetworkStore = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "subgraph",
  oldSubgraphNetworkStoreName,
);
