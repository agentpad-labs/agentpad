/* Agent Pad front end.
   Three pages share this file: list (index.html), token (token.html), launch (launch.html).
   Data comes from data/launches.json, which scripts/index_launches.js rebuilds from chain.
   Until the factory is deployed, config.demo=true renders a sample book so the UI can be reviewed. */
(() => {
  const CFG = window.AGENTPAD;
  const $ = (id) => document.getElementById(id);
  const S = { read: null, signer: null, account: null, launches: [], curve: null, token: null, mkt: null, justConnected: 0 };

  const T = (k) => (window.AP_I18N ? window.AP_I18N.t(k) : k);
  const short = (a) => (a ? a.slice(0, 6) + "…" + a.slice(-4) : "—");
  const fmtBnb = (wei) => {
    if (wei === null || wei === undefined) return "—";
    const n = Number(ethers.formatEther(wei));
    if (!isFinite(n)) return "—";
    if (n === 0) return "0";
    if (n < 0.0001) return n.toExponential(2);
    return n.toFixed(n < 1 ? 4 : 2).replace(/0+$/, "").replace(/\.$/, "");
  };

  const FACTORY_ABI = [
    "function createLaunch(string name_, string symbol_, string metadataURI) payable returns (uint256,address,address)",
    "function launches(uint256) view returns (address token, address curve, address creator, string name, string symbol, string metadataURI, uint64 createdAt)",
    "function launchesLength() view returns (uint256)",
    "function LAUNCH_FEE() view returns (uint256)",
    "function quotaUsed(address) view returns (uint256)",
    "function MAX_LAUNCHES_PER_WINDOW() view returns (uint256)",
    "event LaunchCreated(uint256 indexed id, address indexed token, address indexed curve, address creator, string name, string symbol)",
  ];
  const CURVE_ABI = [
    "function price() view returns (uint256)",
    "function buy() payable",
    "function sell(uint256 tokensIn)",
    "function quoteBuy(uint256 bnbIn) view returns (uint256 tokensOut, uint256 fee)",
    "function quoteSell(uint256 tokensIn) view returns (uint256 bnbOut, uint256 fee)",
    "function agentOnlyPhase() view returns (bool)",
    "function graduated() view returns (bool)",
    "function realBnbReserve() view returns (uint256)",
    "function tokensLeft() view returns (uint256)",
    "function GRADUATION_BNB() view returns (uint256)",
    "function creatorOwed() view returns (uint256)",
    "function sweep()",
  ];
  const TOKEN_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function allowance(address,address) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
  ];
  const REG_ABI = ["function balanceOf(address) view returns (uint256)"];
  const VAULT_ABI = ["function balanceOf(address) view returns (uint256)", "function claim()"];

  // ---------------------------------------------------------------- toast
  function toast(msg, bad = false) {
    const el = $("toast");
    if (!el) return;
    el.textContent = msg;
    el.className = "toast on" + (bad ? " bad" : "");
    clearTimeout(el._t);
    el._t = setTimeout(() => (el.className = "toast"), 5200);
  }
  const errText = (e, fb) => String((e && (e.shortMessage || e.reason || e.message)) || fb).slice(0, 150);

  // ---------------------------------------------------------------- wallet
  const hasInjected = () => Boolean(window.ethereum);

  function openPick() {
    const url = location.href.split("#")[0];
    const opts = [
      {
        nm: T("pick.injected") + (hasInjected() ? "" : " (" + T("pick.none") + ")"),
        nt: hasInjected() ? T("pick.tap") : "—",
        fn: async () => (hasInjected() ? connectInjected() : (await copy(url), toast(T("pick.noWallet"), true))),
      },
      { nm: T("pick.wc"), nt: T("pick.wcnote"), fn: () => connectWC() },
      { nm: T("pick.copy"), nt: "—", fn: async () => (await copy(url), toast(T("pick.copied"))) },
    ];
    $("pickList").innerHTML = opts
      .map((o, i) => `<div class="r" data-i="${i}"><span style="border:0;padding:0">${o.nm}</span><span>${o.nt}</span></div>`)
      .join("");
    $("pickWrap").classList.add("on");
    $("pickList").querySelectorAll(".r").forEach((el) => {
      el.onclick = async () => {
        try {
          await opts[Number(el.dataset.i)].fn();
        } catch (e) {
          const m = String((e && e.message) || "");
          if (/rejected|denied/i.test(m)) return;
          toast(errText(e, "connect failed"), true);
        }
      };
    });
  }
  const closePick = () => $("pickWrap")?.classList.remove("on");

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (err) {}
      document.body.removeChild(ta);
    }
  }

  async function connectInjected() {
    if (!window.ethereum) throw new Error("no wallet in this browser");
    toast(T("toast.opening"));
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    if (!accounts || !accounts.length) throw new Error("no account");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const net = await provider.getNetwork();
    if (Number(net.chainId) !== CFG.chainId) {
      try {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: "0x" + CFG.chainId.toString(16) }] });
      } catch (e) { throw new Error(T("toast.switch")); }
    }
    attach(await provider.getSigner(), accounts[0]);
    window.ethereum.on?.("accountsChanged", (a) => { if (!a || !a.length) softOff(); });
    window.ethereum.on?.("disconnect", () => softOff());
  }

  async function connectWC() {
    toast(T("toast.opening"));
    const mod = await import("https://cdn.jsdelivr.net/npm/@walletconnect/ethereum-provider@2.21.0/+esm");
    const Eth = mod.EthereumProvider || mod.default;
    const wc = await Eth.init({
      projectId: CFG.wcProjectId, chains: [CFG.chainId], optionalChains: [CFG.chainId], showQrModal: true,
      metadata: { name: "Agent Pad", description: "agent-gated launchpad", url: location.origin, icons: [] },
    });
    await wc.connect();
    const provider = new ethers.BrowserProvider(wc);
    const signer = await provider.getSigner();
    attach(signer, await signer.getAddress());
    wc.on?.("disconnect", () => softOff());
  }

  function attach(signer, address) {
    S.signer = signer;
    S.account = ethers.getAddress(address);
    S.justConnected = Date.now();
    const b = $("walletBtn");
    if (b) { b.textContent = short(S.account); b.classList.add("solid"); }
    closePick();
    toast(T("toast.connected") + " " + short(S.account));
    onAccount();
  }

  function softOff() {
    const b = $("walletBtn");
    if (b) { b.textContent = "Connect"; b.classList.remove("solid"); }
    toast("wallet disconnected — connect again", true);
  }

  // ---------------------------------------------------------------- data
  async function loadData() {
    try {
      const r = await fetch(CFG.dataUrl + "?t=" + Date.now(), { cache: "no-store" });
      const d = await r.json();
      S.launches = d.launches || [];
      return d;
    } catch (e) {
      S.launches = [];
      return { launches: [], updatedAt: null, demo: !!CFG.demo };
    }
  }

  function row(l) {
    const pct = Math.min(100, Math.round((Number(l.realBnb || 0) / Number(CFG.graduationBnb)) * 100));
    return `<a class="row" href="token.html?id=${l.id}">
      <div class="no">${String(l.id).padStart(3, "0")}</div>
      <div class="nm">${esc(l.name)}<small>${esc(l.symbol)} · ${short(l.token)}</small></div>
      <div class="num">${fmtBnb(l.raisedWei)}<br/><small>${T("row.raised")}</small></div>
      <div class="num">${fmtBnb(l.priceWei)}<br/><small>${T("row.price")}</small></div>
      <div class="barWrap"><i style="--w:${pct}%"></i></div>
      <div class="arrow">→</div>
    </a>`;
  }

  const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  async function renderIndex() {
    const d = await loadData();
    const rows = $("rows");
    if (!rows) return;
    if (!S.launches.length) {
      rows.innerHTML = `<div class="empty">${CFG.demo ? T("list.demo") : T("list.empty")}</div>`;
    } else {
      rows.innerHTML = S.launches.map(row).join("");
    }
    const grad = S.launches.filter((l) => l.graduated).length;
    const vol = S.launches.reduce((a, l) => a + Number(l.raisedWei || 0), 0);
    const creators = new Set(S.launches.map((l) => (l.creator || "").toLowerCase())).size;
    const cu = window.AP_UI && window.AP_UI.countUp;
    if (cu) {
      cu($("sLaunches"), S.launches.length);
      cu($("sGrad"), grad);
      cu($("sCreators"), creators);
    } else {
      $("sLaunches").textContent = S.launches.length;
      $("sGrad").textContent = grad;
      $("sCreators").textContent = creators;
    }
    $("sVol").textContent = fmtBnb(String(vol)) + " BNB";
    $("feedNote").textContent = d.updatedAt ? "updated " + new Date(d.updatedAt).toISOString().slice(11, 16) + "Z" : CFG.demo ? "demo" : "—";
  }

  // ---------------------------------------------------------------- token page
  async function readCurve(curveAddr) {
    if (!curveAddr || CFG.demo || !CFG.factory) return null;
    const c = new ethers.Contract(curveAddr, CURVE_ABI, S.read);
    const [price, grad, realBnb, left, phase] = await Promise.all([
      c.price().catch(() => 0n), c.graduated().catch(() => false), c.realBnbReserve().catch(() => 0n),
      c.tokensLeft().catch(() => 0n), c.agentOnlyPhase().catch(() => false),
    ]);
    return { c, price, grad, realBnb, left, phase };
  }

  function drawChart(trades) {
    const svg = $("chart");
    if (!svg) return;
    const pts = trades.slice(-60).map((td, i) => [i, Number(td.price || 0)]);
    if (pts.length < 2) {
      svg.innerHTML = `<text x="400" y="115" text-anchor="middle" fill="#c9c2b2" font-size="12" font-family="monospace">no trades yet</text>`;
      $("chartNote").textContent = "—";
      return;
    }
    const max = Math.max(...pts.map((p) => p[1]));
    const min = Math.min(...pts.map((p) => p[1]));
    const stepX = 800 / (pts.length - 1);
    const y = (v) => 200 - ((v - min) / (max - min || 1)) * 180;
    const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${(i * stepX).toFixed(1)},${y(p[1]).toFixed(1)}`).join(" ");
    svg.innerHTML = `<path d="${path}" fill="none" class="line" stroke="#e8342a" stroke-width="2.5"/>
      <path d="${path} L800,220 L0,220 Z" fill="#ff3b30" opacity="0.06"/>`;
    $("chartNote").textContent = trades.length + " · " + T("tok.trades");
  }

  async function renderToken() {
    const id = new URLSearchParams(location.search).get("id");
    const d = await loadData();
    const l = S.launches.find((x) => String(x.id) === String(id)) || S.launches[0];
    if (!l) { $("tName").textContent = "not found"; return; }
    S.curveAddr = l.curve;
    S.tokenAddr = l.token;
    $("crumb").textContent = "token #" + String(l.id).padStart(3, "0");
    $("tName").textContent = l.name;
    $("tSym").textContent = (l.symbol || "") + " · " + (l.metadataURI || "on-chain curve");
    $("tDesc").textContent = l.description || "Launched on Agent Pad. The whole supply sits in the bonding curve until graduation.";
    $("tCreator").textContent = short(l.creator);
    $("tWhen").textContent = l.createdAt ? new Date(Number(l.createdAt) * 1000).toISOString().slice(0, 16).replace("T", " ") : "—";
    $("tAddr").textContent = short(l.token);
    drawChart(l.trades || []);
    $("tradeCount").textContent = (l.trades || []).length + " recorded";
    if ((l.trades || []).length) {
      $("trades").innerHTML = (l.trades || []).slice(-12).reverse().map((td) => `<div class="row" style="grid-template-columns:80px 1fr 120px">
        <div class="no">${td.side === "buy" ? "BUY" : "SELL"}</div>
        <div class="nm">${short(td.who)}<small>${td.tx ? td.tx.slice(0, 12) + "…" : ""}</small></div>
        <div class="num">${fmtBnb(td.bnbWei)} BNB</div></div>`).join("");
    }
    const cur = await readCurve(l.curve);
    if (cur) {
      $("pPrice").textContent = fmtBnb(cur.price.toString()) + " BNB";
      const pct = Math.min(100, Math.round((Number(cur.realBnb) / Number(CFG.graduationBnb)) * 100));
      $("pGrad").textContent = pct + "%";
      $("pPhase").textContent = cur.grad ? "graduated" : cur.phase ? "agent-only" : "open";
      S.curve = cur.c;
    } else {
      $("pPrice").textContent = fmtBnb(l.priceWei) + " BNB";
      $("pGrad").textContent = Math.min(100, Math.round((Number(l.raisedWei || 0) / Number(CFG.graduationBnb)) * 100)) + "%";
      $("pPhase").textContent = l.graduated ? "graduated" : "curve";
    }
    $("amtIn").addEventListener("input", updateQuote);
    updateQuote();
  }

  async function updateQuote() {
    const v = $("amtIn").value.trim();
    if (!S.curve || !v || !Number(v)) { $("quoteNote").textContent = "—"; return; }
    try {
      const [tokensOut, fee] = await S.curve.quoteBuy(ethers.parseEther(v));
      $("quoteNote").textContent = `≈ ${Number(ethers.formatEther(tokensOut)).toLocaleString(undefined, { maximumFractionDigits: 0 })} tokens · fee ${fmtBnb(fee.toString())} BNB`;
    } catch (e) { $("quoteNote").textContent = "quote unavailable"; }
  }

  async function buy() {
    if (!S.account) return openPick();
    if (Date.now() - S.justConnected < 2500) return;
    const v = $("amtIn").value.trim();
    if (!v || !Number(v)) return toast("enter an amount", true);
    try {
      toast("confirm in wallet…");
      const c = new ethers.Contract(S.curveAddr, CURVE_ABI, S.signer);
      const tx = await c.buy({ value: ethers.parseEther(v) });
      await tx.wait();
      toast("bought · " + short(tx.hash));
      setTimeout(() => location.reload(), 1200);
    } catch (e) { toast(errText(e, "buy failed"), true); }
  }

  async function sell() {
    if (!S.account) return openPick();
    const v = $("amtIn").value.trim();
    if (!v || !Number(v)) return toast("enter a token amount", true);
    try {
      const t = new ethers.Contract(S.tokenAddr, TOKEN_ABI, S.signer);
      const amount = ethers.parseUnits(v, 18);
      if ((await t.allowance(S.account, S.curveAddr)) < amount) {
        toast("approving…");
        await (await t.approve(S.curveAddr, amount)).wait();
      }
      const c = new ethers.Contract(S.curveAddr, CURVE_ABI, S.signer);
      toast("confirm in wallet…");
      await (await c.sell(amount)).wait();
      toast("sold");
      setTimeout(() => location.reload(), 1200);
    } catch (e) { toast(errText(e, "sell failed"), true); }
  }

  // ---------------------------------------------------------------- launch page
  async function onAccount() {
    const gate = $("gate");
    if (!gate || !S.account) return;
    try {
      const reg = new ethers.Contract(CFG.registry, REG_ABI, S.read);
      const bal = await reg.balanceOf(S.account);
      const ok = bal > 0n;
      gate.className = "gate " + (ok ? "ok" : "bad");
      gate.textContent = ok ? T("launch.ok") : T("launch.bad");
      $("createBtn").disabled = !ok || !CFG.factory;
      if (!CFG.factory) gate.textContent += " (factory not deployed yet)";
    } catch (e) {
      gate.className = "gate bad";
      gate.textContent = "registry read failed: " + errText(e, "unknown");
    }
  }

  async function createLaunch() {
    if (!CFG.factory) return toast("factory not deployed yet", true);
    if (!S.account) return openPick();
    const name = $("fName").value.trim();
    const symbol = $("fSymbol").value.trim();
    const meta = $("fMeta").value.trim();
    if (!name || !symbol) return toast("name and symbol are required", true);
    try {
      const f = new ethers.Contract(CFG.factory, FACTORY_ABI, S.signer);
      toast("confirm in wallet…");
      const tx = await f.createLaunch(name, symbol, meta, { value: CFG.launchFee });
      const rc = await tx.wait();
      const ev = rc.logs.map((lg) => { try { return f.interface.parseLog(lg); } catch { return null; } }).find((x) => x && x.name === "LaunchCreated");
      toast("launched #" + (ev ? ev.args.id : "?"));
      if (ev) location.href = "token.html?id=" + ev.args.id;
    } catch (e) { toast(errText(e, "launch failed"), true); }
  }

  // ---------------------------------------------------------------- boot
  function boot() {
    S.read = new ethers.JsonRpcProvider(CFG.rpc, CFG.chainId, { staticNetwork: true });
    $("walletBtn")?.addEventListener("click", openPick);
    $("pickClose")?.addEventListener("click", closePick);
    $("pickWrap")?.addEventListener("click", (e) => { if (e.target.id === "pickWrap") closePick(); });
    $("buyBtn")?.addEventListener("click", buy);
    $("sellBtn")?.addEventListener("click", sell);
    $("createBtn")?.addEventListener("click", createLaunch);

    if ($("rows")) renderIndex();
    if ($("chart")) renderToken();
  }

  window.addEventListener("ap:lang", () => {
    if ($("rows")) renderIndex();
    if ($("chart")) renderToken();
  });
  window.addEventListener("load", boot);
})();
