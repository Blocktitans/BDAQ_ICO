import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'
import EVMRevert from './helpers/EVMRevert'
import mockEther from './helpers/mockEther'

const BigNumber = web3.BigNumber

const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const WhiteListedCrowdsale = artifacts.require('./helpers/WhiteListedCrowdsaleImpl.sol')
const WhiteList = artifacts.require('./crowdsale/WhiteList.sol')
const Token = artifacts.require('../node_modules/zeppelin-solidity/contracts/token/ERC20/MintableToken.sol');

contract('WhiteListedCrowdsale', function ([_, owner, wallet, thirdparty]) {

  const MOCK_ONE_ETH = web3.toWei(0.000001, 'ether'); // diluted ether value for testing
  const value = mockEther(42)


  before(async function() {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
  })

  beforeEach(async function () {
    this.startTime = latestTime()
    this.endTime = this.startTime + 86400*5;
    this.ends = [this.startTime + 86400, this.startTime + 86400*2, this.startTime + 86400*3, this.startTime + 86400*4, this.startTime + 86400*5];
    this.rates = [500, 400, 300, 200, 100];
    this.token = await Token.new();
    this.list = await WhiteList.new({from: owner})
    this.crowdsale = await WhiteListedCrowdsale.new(this.startTime, this.ends, this.rates, wallet, this.token.address, this.list.address, {from: owner})
    await this.token.transferOwnership(this.crowdsale.address);

  })

  it('should allow only whiteListed addresses to buy tokens', async function () {
    await this.list.addWhiteListed(thirdparty, {from: owner}).should.be.fulfilled
    await this.crowdsale.buyTokens(thirdparty, {value, from: thirdparty}).should.be.fulfilled
  })

  it('should not allow non whiteListed addresses to buy tokens', async function () {
    await this.crowdsale.buyTokens(thirdparty, {value, from: thirdparty}).should.be.rejectedWith(EVMRevert)
  })

})
