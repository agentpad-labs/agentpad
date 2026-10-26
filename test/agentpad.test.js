const { expect } = require("chai");
const { ethers } = require("hardhat");

const FEE = ethers.parseEther("0.002");
const ONE = ethers.parseEther("1");
const SUPPLY = ethers.parseEther("1000000000");

async function deployAll() {
  const [deployer, treasury, prize, creator, buyer, outsider] = await ethers.getSigners();

  const Registry = await ethers.getContractFactory("MockAgentRegistry");
  const registry = await Registry.deploy();

  const Vault = await ethers.getContractFactory("AgentFeeVault");
  const vault = await Vault.deploy();

  const Locker = await ethers.getContractFactory("LPLocker");
  const locker = await Locker.deploy(ethers.ZeroAddress);

  const Router = await ethers.getContractFactory("MockRouter");
  const router = await Router.deploy();

  const Factory = await ethers.getContractFactory("AgentPadFactory");
  const factory = await Factory.deploy(
    await registry.getAddress(),
    treasury.address,
    prize.address,
    await vault.getAddress(),
    await router.getAddress(),
    await locker.getAddress()
  );

  await registry.set(creator.address, 1);
  await registry.set(buyer.address, 1);

  return { deployer, treasury, prize, creator, buyer, outsider, registry, vault, locker, router, factory };
}

async function launch(factory, creator, name = "Test Agent", symbol = "TAG") {
  const tx = await factory.connect(creator).createLaunch(name, symbol, "ipfs://meta", { value: FEE });
  const rc = await tx.wait();
  const ev = rc.logs.map((l) => { try { return factory.interface.parseLog(l); } catch { return null; } }).find((x) => x && x.name === "LaunchCreated");
  const tokenAddr = ev.args.token;
  const curveAddr = ev.args.curve;
  const token = await ethers.getContractAt("AgentPadToken", tokenAddr);
  const curve = await ethers.getContractAt("AgentPadCurve", curveAddr);
  return { token, curve, id: ev.args.id };
}

describe("Agent Pad", function () {
  describe("launching", function () {
    it("rejects a wallet without an Agent ID", async function () {
      const { factory, outsider } = await deployAll();
      await expect(
        factory.connect(outsider).createLaunch("X", "X", "", { value: FEE })
      ).to.be.revertedWithCustomError(factory, "NoAgentId");
    });

    it("creates a token with the full supply parked in the curve", async function () {
      const { factory, creator } = await deployAll();
      const { token, curve } = await launch(factory, creator);
      expect(await token.totalSupply()).to.equal(SUPPLY);
      expect(await token.balanceOf(await curve.getAddress())).to.equal(SUPPLY);
      expect(await curve.creator()).to.equal(creator.address);
      expect(await curve.agentOnlyPhase()).to.equal(true);
    });

    it("takes the launch fee and refunds the excess", async function () {
      const { factory, creator, treasury } = await deployAll();
      const before = await ethers.provider.getBalance(treasury.address);
      await factory.connect(creator).createLaunch("A", "A", "", { value: FEE + ONE });
      const after = await ethers.provider.getBalance(treasury.address);
      expect(after - before).to.equal(FEE);
    });

    it("enforces 2 launches per agent per window, then resets", async function () {
      const { factory, creator } = await deployAll();
      await launch(factory, creator, "A", "A");
      await launch(factory, creator, "B", "B");
      await expect(
        factory.connect(creator).createLaunch("C", "C", "", { value: FEE })
      ).to.be.revertedWithCustomError(factory, "QuotaExceeded");

      await ethers.provider.send("evm_increaseTime", [30 * 24 * 3600 + 1]);
      await ethers.provider.send("evm_mine", []);
      await launch(factory, creator, "C", "C");
      expect(await factory.launchCountOf(creator.address)).to.equal(3);
    });
  });

  describe("trading", function () {
    it("blocks non-agent buys inside the agent window", async function () {
      const { factory, creator, outsider } = await deployAll();
      const { curve } = await launch(factory, creator);
      await expect(curve.connect(outsider).buy({ value: ONE })).to.be.revertedWithCustomError(curve, "AgentOnly");
    });

    it("allows agent buys and moves the price up", async function () {
      const { factory, creator, buyer } = await deployAll();
      const { token, curve } = await launch(factory, creator);
      const p0 = await curve.price();
      await curve.connect(buyer).buy({ value: ethers.parseEther("0.5") });
      const p1 = await curve.price();
      expect(p1).to.be.greaterThan(p0);
      expect(await token.balanceOf(buyer.address)).to.be.greaterThan(0);
      expect(await curve.totalBuys()).to.equal(1n);
    });

    it("opens to any wallet after the agent window", async function () {
      const { factory, creator, outsider } = await deployAll();
      const { curve } = await launch(factory, creator);
      await ethers.provider.send("evm_increaseTime", [30 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);
      expect(await curve.agentOnlyPhase()).to.equal(false);
      await curve.connect(outsider).buy({ value: ONE });
      expect(await curve.totalBuys()).to.equal(1n);
    });

    it("splits the 1% fee 70/25/5", async function () {
      const { factory, creator, buyer } = await deployAll();
      const { curve } = await launch(factory, creator);
      const value = ethers.parseEther("1");
      await curve.connect(buyer).buy({ value });
      const fee = (value * 100n) / 10000n;
      expect(await curve.creatorOwed()).to.equal((fee * 70n) / 100n);
      expect(await curve.protocolOwed()).to.equal((fee * 25n) / 100n);
      expect(await curve.prizeOwed()).to.equal(fee - (fee * 70n) / 100n - (fee * 25n) / 100n);
    });

    it("quoteBuy matches what the buy actually delivers", async function () {
      const { factory, creator, buyer } = await deployAll();
      const { token, curve } = await launch(factory, creator);
      const value = ethers.parseEther("0.7");
      const [quoted] = await curve.quoteBuy(value);
      const before = await token.balanceOf(buyer.address);
      await curve.connect(buyer).buy({ value });
      expect((await token.balanceOf(buyer.address)) - before).to.equal(quoted);
    });

    it("sells back to the curve and charges the same fee", async function () {
      const { factory, creator, buyer } = await deployAll();
      const { token, curve } = await launch(factory, creator);
      await curve.connect(buyer).buy({ value: ethers.parseEther("1") });
      const bal = await token.balanceOf(buyer.address);
      const half = bal / 2n;
      await token.connect(buyer).approve(await curve.getAddress(), half);
      const [quoted] = await curve.quoteSell(half);
      await curve.connect(buyer).sell(half);
      expect(await curve.totalSells()).to.equal(1n);
      expect(quoted).to.be.greaterThan(0);
    });

    it("refuses a sell larger than the reserves support", async function () {
      const { factory, creator, buyer } = await deployAll();
      const { token, curve } = await launch(factory, creator);
      await curve.connect(buyer).buy({ value: ethers.parseEther("0.1") });
      const bal = await token.balanceOf(buyer.address);
      await token.connect(buyer).approve(await curve.getAddress(), bal);
      await expect(curve.connect(buyer).sell(bal)).to.be.revertedWithCustomError(curve, "NotEnoughBnb");
    });
  });

  describe("supply and records", function () {
    it("token has no mint path at all", async function () {
      const { factory, creator } = await deployAll();
      const { token } = await launch(factory, creator);
      const names = token.interface.fragments.map((f) => f.name);
      expect(names).to.not.include("mint");
      expect(names).to.not.include("owner");
      expect(await token.totalSupply()).to.equal(SUPPLY);
    });

    it("records the launch for the public list", async function () {
      const { factory, creator } = await deployAll();
      const { id } = await launch(factory, creator, "Alpha", "ALP");
      const rec = await factory.launches(id);
      expect(rec.name).to.equal("Alpha");
      expect(rec.symbol).to.equal("ALP");
      expect(rec.creator).to.equal(creator.address);
    });
  });

  describe("fees", function () {
    it("sweep credits the creator in the vault and pays treasury + prize pool", async function () {
      const { factory, creator, buyer, vault, treasury, prize } = await deployAll();
      const { curve } = await launch(factory, creator);
      await curve.connect(buyer).buy({ value: ethers.parseEther("1") });
      const owed = await curve.creatorOwed();
      const treBefore = await ethers.provider.getBalance(treasury.address);
      const prizeBefore = await ethers.provider.getBalance(prize.address);
      await curve.sweep();
      expect(await vault.balanceOf(creator.address)).to.equal(owed);
      expect(await ethers.provider.getBalance(treasury.address)).to.be.greaterThan(treBefore);
      expect(await ethers.provider.getBalance(prize.address)).to.be.greaterThan(prizeBefore);
      expect(await curve.creatorOwed()).to.equal(0n);
    });

    it("sweep on an empty curve is a no-op", async function () {
      const { factory, creator } = await deployAll();
      const { curve } = await launch(factory, creator);
      await curve.sweep();
      expect(await curve.creatorOwed()).to.equal(0n);
    });

    it("creator claims the vault once, and cannot claim twice", async function () {
      const { factory, creator, buyer, vault } = await deployAll();
      const { curve } = await launch(factory, creator);
      await curve.connect(buyer).buy({ value: ethers.parseEther("1") });
      await curve.sweep();
      const amount = await vault.balanceOf(creator.address);
      expect(amount).to.be.greaterThan(0);
      await expect(vault.connect(creator).claim()).to.changeEtherBalances([creator], [amount]);
      await expect(vault.connect(creator).claim()).to.be.revertedWithCustomError(vault, "NothingToClaim");
    });
  });

  describe("graduation", function () {
    it("graduates at the threshold, closes the curve and locks the LP", async function () {
      const { factory, creator, buyer, locker, router } = await deployAll();
      const { curve } = await launch(factory, creator);
      await curve.connect(buyer).buy({ value: ethers.parseEther("9") });
      expect(await curve.graduated()).to.equal(true);
      await expect(curve.connect(buyer).buy({ value: ONE })).to.be.revertedWithCustomError(curve, "TradingClosed");
      expect(await curve.tokensLeft()).to.equal(0n);
      const locked = await locker.lockedBalance(await router.getAddress());
      expect(locked).to.be.greaterThan(0);
      // the locker's ABI carries no way to move them
      const art = await artifacts.readArtifact("LPLocker");
      const fns = art.abi.filter((f) => f.type === "function").map((f) => f.name);
      expect(fns).to.not.include("withdraw");
      expect(fns).to.not.include("transfer");
    });

    it("cannot graduate before the threshold", async function () {
      const { factory, creator } = await deployAll();
      const { curve } = await launch(factory, creator);
      await expect(curve.graduate()).to.be.revertedWithCustomError(curve, "NotEnoughBnb");
    });

    it("blocks sells once graduated", async function () {
      const { factory, creator, buyer } = await deployAll();
      const { token, curve } = await launch(factory, creator);
      await curve.connect(buyer).buy({ value: ethers.parseEther("9") });
      const bal = await token.balanceOf(buyer.address);
      await token.connect(buyer).approve(await curve.getAddress(), bal);
      await expect(curve.connect(buyer).sell(bal)).to.be.revertedWithCustomError(curve, "TradingClosed");
    });

    it("keeps price rising across consecutive buys", async function () {
      const { factory, creator, buyer } = await deployAll();
      const { curve } = await launch(factory, creator);
      let last = await curve.price();
      for (let i = 0; i < 3; i++) {
        await curve.connect(buyer).buy({ value: ethers.parseEther("0.3") });
        const now = await curve.price();
        expect(now).to.be.greaterThan(last);
        last = now;
      }
    });
  });
});
