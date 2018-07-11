import log from "./helpers/logger";
import EVMRevert from "./helpers/VMExceptionRevert";

const BigNumber = web3.BigNumber;
const should = require("chai")
  .use(require("chai-as-promised"))
  .use(require("chai-bignumber")(BigNumber))
  .should();

const BDQToken = artifacts.require("BDQToken");

contract("BDQToken", accounts => {
  let token = null;

  const _name = "BDAQ";
  const _symbol = "BDQ";
  const _decimals = 18;
  const _initialSupply = new BigNumber(5000000);

  beforeEach(async function() {
    token = await BDQToken.new(accounts[1], _initialSupply);
  });

  it("should not be able to create token with wallet address 0x0", async function() {
    await BDQToken.new("0x0", _initialSupply).should.be.rejectedWith(EVMRevert);
  });

  it("should not be able to create token with wallet initial balance 0", async function() {
    await BDQToken.new(accounts[1], 0).should.be.rejectedWith(EVMRevert);
  });

  it("has name BDAQ", async function() {
    const name = await token.name();
    name.should.be.equal(_name);
  });

  it("has symbol BDQ", async function() {
    const symbol = await token.symbol();
    symbol.should.be.equal(_symbol);
  });

  it("has amount of decimals 18", async function() {
    const decimals = await token.decimals();
    decimals.should.be.bignumber.equal(_decimals);
  });

  it("has initialSupply of 5000000 tokens", async function() {
    const initialSupply = await token.initialSupply();
    initialSupply.should.be.bignumber.equal(_initialSupply);
  });

  describe("setTokenInformation", function() {
    it("should be able to update token name and symbol", async function() {
      const newName = "AMSYS";
      const newSymbol = "AMS";

      const tx = await token.setTokenInformation(newName, newSymbol).should.be
        .fulfilled;
      log(`setTokenInformation gasUsed: ${tx.receipt.gasUsed}`);

      let _newName = await token.name();
      assert(_newName, newName);

      let _newSymbol = await token.symbol();
      assert(_newSymbol, newSymbol);
    });

    it("should throw when not called by owner", async function() {
      const newName = "AMSYS";
      const newSymbol = "AMS";

      await token
        .setTokenInformation(newName, newSymbol, { from: accounts[2] })
        .should.be.rejectedWith(EVMRevert);
    });
  });
});
