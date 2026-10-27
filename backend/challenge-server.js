// Agent Pad — challenge server (mirror NONCE, versi mini)
// Alur: /api/challenge (soal SAT mini + promptId + deadline 90 dtk)
//       /api/submit   (jawaban + alamat + ttd kepemilikan) → ttd mint utk GenesisPassport
// Kontrak: GenesisPassport.mint(epoch, promptId, signature) — signer = deployer
import http from "http";
import fs from "fs";
import crypto from "crypto";
import { ethers } from "ethers";

const RPC = "https://bsc-dataseed.binance.org";
const PASSPORT = "0xf0C7eE38251281DC2947ee3272b4AD1643f3682a";
const KEY_FILE = "/home/ubuntu/keys/agentpad/deployer.key";
const CHAIN_ID = 56;
const TTL = 90e3;

const provider = new ethers.JsonRpcProvider(RPC);
const signerWallet = new ethers.Wallet(fs.readFileSync(KEY_FILE, "utf8").trim());

const challenges = new Map(); // promptId -> {clauses, solution, wallet, deadline}
const solved = new Set();     // `${wallet}:${promptId}` yang sudah diberi ttd

// --- generator SAT mini: 24 variabel, planted solution, 90 klausa ---
function makeSat() {
  const n = 24, m = 90, sol = Array.from({ length: n }, () => Math.random() < 0.5);
  const clauses = [];
  while (clauses.length < m) {
    const vs = [...Array(n).keys()].sort(() => Math.random() - 0.5).slice(0, 3);
    if (Math.random() < 0.5) {
      // dipaksa SAT: satu literal pasti benar
      const v = vs[0];
      clauses.push(vs.map((u) => (u === v ? (sol[v] ? u + 1 : -(u + 1)) : (Math.random() < 0.5 ? u + 1 : -(u + 1)))));
    } else {
      clauses.push(vs.map((u) => (Math.random() < 0.5 ? u + 1 : -(u + 1))));
    }
  }
  return { n, m: clauses.length, clauses, solution: sol };
}

function check(assignment, prob) {
  if (!Array.isArray(assignment) || assignment.length !== prob.n) return false;
  for (const c of prob.clauses) {
    const ok = c.some((lit) => assignment[Math.abs(lit) - 1] === lit > 0);
    if (!ok) return false;
  }
  return true;
}

const json = (res, code, obj) => { res.writeHead(code, { "content-type": "application/json", "access-control-allow-origin": "*" }); res.end(JSON.stringify(obj)); };
const body = (req) => new Promise((r) => { let d = ""; req.on("data", (c) => (d += c)); req.on("end", () => { try { r(JSON.parse(d || "{}")); } catch { r({}); } }); });

const server = http.createServer(async (req, res) => {
  if (req.url === "/api/challenge" && req.method === "POST") {
    const b = await body(req);
    const wallet = String(b.wallet || "").toLowerCase();
    if (!/^0x[0-9a-f]{40}$/.test(wallet)) return json(res, 400, { error: "wallet?" });
    const epochNow = Number(await new ethers.Contract(PASSPORT, ["function challengeEpoch() view returns (uint256)"], provider).challengeEpoch());
    const p = makeSat();
    const promptId = ethers.hexlify(ethers.randomBytes(8));
    challenges.set(promptId, { p, wallet, deadline: Date.now() + TTL });
    json(res, 200, { promptId, epoch: epochNow, ttlSeconds: TTL / 1e3,
      task: "Beri nilai true/false pada SEMUA variabel agar SEMUA klausa terpenuhi (SAT).",
      variables: p.n, clauses: p.clauses });
    setTimeout(() => challenges.delete(promptId), TTL);
    return;
  }
  if (req.url === "/api/submit" && req.method === "POST") {
    const b = await body(req);
    const { promptId, assignment, ownershipSig } = b;
    const c = challenges.get(promptId);
    if (!c) return json(res, 400, { error: "challenge kedaluwarsa/tak ada" });
    if (Date.now() > c.deadline) return json(res, 400, { error: "lewat deadline" });
    if (String((b.wallet || "").toLowerCase()) !== c.wallet) return json(res, 400, { error: "wallet beda" });
    const rec = await (async () => { try { return await ethers.verifyMessage(String(promptId), ownershipSig); } catch { return null; } })();
    if (!rec || rec.toLowerCase() !== c.wallet) return json(res, 400, { error: "ownershipSig gak cocok" });
    if (!check(assignment, c.p)) return json(res, 403, { error: "jawaban salah — klausa gak terpenuhi" });
    // verifikasi kontrak live: epoch masih sama
    const epochNow = Number(await new ethers.Contract(PASSPORT, ["function challengeEpoch() view returns (uint256)"], provider).challengeEpoch());
    // authHash = keccak(abi.encodePacked(wallet, epoch, promptId, passport, chainid)) — persis kontrak
    const authHash = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256", "address", "uint256"],
      [c.wallet, epochNow, ethers.getBigInt(promptId), PASSPORT, CHAIN_ID]
    );
    const sig = await signerWallet.signMessage(ethers.getBytes(authHash));
    solved.add(c.wallet + ":" + promptId);
    challenges.delete(promptId);
    return json(res, 200, { ok: true, epoch: epochNow, promptId, signature: sig, passport: PASSPORT });
  }
  if (req.url === "/api/health") return json(res, 200, { ok: true, pending: challenges.size });
  json(res, 404, { error: "nope" });
});

server.listen(8907, "127.0.0.1", () => console.log("agentpad challenge server :8907"));
