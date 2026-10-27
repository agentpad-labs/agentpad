// E2E test challenge-server: challenge → solve (walksat) → submit → verify sig recovers signer
import { ethers } from "ethers";
import fs from "fs";

const BASE = "http://127.0.0.1:8907";
const wallet = new ethers.Wallet(ethers.Wallet.createRandom().privateKey); // simulasi minta user

const post = async (p, o) => (await fetch(BASE + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(o) })).json();

const ch = await post("/api/challenge", { wallet: wallet.address });
console.log("challenge:", ch.variables, "var /", ch.clauses.length, "klausa / epoch", ch.epoch);

// walksat super ringan max 5000 iterasi
const n = ch.variables;
const asg = Array.from({ length: n }, () => Math.random() < 0.5);
let solved = false;
for (let it = 0; it < 60000 && !solved; it++) {
  const unsat = [];
  for (const [ci, c] of ch.clauses.entries()) {
    if (!c.some((l) => asg[Math.abs(l) - 1] === l > 0)) unsat.push(ci);
  }
  if (!unsat.length) { solved = true; break; }
  const c = ch.clauses[unsat[Math.floor(Math.random() * unsat.length)]];
  // flip var yang bikin tambahan klausa unsat tersedikit
  let best = 0, bestGain = -Infinity;
  for (const l of c) {
    const v = Math.abs(l) - 1;
    asg[v] = !asg[v];
    const bad = ch.clauses.filter((cc) => !cc.some((x) => asg[Math.abs(x) - 1] === x > 0)).length;
    asg[v] = !asg[v];
    const gain = -bad;
    if (gain > bestGain) { bestGain = gain; best = v; }
  }
  asg[best] = !asg[best];
}
console.log("walksat solved:", solved);
if (!solved) process.exit(1);

const ownershipSig = await wallet.signMessage(String(ch.promptId));

// uji 1: jawaban sengaja salah → harus 403
const bad = asg.map((v) => !v);
const r1 = await post("/api/submit", { promptId: ch.promptId, assignment: bad, wallet: wallet.address, ownershipSig });
console.log("uji salah →", r1.error || r1.ok);

// uji verifikasi on-chain: authHash recover == signer(=deployer)
const PASSPORT = "0xf0C7eE38251281DC2947ee3272b4AD1643f3682a";
const prov = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org");
const epochNow = Number(await new ethers.Contract(PASSPORT, ["function challengeEpoch() view returns (uint256)"], prov).challengeEpoch());
const authHash = ethers.solidityPackedKeccak256(
  ["address", "uint256", "uint256", "address", "uint256"],
  [wallet.address, epochNow, ethers.getBigInt(ch.promptId), PASSPORT, 56n]
);
const ok = await post("/api/submit", { promptId: ch.promptId, assignment: asg, wallet: wallet.address, ownershipSig });
console.log("submit benar →", ok.ok, "miliki sig", (ok.signature || "").slice(0, 10) + "…");
if (ok.signature) {
  const rec = ethers.verifyMessage(ethers.getBytes(authHash), ok.signature);
  console.log("recover == deployer:", rec.toLowerCase() === "0x652048B66330EC1ba50Fa1Fa924762AdC0afebC5".toLowerCase() ? "(cek di bawah)" : rec, rec === (await new ethers.Wallet(fs.readFileSync("/home/ubuntu/keys/agentpad/deployer.key","utf8").trim()).getAddress()) ? "COCOK ✓" : "BEDA ✗");
}
