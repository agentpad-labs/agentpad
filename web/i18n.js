/* Agent Pad i18n — EN / ID / 中文.
   Strings are keyed, applied with data-i18n="key" (textContent) and
   data-i18n-attr="placeholder:key" for attributes. Missing keys fall back to EN. */
(() => {
  const DICT = {
    en: {
      "brand.tag": "launchpad · bnb chain",
      "nav.launch": "Launch a token",
      "nav.connect": "Connect",
      "hero.h1a": "Only agents",
      "hero.h1b": "can open a launch",
      "hero.p": "Every token on Agent Pad was created by a wallet holding a Binance Agent ID. No anonymous deploys, no creator wallet that vanishes. The curve holds the whole supply, the graduation pool is locked, and the creator's cut is paid on chain.",
      "hero.f1": "launch fee",
      "hero.f2": "trade fee",
      "hero.f3": "creator cut",
      "hero.f4": "graduation",
      "stat.launches": "launches",
      "stat.grad": "graduated",
      "stat.vol": "volume",
      "stat.creators": "creators",
      "steps.t": "How a launch runs",
      "steps.1n": "step 01",
      "steps.1h": "Create",
      "steps.1p": "An Agent ID holder pays 0.002 BNB. The token deploys with a fixed supply and the whole supply goes into its curve, in one transaction.",
      "steps.2n": "step 02",
      "steps.2h": "Agent window",
      "steps.2p": "For 30 minutes only wallets holding an Agent ID can buy. After that the curve opens to everyone.",
      "steps.3n": "step 03",
      "steps.3h": "Trade",
      "steps.3p": "Buys and sells run against virtual reserves. There is no pool to snipe, and selling back always works.",
      "steps.4n": "step 04",
      "steps.4h": "Graduate",
      "steps.4p": "At 8 BNB the curve closes and pairs on PancakeSwap. The LP tokens go to a locker with no withdraw path.",
      "list.t": "Launches",
      "list.empty": "no launches yet — be the first agent",
      "list.demo": "sample book — nothing is deployed yet",
      "list.loading": "loading…",
      "row.raised": "BNB raised",
      "row.price": "price",
      "foot.left": "Agent Pad · agent-gated launchpad · BNB Chain",
      "foot.launch": "launch",
      "foot.source": "source",
      "pick.title": "connect wallet",
      "pick.injected": "Wallet in this browser",
      "pick.none": "none found",
      "pick.tap": "tap here",
      "pick.wc": "WalletConnect",
      "pick.wcnote": "QR scan",
      "pick.copy": "Copy page link",
      "pick.copied": "link copied",
      "pick.noWallet": "open this page inside your wallet browser",
      "tok.crumb": "token",
      "tok.trade": "Trade the curve",
      "tok.price": "price",
      "tok.grad": "graduation",
      "tok.phase": "phase",
      "tok.buy": "Buy",
      "tok.sell": "Sell",
      "tok.creator": "creator",
      "tok.when": "launched",
      "tok.addr": "token",
      "tok.trades": "Trades",
      "tok.noTrades": "no trades yet",
      "tok.chartNote": "price · from curve trades",
      "tok.quote": "enter an amount to quote",
      "launch.title": "launch a token",
      "launch.token": "Token",
      "launch.oneTx": "one transaction",
      "launch.name": "Name",
      "launch.symbol": "Symbol",
      "launch.meta": "Image or metadata URL (optional)",
      "launch.desc": "Description (optional)",
      "launch.before": "Before you launch",
      "launch.gateConnect": "connect a wallet to check its Agent ID",
      "launch.fee": "launch fee",
      "launch.supply": "supply",
      "launch.curveStart": "curve start",
      "launch.grad": "graduation",
      "launch.cut": "your cut",
      "launch.quota": "quota",
      "launch.quotaV": "2 per 30 days",
      "launch.submit": "Create launch",
      "launch.note": "The whole supply goes to the curve in the same transaction. Nobody — including you — holds tokens before trading opens. The graduation LP is locked in a contract with no withdraw path.",
      "launch.ok": "Agent ID found — this wallet can launch.",
      "launch.bad": "No Agent ID on this wallet. Claim one in the Binance app first.",
      "toast.connected": "connected",
      "toast.opening": "opening wallet…",
      "toast.confirm": "confirm in wallet…",
      "toast.switch": "switch to BNB Smart Chain first",
      "theme.toggle": "Toggle theme",
      "lang.label": "EN"
    },

    id: {
      "brand.tag": "launchpad · bnb chain",
      "nav.launch": "Buat token",
      "nav.connect": "Sambung",
      "hero.h1a": "Hanya agent",
      "hero.h1b": "yang bisa buka launch",
      "hero.p": "Setiap token di Agent Pad dibuat oleh wallet yang memegang Binance Agent ID. Tidak ada deploy anonim, tidak ada creator wallet yang hilang. Seluruh supply ada di kurva, LP graduasi dikunci, dan bagian creator dibayar on-chain.",
      "hero.f1": "biaya launch",
      "hero.f2": "biaya trade",
      "hero.f3": "bagian creator",
      "hero.f4": "graduasi",
      "stat.launches": "launch",
      "stat.grad": "lulus",
      "stat.vol": "volume",
      "stat.creators": "creator",
      "steps.t": "Alur satu launch",
      "steps.1n": "langkah 01",
      "steps.1h": "Buat",
      "steps.1p": "Pemegang Agent ID bayar 0,002 BNB. Token dibuat dengan supply tetap dan seluruh supply masuk ke kurvanya, dalam satu transaksi.",
      "steps.2n": "langkah 02",
      "steps.2h": "Jendela agent",
      "steps.2p": "Selama 30 menit hanya wallet ber-Agent ID yang bisa membeli. Setelah itu kurva terbuka untuk semua.",
      "steps.3n": "langkah 03",
      "steps.3h": "Trade",
      "steps.3p": "Beli dan jual berjalan terhadap reserve virtual. Tidak ada pool untuk di-snipe, dan selalu bisa dijual balik.",
      "steps.4n": "langkah 04",
      "steps.4h": "Graduasi",
      "steps.4p": "Di 8 BNB kurva ditutup dan dipasangkan di PancakeSwap. Token LP masuk locker tanpa jalur penarikan.",
      "list.t": "Daftar launch",
      "list.empty": "belum ada launch — jadilah agent pertama",
      "list.demo": "data contoh — belum ada yang di-deploy",
      "list.loading": "memuat…",
      "row.raised": "BNB terkumpul",
      "row.price": "harga",
      "foot.left": "Agent Pad · launchpad khusus agent · BNB Chain",
      "foot.launch": "buat",
      "foot.source": "kode",
      "pick.title": "sambung wallet",
      "pick.injected": "Wallet di browser ini",
      "pick.none": "tidak ditemukan",
      "pick.tap": "tap di sini",
      "pick.wc": "WalletConnect",
      "pick.wcnote": "scan QR",
      "pick.copy": "Salin link halaman",
      "pick.copied": "link disalin",
      "pick.noWallet": "buka halaman ini di browser wallet lu",
      "tok.crumb": "token",
      "tok.trade": "Trade di kurva",
      "tok.price": "harga",
      "tok.grad": "graduasi",
      "tok.phase": "fase",
      "tok.buy": "Beli",
      "tok.sell": "Jual",
      "tok.creator": "creator",
      "tok.when": "dibuat",
      "tok.addr": "token",
      "tok.trades": "Transaksi",
      "tok.noTrades": "belum ada transaksi",
      "tok.chartNote": "harga · dari trade kurva",
      "tok.quote": "isi jumlah untuk lihat estimasi",
      "launch.title": "buat token",
      "launch.token": "Token",
      "launch.oneTx": "satu transaksi",
      "launch.name": "Nama",
      "launch.symbol": "Simbol",
      "launch.meta": "URL gambar atau metadata (opsional)",
      "launch.desc": "Deskripsi (opsional)",
      "launch.before": "Sebelum launch",
      "launch.gateConnect": "sambungkan wallet untuk cek Agent ID",
      "launch.fee": "biaya launch",
      "launch.supply": "supply",
      "launch.curveStart": "awal kurva",
      "launch.grad": "graduasi",
      "launch.cut": "bagian lu",
      "launch.quota": "kuota",
      "launch.quotaV": "2 per 30 hari",
      "launch.submit": "Buat launch",
      "launch.note": "Seluruh supply masuk kurva di transaksi yang sama. Tidak ada yang memegang token sebelum trading dibuka — termasuk lu. LP graduasi dikunci di kontrak tanpa jalur penarikan.",
      "launch.ok": "Agent ID ditemukan — wallet ini bisa launch.",
      "launch.bad": "Wallet ini tidak punya Agent ID. Klaim dulu di app Binance.",
      "toast.connected": "tersambung",
      "toast.opening": "membuka wallet…",
      "toast.confirm": "konfirmasi di wallet…",
      "toast.switch": "pindah ke BNB Smart Chain dulu",
      "theme.toggle": "Ganti tema",
      "lang.label": "ID"
    },

    zh: {
      "brand.tag": "发射台 · BNB 链",
      "nav.launch": "发行代币",
      "nav.connect": "连接",
      "hero.h1a": "只有 agent",
      "hero.h1b": "才能开启发行",
      "hero.p": "Agent Pad 上的每个代币都由持有 Binance Agent ID 的钱包创建。没有匿名部署，也没有跑路的创建者钱包。全部供应量进入联合曲线，毕业后的 LP 永久锁定，创建者分成链上结算。",
      "hero.f1": "发行费",
      "hero.f2": "交易费",
      "hero.f3": "创建者分成",
      "hero.f4": "毕业门槛",
      "stat.launches": "发行数",
      "stat.grad": "已毕业",
      "stat.vol": "交易量",
      "stat.creators": "创建者",
      "steps.t": "一次发行的流程",
      "steps.1n": "步骤 01",
      "steps.1h": "创建",
      "steps.1p": "Agent ID 持有者支付 0.002 BNB。代币以固定供应量部署，全部供应量在一笔交易中进入曲线。",
      "steps.2n": "步骤 02",
      "steps.2h": "Agent 窗口",
      "steps.2p": "前 30 分钟只有持有 Agent ID 的钱包可以买入，之后曲线对所有人开放。",
      "steps.3n": "步骤 03",
      "steps.3h": "交易",
      "steps.3p": "买卖都针对虚拟储备进行，没有可被狙击的池子，任何时候都能卖回曲线。",
      "steps.4n": "步骤 04",
      "steps.4h": "毕业",
      "steps.4p": "达到 8 BNB 后曲线关闭，在 PancakeSwap 建池，LP 代币进入无法提取的锁定合约。",
      "list.t": "发行列表",
      "list.empty": "还没有发行 — 做第一个 agent",
      "list.demo": "示例数据 — 尚未部署",
      "list.loading": "加载中…",
      "row.raised": "募集 BNB",
      "row.price": "价格",
      "foot.left": "Agent Pad · agent 专属发射台 · BNB 链",
      "foot.launch": "发行",
      "foot.source": "源码",
      "pick.title": "连接钱包",
      "pick.injected": "此浏览器中的钱包",
      "pick.none": "未找到",
      "pick.tap": "点这里",
      "pick.wc": "WalletConnect",
      "pick.wcnote": "扫码",
      "pick.copy": "复制页面链接",
      "pick.copied": "链接已复制",
      "pick.noWallet": "请在钱包自带浏览器中打开本页",
      "tok.crumb": "代币",
      "tok.trade": "在曲线上交易",
      "tok.price": "价格",
      "tok.grad": "毕业进度",
      "tok.phase": "阶段",
      "tok.buy": "买入",
      "tok.sell": "卖出",
      "tok.creator": "创建者",
      "tok.when": "发行时间",
      "tok.addr": "代币",
      "tok.trades": "成交",
      "tok.noTrades": "暂无成交",
      "tok.chartNote": "价格 · 来自曲线成交",
      "tok.quote": "输入数量查看报价",
      "launch.title": "发行代币",
      "launch.token": "代币",
      "launch.oneTx": "一笔交易",
      "launch.name": "名称",
      "launch.symbol": "符号",
      "launch.meta": "图片或元数据链接（可选）",
      "launch.desc": "描述（可选）",
      "launch.before": "发行前",
      "launch.gateConnect": "连接钱包以检查 Agent ID",
      "launch.fee": "发行费",
      "launch.supply": "供应量",
      "launch.curveStart": "曲线起点",
      "launch.grad": "毕业门槛",
      "launch.cut": "你的分成",
      "launch.quota": "配额",
      "launch.quotaV": "30 天 2 次",
      "launch.submit": "创建发行",
      "launch.note": "全部供应量在同一笔交易进入曲线，开盘前没有任何人（包括你）持有代币。毕业 LP 锁在无法提取的合约里。",
      "launch.ok": "已找到 Agent ID — 该钱包可以发行。",
      "launch.bad": "该钱包没有 Agent ID，请先在 Binance App 领取。",
      "toast.connected": "已连接",
      "toast.opening": "正在打开钱包…",
      "toast.confirm": "请在钱包中确认…",
      "toast.switch": "请先切换到 BNB Smart Chain",
      "theme.toggle": "切换主题",
      "lang.label": "中文"
    }
  };

  let lang = (() => {
    try { return localStorage.getItem("ap.lang") || (navigator.language || "en").slice(0, 2); } catch (e) { return "en"; }
  })();
  if (!DICT[lang]) lang = "en";

  const t = (k) => (DICT[lang] && DICT[lang][k]) || DICT.en[k] || k;

  function apply(root = document) {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
    document.querySelectorAll("[data-lang]").forEach((b) => b.classList.toggle("on", b.dataset.lang === lang));
    const label = document.querySelector(".langBtn span");
    if (label) label.textContent = t("lang.label");
    window.dispatchEvent(new CustomEvent("ap:lang", { detail: { lang } }));
  }

  function set(next) {
    if (!DICT[next]) return;
    lang = next;
    try { localStorage.setItem("ap.lang", lang); } catch (e) {}
    apply();
  }

  // theme
  function setTheme(next) {
    const mode = next || (document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    document.documentElement.dataset.theme = mode;
    try { localStorage.setItem("ap.theme", mode); } catch (e) {}
    const icon = document.querySelector("#themeBtn i");
    if (icon) icon.textContent = mode === "dark" ? "☾" : "☀";
  }

  function bootTheme() {
    let saved = null;
    try { saved = localStorage.getItem("ap.theme"); } catch (e) {}
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const mode = saved || (prefersDark ? "dark" : "light");
    document.documentElement.dataset.theme = mode;
    const icon = document.querySelector("#themeBtn i");
    if (icon) icon.textContent = mode === "dark" ? "☾" : "☀";
  }

  // reveal on scroll
  function bootReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) { items.forEach((i) => i.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach((i) => io.observe(i));
  }

  // count-up for the stat strip
  function countUp(el, target, suffix = "") {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { el.textContent = target + suffix; return; }
    const dur = 700, t0 = performance.now();
    const start = 0;
    function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      const v = Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3)));
      el.textContent = v + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  window.AP_I18N = { t, apply, set, get lang() { return lang; }, DICT };
  window.AP_UI = { setTheme, bootTheme, bootReveal, countUp };

  document.addEventListener("DOMContentLoaded", () => {
    bootTheme();
    bootReveal();
    apply();
    document.querySelectorAll("[data-lang]").forEach((b) => {
      b.addEventListener("click", () => { set(b.dataset.lang); document.querySelector(".langMenu")?.classList.remove("on"); });
    });
    document.querySelector("#themeBtn")?.addEventListener("click", () => setTheme());
    document.querySelector(".langBtn")?.addEventListener("click", (e) => {
      e.stopPropagation();
      document.querySelector(".langMenu")?.classList.toggle("on");
    });
    document.addEventListener("click", () => document.querySelector(".langMenu")?.classList.remove("on"));
  });
})();
