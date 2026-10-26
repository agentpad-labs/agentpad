# Agent Pad

A token launchpad on BNB Chain where **only wallets holding a Binance Agent ID can create a token**.

Everything about a launch is on chain: the token, the bonding curve, the fee split, the graduation.
No admin keys can move user funds, and the graduation LP is locked in a contract with no withdraw path.

## Why

Most launchpads let anyone deploy anything in one click. The result is a wall of anonymous tokens and
creator wallets that vanish after the curve. Agent Pad takes the opposite position: to open a launch you
must hold a Binance Agent ID, and each identity is limited to two launches per 30 days. Identity is the
cost of entry, not a fee.

## How a launch works

1. **Create** — a `.ai` holder pays a 0.002 BNB launch fee and names the token. In the same transaction
   the token is deployed with a fixed 1,000,000,000 supply and the whole supply is parked in its curve.
2. **Agent window** — for the first 30 minutes only wallets holding a Binance Agent ID may buy.
3. **Trade the curve** — after that, anyone can buy and sell against a virtual-reserve constant product
   curve (`k = virtualToken * virtualBnb`). No pool exists to snipe, and selling back always works.
4. **Graduate** — once 8 BNB of real BNB has been collected the curve closes, the collected BNB and
   remaining tokens are paired on PancakeSwap, and the LP tokens go to `LPLocker`, which cannot move them.

## Fees

Every buy and sell pays 1% of the trade:

| share | recipient |
|---|---|
| 0.70% | creator, claimable from `AgentFeeVault` by the wallet that launched |
| 0.25% | protocol treasury |
| 0.05% | prize pool |

Fees accrue in BNB inside the curve and are pushed out by `sweep()`, which anyone may call. No admin
can redirect them.

Launch fee: **0.002 BNB**, paid to the treasury.

## Contracts

| contract | role |
|---|---|
| `AgentPadToken` | fixed-supply ERC20. No mint, no owner, no pause. |
| `AgentPadCurve` | one curve per launch: pricing, fees, agent window, graduation |
| `AgentPadFactory` | deploys token + curve, enforces the Agent ID gate and the launch quota |
| `AgentFeeVault` | per-wallet creator fee balance, self-claim only |
| `LPLocker` | holds graduation LP forever; the ABI has no withdraw and no transfer |

## Security posture

- no upgradeable proxies
- no owner on the token, the curve, the vault or the locker
- no function anywhere that can withdraw user funds
- launch fee and fee split are constants in the source
- 20 tests cover the gate, quota, curve math, fee split, agent window, sells, sweep, claims and graduation

```bash
npm install
npx hardhat test
```

## Status

Contracts are written and tested on a local chain. Nothing is deployed yet.

- [x] phase 1 — contracts + tests
- [ ] phase 2 — web app + indexer
- [ ] phase 3 — testnet, audit pass, mainnet

## Licence

MIT
