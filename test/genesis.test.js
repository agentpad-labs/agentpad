const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GenesisPassport (1 gratis + 1 bayar 0,5) + PadMarket", function () {
  let passport, market, usdt, signer, agent, buyer, treasury, owner;

  beforeEach(async function () {
    [owner, signer, agent, buyer, treasury] = await ethers.getSigners();
    usdt = await (await ethers.getContractFactory("TestUSDT")).deploy();
    signer = ethers.Wallet.createRandom().connect(ethers.provider);
    await owner.sendTransaction({ to: signer.address, value: ethers.parseEther("1") });
    const GP = await ethers.getContractFactory("GenesisPassport");
    passport = await GP.deploy(signer.address, ethers.ZeroAddress, await usdt.getAddress(), treasury.address);
    const PM = await ethers.getContractFactory("PadMarket");
    market = await PM.deploy(await passport.getAddress(), await usdt.getAddress(), treasury.address);
  });

  async function mintFor(agent, promptId = 1) {
    const epoch = 0, chainId = (await ethers.provider.getNetwork()).chainId;
    const passAddr = await passport.getAddress();
    const authHash = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256", "address", "uint256"],
      [agent.address, epoch, promptId, passAddr, chainId]
    );
    const sig = new ethers.SigningKey(signer.signingKey.privateKey).sign(authHash).serialized;
    await passport.connect(agent).mint(epoch, promptId, sig);
  }

  it("mint gratis #1 via auth; auth 1x-pakai", async function () {
    await mintFor(agent);
    expect(await passport.balanceOf(agent.address)).to.equal(1);
    await expect(passport.connect(agent).mint(0, 1, "0x00")).to.be.reverted;
  });

  it("mint ke-2 bayar 0,5 USDT tanpa auth; ke-3 gak bisa", async function () {
    await usdt.mint(agent.address, ethers.parseEther("5"));
    await usdt.connect(agent).approve(await passport.getAddress(), ethers.MaxUint256);
    const treBefore = await usdt.balanceOf(treasury.address);

    await mintFor(agent);
    await passport.connect(agent).mintPaid();
    expect(await passport.balanceOf(agent.address)).to.equal(2);
    expect(await usdt.balanceOf(treasury.address)).to.equal(treBefore + ethers.parseEther("0.5"));

    await expect(passport.connect(agent).mintPaid()).to.be.reverted;
  });

  it("mintPaid tanpa saldo USDT → revert", async function () {
    await expect(passport.connect(agent).mintPaid()).to.be.reverted;
  });

  it("market: list → buy, fee 2% ke treasury", async function () {
    await usdt.mint(agent.address, ethers.parseEther("5"));
    await usdt.connect(agent).approve(await passport.getAddress(), ethers.MaxUint256);
    await mintFor(agent);
    const tid = 1;
    await passport.connect(agent).approve(await market.getAddress(), tid);
    const price = ethers.parseEther("15");
    const latest = await ethers.provider.getBlock("latest");
    await market.connect(agent).list(tid, price, latest.timestamp + 604800);

    await usdt.mint(buyer.address, ethers.parseEther("100"));
    await usdt.connect(buyer).approve(await market.getAddress(), ethers.MaxUint256);
    const treBefore = await usdt.balanceOf(treasury.address);

    await market.connect(buyer).buy(tid);

    expect(await passport.ownerOf(tid)).to.equal(buyer.address);
    expect(await usdt.balanceOf(treasury.address)).to.equal(treBefore + price * 200n / 10000n);
  });

  it("market: cancel oleh seller", async function () {
    await usdt.mint(agent.address, ethers.parseEther("5"));
    await usdt.connect(agent).approve(await passport.getAddress(), ethers.MaxUint256);
    await mintFor(agent);
    const tid = 1;
    await passport.connect(agent).approve(await market.getAddress(), tid);
    const latest = await ethers.provider.getBlock("latest");
    await market.connect(agent).list(tid, 1000, latest.timestamp + 600);
    await market.connect(agent).cancel(tid);
    const l = await market.listings(tid);
    expect(l.active).to.equal(false);
  });
});
