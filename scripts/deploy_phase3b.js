// Deploy tahap 3: Vault → LPLocker → Factory (registry, treasury, prizePool, vault, router, locker)
const fs = require("fs");
const { ethers } = require("ethers");

const RPC = "https://bsc-dataseed.binance.org";
const B = "/home/ubuntu/projects/agentpad/artifacts/contracts";
const USDT = "0x55d398326f99059ff775485246999027b3197955";
const REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F";
const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // PancakeSwap V2

const DEPLOYER_KEY = fs.readFileSync("/home/ubuntu/keys/agentpad/deployer.key", "utf8").trim();
const TREASURY = fs.readFileSync("/home/ubuntu/keys/agentpad/treasury.addr", "utf8").trim();

const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(DEPLOYER_KEY.startsWith("0x") ? DEPLOYER_KEY : "0x" + DEPLOYER_KEY, provider);

async function deploy(name, args) {
  const art = JSON.parse(fs.readFileSync(`${B}/${name}.sol/${name}.json`, "utf8"));
  const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
  const fee = await provider.getFeeData();
  const c = await factory.deploy(...args, { maxFeePerGas: fee.maxFeePerGas, maxPriorityFeePerGas: fee.maxPriorityFeePerGas });
  await c.waitForDeployment();
  const addr = await c.getAddress();
  console.log(`[deploy] ${name} -> ${addr}`);
  return c;
}

(async () => {
  const bal = await provider.getBalance(wallet.address);
  console.log(`deployer ${wallet.address} saldo ${ethers.formatEther(bal)} BNB`);
  const vault = await deploy("AgentFeeVault", []);
  const locker = await deploy("LPLocker", [wallet.address]); // imperial: factory param tak terpakai di logika
  const factory = await deploy("AgentPadFactory", [REGISTRY, TREASURY, TREASURY, await vault.getAddress(), ROUTER, await locker.getAddress()]);
  setTimeout(() => {}, 100);
  fs.writeFileSync("/home/ubuntu/projects/agentpad/deploy_addresses.json", JSON.stringify({
    network: "bsc-mainnet",
    GenesisPassport: "0xf0C7eE38251281DC2947ee3272b4AD1643f3682a",
    PadMarket: "0x9230edC3067A2076B6C37d4E9230065Ae95568cd",
    AgentFeeVault: await vault.getAddress(),
    LPLocker: await locker.getAddress(),
    AgentPadFactory: await factory.getAddress(),
    treasury: TREASURY,
    deployer: wallet.address,
    usdt: USDT,
    registry: REGISTRY,
    router: ROUTER,
  }, null, 2));
  console.log("SELESAI — deploy_addresses.json diperbarui");
})();
