// Deploy tahap 4: GenesisPassport + PadMarket (BSC mainnet) dari deployer project #4
const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");
const req = createRequire("/home/ubuntu/projects/agentpad/");
const { ethers } = req("ethers");

const RPC = "https://bsc-dataseed.binance.org";
const ART = "/home/ubuntu/projects/agentpad/artifacts/contracts";
const USDT = "0x55d398326f99059ff775485246999027b3197955";
const REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F";

const DEPLOYER_KEY = fs.readFileSync("/home/ubuntu/keys/agentpad/deployer.key", "utf8").trim();
const TREASURY = fs.readFileSync("/home/ubuntu/keys/agentpad/treasury.addr", "utf8").trim();

const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(DEPLOYER_KEY.startsWith("0x") ? DEPLOYER_KEY : "0x" + DEPLOYER_KEY, provider);

function x(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

async function deploy(name, artifactPath, args) {
  const art = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
  const feeData = await provider.getFeeData();
  const c = await factory.deploy(...args, {
    maxFeePerGas: feeData.maxFeePerGas,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
  });
  const rc = await c.waitForDeployment();
  const addr = await c.getAddress();
  console.log(`[deploy] ${name} -> ${addr}`);
  return c;
}

(async () => {
  const bal = await provider.getBalance(wallet.address);
  console.log(`deployer ${wallet.address} saldo ${ethers.formatEther(bal)} BNB`);
  const passport = await deploy("GenesisPassport", "/home/ubuntu/projects/agentpad/artifacts/contracts/GenesisPassport.sol/GenesisPassport.json",
    [wallet.address /* signer interim = deployer (dibackend MCP nanti) */, REGISTRY, USDT, TREASURY]);
  const market = await deploy("PadMarket", "/home/ubuntu/projects/agentpad/artifacts/contracts/PadMarket.sol/PadMarket.json",
    [await passport.getAddress(), USDT, TREASURY]);
  fs.writeFileSync("/home/ubuntu/projects/agentpad/deploy_addresses.json", JSON.stringify({
    network: "bsc-mainnet",
    GenesisPassport: await passport.getAddress(),
    PadMarket: await market.getAddress(),
    treasury: TREASURY,
    deployer: wallet.address,
    usdt: USDT,
    registry: REGISTRY,
  }, null, 2));
  console.log("SELESAI — addresses disimpan ke deploy_addresses.json");
})();
