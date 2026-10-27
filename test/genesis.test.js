const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GenesisPassport + PadMarket (tahap 4)", function () {
  let passport, market, usdt, signer, agent, buyer, treasury, owner;

  beforeEach(async function () {
    [owner, signer, agent, buyer, treasury] = await ethers.getSigners();
    usdt = await (await ethers.getContractFactory("TestUSDT")).deploy();
    // server raw-sign (bukan personal_sign) — pola NONCE
    signer = ethers.Wallet.createRandom().connect(ethers.provider);
    await owner.sendTransaction({ to: signer.address, value: ethers.parseEther("1") });
    const GP = await ethers.getContractFactory("GenesisPassport");
    passport = await GP.deploy(signer.address, ethers.ZeroAddress);
    const PM = await ethers.getContractFactory("PadMarket");
    market = await PM.deploy(await passport.getAddress(), await usdt.getAddress(), treasury.address);
  });

  async function mintFor(agent) {
    const epoch = 0, promptId = 1;
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const passAddr = await passport.getAddress();
    const authHash = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256", "address", "uint256"],
      [agent.address, epoch, promptId, passAddr, chainId]
    );
    const sig = new ethers.SigningKey(signer.signingKey.privateKey).sign(authHash).serialized
    await passport.connect(agent).mint(epoch, promptId, sig);
 return authHash;
  }

  it("mint via auth signer, auth 1x-pakai", async function () {
    await mintFor(agent);
    expect(await passport.balanceOf(agent.address)).to.equal(1);
    await expect(passport.connect(agent).mint(0, 1, "0x00")).to.be.reverted;
  });

  it("kuota 2/wallet: revisi mint kedua via auth baru", async function () {
    await mintFor(agent);
    // auth prompt baru untuk mint ke-2
    const epoch = 0, promptId = 5;
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const passAddr = await passport.getAddress();
    const authHash2 = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256", "address", "uint256"],
      [agent.address, epoch, promptId, passAddr, chainId]
    );
    await passport.connect(agent).mint(epoch, promptId, new ethers.SigningKey(signer.signingKey.privateKey).sign(authHash2).serialized);
    expect(await passport.balanceOf(agent.address)).to.equal(2);
    // mint ke-3 harus gagal (kuota)
    const authHash3 = ethers.solidityPackedKeccak256(
      ["address", "uint256", "uint256", "address", "uint256"],
      [agent.address, epoch, 7, passAddr, chainId]
    );
    await expect(passport.connect(agent).mint(epoch, 7, new ethers.SigningKey(signer.signingKey.privateKey).sign(authHash3).serialized)).to.be.reverted;
  });

  it("market: list → buy, fee 2% ke treasury", async function () {
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
