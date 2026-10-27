# Agent Pad — Tahap 4: Genesis Passport & PadMarket

Model dipelajari dari NONCE Genesis (27 Okt 2026):
supply 7.777 · 2/wallet lifetime · mint gratis tapi HARUS LEWAT tantangan MCP ·
marketplace on-chain bawaan sejak hari 1. Hasil: 89% laku <48 jam, floor naik 3,7×,
vol 24h 34,9 BNB.

## 1. Genesis Passport (`GenesisPassport.sol`)

- ERC-721, supply max **7.777**, mint **gratis** (gas only).
- **Kuota lifetime 2 per wallet** (bukan per epoch) — NONCE-terbukti.
- Pintu: hanya wallet dengan **Agent ID terikat** yang bisa mint
  (cek registry `0x60B9…022F` — sama seperti NONCE/AgentGate).
- **Tantangan mini dari pad (server)**, bukan 5-SAT:
  1. Agent merapal `prepare_challenge(wallet)` ke MCP pad → dapat `promptId`
  2. Agent jawab (mis. kuis on-chain: baca `totalSupply()` kontrak tertentu,
     hitung, balas jawaban) — target < 60 detik
  3. Server validasi → terbit **MintAuthorization** (tanda tangan signer pad,
     EIP-712 `PASSPURPOSE`, wallet, epoch 1x-pakai)
  4. Agent mint: `mint(auth)` — kontrak verifikasi tanda tangan + kuota.
- Anti-abuse: 1 signature = 1 mint, replay gak bisa (nonce di dalam hash).

## 2. PadMarket (`PadMarket.sol`) — marketplace on-chain hari-1

- `list(id, price(USDT 18des), expiryTimestamp)` — hanya owner token,
  wajib approve, `price >= 100 wei`, `expiry > now` (revert `listing`)
- `buy(id)` — bayar USDT: 2% fee ke treasury pad, 98% ke penjual,
  transfer token, hapus listing (pola NONCE `buy`)
- `cancel(id)` — seller/owner
- `listings(id)` view publik untuk indexer

## 3. Isolasi project #4 (aturan tetap)

- Repo, wallet deployer/treasury, art, Pages, identity — semua baris baru
- Jangan campur: proyek lain mana pun (wallet/kode/identitas tetap terpisah total)
- Tidak deploy sebelum ACC biaya gas (±0,002–0,005 BNB)

## 4. Alur baru (ringkas)

```
agent tubes MCP: prepare_challenge → jawab → get MintAuthorization
→ GenesisPassport.mint(auth) [gratis]
→ (opsional) PadMarket.list / somebody buy
→ pegang paspor = buka hak Launch token di Pad + bagian fee 0,70%
```

File kontrak: `contracts/GenesisPassport.sol`, `contracts/PadMarket.sol`
Test: `test/genesis.test.js` (Hardhat)
