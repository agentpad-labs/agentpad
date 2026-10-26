#!/usr/bin/env node
/**
 * Agent Pad indexer — rebuilds web/data/launches.json from chain state.
 *
 * Reads the factory's launch list, then each curve's live numbers (price, BNB raised,
 * graduation state). Trades are reconstructed from the curve's Bought/Sold events using
 * small block windows, because public BSC RPCs refuse wide getLogs ranges.
 *
 * Usage: FACTORY=0x… RPC=https://… node scripts/index_launches.js
 */
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const RPC = process.env.RPC || "https://bsc-rpc.publicnode.com";
const FACTORY = process.env.FACTORY || "";
const FROM_BLOCK = Number(process.env.FROM_BLOCK || 0);
const CHUNK = 900;
const OUT = path.join(__dirname, "..", "web", "data", "launches.json");

const FACTORY_ABI = [
  "function launchesLength() view returns (uint256)",
  "function launches(uint256) view returns (address token, address curve, address creator, string name, string symbol, string metadataURI, uint64 createdAt)",
];
const CURVE_ABI = [
  "function price() view returns (uint256)",
  "function realBnbReserve() view returns (uint256)",
  "function graduated() view returns (bool)",
  "function agentOnlyPhase() view returns (bool)",
  "event Bought(address indexed buyer, uint256 bnbIn, uint256 tokensOut, uint256 fee)",
  "event Sold(address indexed seller, uint256 tokensIn, uint256 bnbOut, uint256 fee)",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function logs(contract, from, to) {
  for (let i = 0; i < 3; i++) {
    try {
      return await contract.queryFilter("*", from, to);
    } catch (e) {
      await sleep(700 * (i + 1));
    }
  }
  return null;
}

async function tradesFor(curveAddr, provider, head) {
  const curve = new ethers.Contract(curveAddr, CURVE_ABI, provider);
  const trades = [];
  const start = FROM_BLOCK || Math.max(0, head - 60_000);
  for (let from = start; from <= head; from += CHUNK) {
    const to = Math.min(from + CHUNK - 1, head);
    const evs = await logs(curve, from, to);
    if (!evs) continue; // a failed window must not read as "no trades"
    for (const ev of evs) {
      const name = ev.fragment && ev.fragment.name;
      if (name === "Bought") {
        trades.push({ side: "buy", who: ev.args.buyer, bnbWei: ev.args.bnbIn.toString(), tx: ev.transactionHash, block: ev.blockNumber });
      } else if (name === "Sold") {
        trades.push({ side: "sell", who: ev.args.seller, bnbWei: ev.args.bnbOut.toString(), tx: ev.transactionHash, block: ev.blockNumber });
      }
    }
    await sleep(150);
  }
  return trades;
}

async function main() {
  if (!FACTORY) {
    console.error("FACTORY not set — nothing to index yet");
    process.exit(1);
  }
  const provider = new ethers.JsonRpcProvider(RPC, 56, { staticNetwork: true });
  const factory = new ethers.Contract(FACTORY, FACTORY_ABI, provider);
  const head = await provider.getBlockNumber();
  const n = Number(await factory.launchesLength());

  const launches = [];
  for (let i = 0; i < n; i++) {
    const l = await factory.launches(i);
    const curve = new ethers.Contract(l.curve, CURVE_ABI, provider);
    const [price, raised, graduated] = await Promise.all([
      curve.price().catch(() => 0n),
      curve.realBnbReserve().catch(() => 0n),
      curve.graduated().catch(() => false),
    ]);
    const trades = await tradesFor(l.curve, provider, head);
    let lastPrice = 0;
    for (const t of trades) lastPrice = Math.max(lastPrice, Number(price));
    launches.push({
      id: i,
      name: l.name,
      symbol: l.symbol,
      token: l.token,
      curve: l.curve,
      creator: l.creator,
      metadataURI: l.metadataURI,
      createdAt: Number(l.createdAt),
      raisedWei: raised.toString(),
      priceWei: price.toString(),
      graduated,
      trades: trades.map((t) => ({ side: t.side, who: t.who, bnbWei: t.bnbWei, tx: t.tx, price: lastPrice })),
    });
    console.log(`#${i} ${l.symbol} · raised ${ethers.formatEther(raised)} BNB · trades ${trades.length}`);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ updatedAt: new Date().toISOString(), demo: false, block: head, launches }, null, 1));
  console.log(`wrote ${launches.length} launches -> ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
