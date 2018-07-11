import expectThrow from "./helpers/expectThrow";
import log from "./helpers/logger";
import EVMRevert from "./helpers/VMExceptionRevert";

const PausableAndMintableToken = artifacts.require("PausableAndMintableToken");
const BigNumber = web3.BigNumber;
const should = require("chai")
  .use(require("chai-as-promised"))
  .use(require("chai-bignumber")(BigNumber))
  .should();

contract("PausableAndMintableToken", function(accounts) {
  let token;

  beforeEach(async function() {
    token = await PausableAndMintableToken.new();
  });

  it("should start with a totalSupply of 0", async function() {
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, 0);
  });

  it("should return mintingFinished false after construction", async function() {
    let mintingFinished = await token.mintingFinished();

    assert.equal(mintingFinished, false);
  });

  it("should mint a given amount of tokens to a given address", async function() {
    const result = await token.mint(accounts[0], 100);
    log(`mint gasUsed: ${result.receipt.gasUsed}`);

    assert.equal(result.logs[0].event, "Mint");
    assert.equal(result.logs[0].args.to.valueOf(), accounts[0]);
    assert.equal(result.logs[0].args.amount.valueOf(), 100);
    assert.equal(result.logs[1].event, "Transfer");
    assert.equal(result.logs[1].args.from.valueOf(), 0x0);

    let balance0 = await token.balanceOf(accounts[0]);
    assert(balance0, 100);

    let totalSupply = await token.totalSupply();
    assert(totalSupply, 100);
  });

  it("should fail to mint after call to finishMinting", async function() {
    const tx = await token.finishMinting();
    log(`finishMinting gasUsed: ${tx.receipt.gasUsed}`);

    assert.equal(await token.mintingFinished(), true);
    await expectThrow(token.mint(accounts[0], 100));
  });

  it("should fail to mint when paused", async function() {
    const tx = await token.pause();
    log(`pause gasUsed: ${tx.receipt.gasUsed}`);

    await expectThrow(token.mint(accounts[0], 100));
  });

  it("should start to mint after call to startMinting", async function() {
    const tx1 = await token.finishMinting();
    log(`finishMinting gasUsed: ${tx1.receipt.gasUsed}`);

    assert.equal(await token.mintingFinished(), true);
    await expectThrow(token.mint(accounts[0], 100));

    const tx2 = await token.startMinting();
    log(`startMinting gasUsed: ${tx2.receipt.gasUsed}`);
    assert.equal(await token.mintingFinished(), false);
  });

  it("should only allow owner to finish minting", async function() {
    await token.finishMinting({from: accounts[1]}).should.be.rejectedWith(EVMRevert);

    const tx1 = await token.finishMinting();
    log(`finishMinting gasUsed: ${tx1.receipt.gasUsed}`);

    assert.equal(await token.mintingFinished(), true);
  })

  it("should only allow to finish minting when in canMint stage", async function() {
    const tx1 = await token.finishMinting();
    log(`finishMinting gasUsed: ${tx1.receipt.gasUsed}`);

    assert.equal(await token.mintingFinished(), true);

    await token.finishMinting({from: accounts[1]}).should.be.rejectedWith(EVMRevert);
  });

  it("should only allow owner to start minting", async function() {
    const tx1 = await token.finishMinting();
    log(`finishMinting gasUsed: ${tx1.receipt.gasUsed}`);
    
    assert.equal(await token.mintingFinished(), true);
    await token.startMinting({ from: accounts[1] }).should.be.rejectedWith(EVMRevert);

    const tx2 = await token.startMinting();
    log(`startMinting gasUsed: ${tx2.receipt.gasUsed}`);
  });

  it("should only allow to start minting when in cannotMint stage", async function() {
    await token.startMinting().should.be.rejectedWith(EVMRevert);
    const tx1 = await token.finishMinting();
    log(`finishMinting gasUsed: ${tx1.receipt.gasUsed}`);
    
    assert.equal(await token.mintingFinished(), true);

    const tx2 = await token.startMinting();
    log(`startMinting gasUsed: ${tx2.receipt.gasUsed}`);
  });
});
