/* Deployment config. Fill these in after phase 3; until then the site runs in demo mode. */
window.AGENTPAD = {
  chainId: 56,
  chainName: "BNB Smart Chain",
  rpc: "https://bsc-dataseed.bnbchain.org",
  explorer: "https://bscscan.com",
  registry: "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F", // Binance Agent ID (SPACE ID), public
  factory: "0x65626beC9f28bc475741D3a40296F92Bf025c865",
  vault: "0x7320358ba5eebA346ecd19676719e596907B2945",
  locker: "0x84493f1F0bf5cD9B8E771e861Cf3a841c41d517D",
  router: "0x10ED43C718714eb63d5aA57B78B54704E256024E", // PancakeSwap V2 router
  launchFee: "2000000000000000", // 0.002 BNB
  graduationBnb: "8000000000000000000", // 8 BNB
  agentWindow: 1800, // 30 minutes
  wcProjectId: "5e2f89a9606073fc5f4e3713925259c7",
  dataUrl: "data/launches.json",
  usdt: "0x55d398326f99059ff775485246999027b3197955",
  passport: "0xf0C7eE38251281DC2947ee3272b4AD1643f3682a",
  challengeApi: "https://directors-sleeve-volume-gig.trycloudflare.com", // challenge API (cloudflared tunnel), TTL 90 dtk
  market: "0x9230edC3067A2076B6C37d4E9230065Ae95568cd",
  demo: false,
};
