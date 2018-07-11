import latestTime from "./helpers/latestTime";
import { increaseTimeTo, duration } from "./helpers/increaseTime";
import log from "./helpers/logger";

const BigNumber = web3.BigNumber;

require("chai")
  .use(require("chai-as-promised"))
  .use(require("chai-bignumber")(BigNumber))
  .should();

const BDQToken = artifacts.require("BDQToken");
const TokenVesting = artifacts.require("TokenVesting");
const WhiteList = artifacts.require("WhiteList");

const _maxTokenSupply = new BigNumber(5000000);

contract("TokenVesting", accounts => {
  const amount = 100;

  beforeEach(async function() {
    this.token = await BDQToken.new(accounts[0], _maxTokenSupply);
    this.whitelist = await WhiteList.new();
    this.tokenVesting = await TokenVesting.new(
      this.token.address,
      this.whitelist.address
    );
    this.releaseTime = latestTime() + duration.years(1);
    this.newReleaseTime = latestTime() + duration.years(2);
    await this.token.mint(this.tokenVesting.address, amount, {
      from: accounts[0]
    });
  });

  it("should throw whem not called by owner", async function() {
    await this.tokenVesting.addVesting(accounts[1], 10, this.releaseTime, {
      from: accounts[1]
    }).should.be.rejected;
  });

  it("cannot be released before time limit", async function() {
    let add = await this.tokenVesting.addVesting(
      accounts[1],
      10,
      this.releaseTime
    );
    log(`Add vesting gasUsed: ${add.receipt.gasUsed}`);
    const whitelisting = await this.whitelist.addWhiteListed(accounts[1], {
      from: accounts[0]
    });
    log(`addWhiteListed gasUsed: ${whitelisting.receipt.gasUsed}`);
    await this.tokenVesting.claim({ from: accounts[1] }).should.be.rejected;
  });

  it("cannot be released just before time limit", async function() {
    await increaseTimeTo(this.releaseTime - duration.seconds(3));
    const whitelisting = await this.whitelist.addWhiteListed(accounts[1], {
      from: accounts[0]
    });
    log(`addWhiteListed gasUsed: ${whitelisting.receipt.gasUsed}`);
    await this.tokenVesting.claim({ from: accounts[1] }).should.be.rejected;
  });

  it("can be released just after limit", async function() {
    const add = await this.tokenVesting.addVesting(
      accounts[1],
      10,
      this.releaseTime
    );
    log(`Add vesting gasUsed: ${add.receipt.gasUsed}`);
    await increaseTimeTo(this.releaseTime + duration.seconds(1));
    const whitelisting = await this.whitelist.addWhiteListed(accounts[1], {
      from: accounts[0]
    });
    log(`addWhiteListed gasUsed: ${whitelisting.receipt.gasUsed}`);
    const claim = await this.tokenVesting.claim({ from: accounts[1] }).should.be
      .fulfilled;
    log(`Claim vesting gasUsed: ${claim.receipt.gasUsed}`);
    const balance = await this.token.balanceOf(accounts[1]);
    balance.should.be.bignumber.equal(10);
  });

  it("can be released after time limit", async function() {
    const addone = await this.tokenVesting.addVesting(
      accounts[1],
      10,
      this.releaseTime
    );
    log(`Add vesting gasUsed: ${addone.receipt.gasUsed}`);
    const addsecond = await this.tokenVesting.addVesting(
      accounts[1],
      35,
      this.releaseTime
    );
    log(`Add vesting gasUsed: ${addsecond.receipt.gasUsed}`);
    await increaseTimeTo(this.releaseTime + duration.years(1));
    const whitelisting = await this.whitelist.addWhiteListed(accounts[1], {
      from: accounts[0]
    });
    log(`addWhiteListed gasUsed: ${whitelisting.receipt.gasUsed}`);
    const claim = await this.tokenVesting.claim({ from: accounts[1] }).should.be
      .fulfilled;
    log(`Claim vesting gasUsed: ${claim.receipt.gasUsed}`);
    const balance = await this.token.balanceOf(accounts[1]);
    balance.should.be.bignumber.equal(45);
  });

  it("can be manage released when having multiple entry for same address", async function() {
    const addone = await this.tokenVesting.addVesting(
      accounts[1],
      10,
      this.releaseTime
    );
    log(`Add vesting gasUsed: ${addone.receipt.gasUsed}`);
    const addsecond = await this.tokenVesting.addVesting(
      accounts[1],
      35,
      this.newReleaseTime
    );
    log(`Add vesting gasUsed: ${addsecond.receipt.gasUsed}`);
    await increaseTimeTo(this.newReleaseTime - duration.seconds(5));
    const whitelisting = await this.whitelist.addWhiteListed(accounts[1], {
      from: accounts[0]
    });
    log(`addWhiteListed gasUsed: ${whitelisting.receipt.gasUsed}`);
    const claim = await this.tokenVesting.claim({ from: accounts[1] }).should.be
      .fulfilled;
    log(`Claim vesting gasUsed: ${claim.receipt.gasUsed}`);
    const balance = await this.token.balanceOf(accounts[1]);
    balance.should.be.bignumber.equal(10);
  });

  it("cannot be released twice", async function() {
    const add = await this.tokenVesting.addVesting(
      accounts[1],
      10,
      this.releaseTime
    );
    log(`Add vesting gasUsed: ${add.receipt.gasUsed}`);
    await increaseTimeTo(this.releaseTime + duration.years(1));
    const whitelisting = await this.whitelist.addWhiteListed(accounts[1], {
      from: accounts[0]
    });
    log(`addWhiteListed gasUsed: ${whitelisting.receipt.gasUsed}`);
    const firstclaim = await this.tokenVesting.claim({ from: accounts[1] })
      .should.be.fulfilled;
    log(`Claim vesting gasUsed: ${firstclaim.receipt.gasUsed}`);
    const finalclaim = await this.tokenVesting.claim({ from: accounts[1] })
      .should.be.rejected;
    const balance = await this.token.balanceOf(accounts[1]);
    balance.should.be.bignumber.equal(10);
  });

  it("if not whitelisted then transaction should get rejected", async function() {
    const add = await this.tokenVesting.addVesting(
      accounts[1],
      10,
      this.releaseTime
    );
    log(`Add vesting gasUsed: ${add.receipt.gasUsed}`);
    await increaseTimeTo(this.releaseTime + duration.years(1));
    await this.tokenVesting.claim().should.be.rejected;
  });

  it("should not allow to add vesting for a zero address", async function() {
    await this.tokenVesting.addVesting("0x0", 10, this.releaseTime).should.be
      .rejected;
  });

  it("should not allow to add vesting for a zero value", async function() {
    await this.tokenVesting.addVesting(accounts[1], 0, this.releaseTime).should.be
      .rejected;
  });

  it("should allow add vesting if vesting time greater than current time", async function() {
    const newRelaseTime = latestTime() - 1000;
    await this.tokenVesting.addVesting(accounts[1], 10, newRelaseTime).should.be
      .rejected;
  })

  it("should not be able to vest more than the tokens held by the vesting contract", async function() {
    await this.tokenVesting.addVesting(accounts[1], 110, this.releaseTime).should.be
      .rejected;
  })
});
