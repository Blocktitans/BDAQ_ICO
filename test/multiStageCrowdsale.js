const Crowdsale = artifacts.require('./mocks/MockMultiStageCrowdsale.sol');
const MockWallet = artifacts.require('./mocks/MockWallet.sol');
const Token = artifacts.require('../node_modules/zeppelin-solidity/contracts/token/ERC20/MintableToken.sol');
import {advanceBlock} from './helpers/advanceToBlock';
import latestTime from './helpers/latestTime';
import increaseTime from './helpers/increaseTime';
const BigNumber = require('bignumber.js');
const assertRevert = require('./helpers/assertRevert');
const ONE_ETH = web3.toWei(1, 'ether');
const MOCK_ONE_ETH = web3.toWei(0.000001, 'ether'); // diluted ether value for testing

contract('Crowdsale', (accounts) => {
  let token;
  let ends;
  let rates;
  let wallet;
  let startTime;
  let crowdsale;

  beforeEach(async () => {
    await advanceBlock();
    startTime = latestTime();
    wallet = accounts[0];
    ends = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
    rates = [500, 400, 300, 200, 100];
    token = await Token.new();
    crowdsale = await Crowdsale.new(startTime, ends, rates, wallet, token.address);
    await token.transferOwnership(crowdsale.address);
  });

  describe('#crowdsaleDetails', () => {
    it('should allow start crowdsale properly', async () => {
    // checking startTime
    const startTimeSet = await crowdsale.startTime.call();
    assert.equal(startTime, startTimeSet.toNumber(), 'startTime not set right');

    //checking token and wallet address
    const tokenAddress = await crowdsale.token.call();
    const walletAddress = await crowdsale.wallet.call();
    assert.equal(tokenAddress, token.address, 'address for token in contract not set');
    assert.equal(walletAddress, wallet, 'address for multisig wallet in contract not set');

    //list rates and check
    const rate = await crowdsale.listRates.call();
    rate[1].splice(rates.length);
    rate[0].splice(rates.length);

    assert.equal(rate[0][0].toNumber(), ends[0], 'endTime1 not set right');
    assert.equal(rate[0][1].toNumber(), ends[1], 'endTime2 not set right');
    assert.equal(rate[0][2].toNumber(), ends[2], 'endTime3 not set right');
    assert.equal(rate[0][3].toNumber(), ends[3], 'endTime4 not set right');
    assert.equal(rate[0][4].toNumber(), ends[4], 'endTime5 not set right');

    assert.equal(rate[1][0].toNumber(), rates[0], 'swapRate1 not set right');
    assert.equal(rate[1][1].toNumber(), rates[1], 'swapRate2 not set right');
    assert.equal(rate[1][2].toNumber(), rates[2], 'swapRate3 not set right');
    assert.equal(rate[1][3].toNumber(), rates[3], 'swapRate4 not set right');
    assert.equal(rate[1][4].toNumber(), rates[4], 'swapRate5 not set right');
    });
  });

  describe('#unsuccesfulInitialization', () => {

    it('should not allow to start crowdsale if wallet address is address(0)',  async () => {
      let crowdsaleNew;
      try {
        crowdsaleNew = await Crowdsale.new(startTime, ends, rates, '0x00', token.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertRevert(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });

    it('should not allow to start crowdsale due to rate length mismatch',  async () => {
      let crowdsaleNew;
      ends = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
      rates = [500, 400, 300, 200];
      try {
        crowdsaleNew = await Crowdsale.new(startTime, ends, rates, wallet, token.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertRevert(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });

    it('should not allow to start crowdsale if first end time smaller than startTime',  async () => {
      let crowdsaleNew;
      ends = [startTime - 2, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
      rates = [500, 400, 300, 200, 100];
      try {
        crowdsaleNew = await Crowdsale.new(startTime, ends, rates, wallet, token.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertRevert(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });

    it('should not allow to start crowdsale if any rate is equal to zero',  async () => {
      let crowdsaleNew;
      ends = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
      rates = [500, 400, 300, 200, 0];
      try {
        crowdsaleNew = await Crowdsale.new(startTime, ends, rates, wallet, token.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertRevert(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });

    it('should not allow to start crowdsale if succesive endTimes not in ascending order',  async () => {
      let crowdsaleNew;
      ends = [startTime + 86400, startTime + 86400*3, startTime + 86400*2, startTime + 86400*4, startTime + 86400*5];
      rates = [500, 400, 300, 200, 0];
      try {
        crowdsaleNew = await Crowdsale.new(startTime, ends, rates, wallet, token.address);
        assert.fail('should have failed before');
      } catch(error) {
        assertRevert(error);
      }

      assert.equal(crowdsaleNew, undefined, 'crowdsale still initialized');
    });
  });

  describe('#hasEnded', () => {
    it('should return false before endTime',  async () => {
      assert.equal(await crowdsale.hasEnded.call(), false);
    });
  });

  describe('#currentRate', () => {

    it('should return 0 rate before startTime',  async () => {
      let crowdsaleNew;
      const startTime1 = startTime + 100;
      ends = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
      rates = [500, 400, 300, 200, 100];

      crowdsaleNew = await Crowdsale.new(startTime1, ends, rates, wallet, token.address);

      const rate = await crowdsaleNew.currentRate();
      assert.equal(rate.toNumber(), 0, 'rate return not correct');
    });

    it('should return 0 rate after endTime',  async () => {
      let crowdsaleNew;
      const startTime1 = startTime + 100;
      ends = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
      rates = [500, 400, 300, 200, 100];

      crowdsaleNew = await Crowdsale.new(startTime1, ends, rates, wallet, token.address);

      await increaseTime(ends[4] - startTime);

      const rate = await crowdsaleNew.currentRate();
      assert.equal(rate.toNumber(), 0, 'rate return not correct');
    });
  });

  describe('#invalidPurchase', () => {

    it('should not allow investors to buy tokens if beneficiary address is address(0)', async () => {
      const INVESTOR = accounts[4];
      const walletBalanceBefore = await web3.eth.getBalance(wallet);

      // buy tokens
      try {
        await crowdsale.buyTokens('0x00', {value: MOCK_ONE_ETH, from: INVESTOR});
        assert.fail('should have failed before');
      } catch(error) {
        assertRevert(error);
      }

      const walletBalanceAfter = await web3.eth.getBalance(wallet);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[0]);
      assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), 0, 'ether still deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), 0, 'tokens still deposited into the INVESTOR balance');
    });

    it('should not allow investors to buy tokens if beneficiary address is msg.value is 0', async () => {
      const INVESTOR = accounts[4];
      const walletBalanceBefore = await web3.eth.getBalance(wallet);

      // buy tokens
      try {
        await crowdsale.buyTokens('0x00', {value: 0, from: INVESTOR});
        assert.fail('should have failed before');
      } catch(error) {
        assertRevert(error);
      }

      const walletBalanceAfter = await web3.eth.getBalance(wallet);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[0]);
      assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), 0, 'ether still deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), 0, 'tokens still deposited into the INVESTOR balance');
    });

    it('should not allow investors to buy tokens if startTime not reached', async () => {
      const INVESTOR = accounts[4];
      let crowdsaleNew;
      const startTime1 = startTime + 100;
      crowdsaleNew = await Crowdsale.new(startTime1, ends, rates, wallet, token.address);

      const walletBalanceBefore = await web3.eth.getBalance(wallet);
      // buy tokens
      try {
        await crowdsale.buyTokens('0x00', {value: MOCK_ONE_ETH, from: INVESTOR});
        assert.fail('should have failed before');
      } catch(error) {
        assertRevert(error);
      }

      const walletBalanceAfter = await web3.eth.getBalance(wallet);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[0]);
      assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), 0, 'ether still deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), 0, 'tokens still deposited into the INVESTOR balance');
    });

    it('should allow not investors to buy tokens after endTime', async () => {
      const INVESTOR = accounts[4];

      await increaseTime(ends[4] - startTime + 1);

      const walletBalanceBefore = await web3.eth.getBalance(wallet);
      // buy tokens
      try {
        await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
        assert.fail('should have failed before');
      } catch(error) {
        assertRevert(error);
        const walletBalanceAfter = await web3.eth.getBalance(wallet);
        const tokensBalance = await token.balanceOf.call(INVESTOR);
        assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), 0, 'ether still deposited into the wallet');
        assert.equal(tokensBalance.toNumber(), 0, 'tokens still deposited into the INVESTOR balance');
      }
    });

    it('should allow not allow forward funds if wallet payable consumes a lot of gas', async () => {
      const INVESTOR = accounts[4];
      const walletNew = await MockWallet.new();
      const tokenNew = await Token.new()
      const crowdsaleNew = await Crowdsale.new(startTime, ends, rates, walletNew.address, tokenNew.address)
      await tokenNew.transferOwnership(crowdsaleNew.address);
      const walletBalanceBefore = await web3.eth.getBalance(wallet);

      // buy tokens
      try {
        await crowdsaleNew.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
        assert.fail('should have failed before');
      } catch(error) {
        assertRevert(error);
        const walletBalanceAfter = await web3.eth.getBalance(wallet);
        const tokensBalance = await token.balanceOf.call(INVESTOR);
        assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), 0, 'ether still deposited into the wallet');
        assert.equal(tokensBalance.toNumber(), 0, 'tokens still deposited into the INVESTOR balance');
      }
    });
  });

  describe('#purchaseTimeMilestones', () => {

    it('should allow investors to buy tokens using fallback function', async () => {
      const INVESTOR = accounts[4];
      const walletBalanceBefore = await web3.eth.getBalance(wallet);

      // buy tokens
      await web3.eth.sendTransaction({from: INVESTOR, to: crowdsale.address, value: MOCK_ONE_ETH, gas: 4500000});
      const walletBalanceAfter = await web3.eth.getBalance(wallet);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[0]);
      assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens at the 1st swapRate', async () => {
      const INVESTOR = accounts[4];
      const walletBalanceBefore = await web3.eth.getBalance(wallet);

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalanceAfter = await web3.eth.getBalance(wallet);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[0]);
      assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens at the 2nd swapRate', async () => {
      const INVESTOR = accounts[4];

      await increaseTime(ends[0] - startTime);
      const walletBalanceBefore = await web3.eth.getBalance(wallet);

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalanceAfter = await web3.eth.getBalance(wallet);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[1]);
      assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens at the 3rd swapRate', async () => {
      const INVESTOR = accounts[4];

      await increaseTime(ends[1] - startTime);
      const walletBalanceBefore = await web3.eth.getBalance(wallet);

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalanceAfter = await web3.eth.getBalance(wallet);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[2]);
      assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens at the 4th swapRate', async () => {
      const INVESTOR = accounts[4];

      await increaseTime(ends[2] - startTime);
      const walletBalanceBefore = await web3.eth.getBalance(wallet);

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalanceAfter = await web3.eth.getBalance(wallet);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[3]);
      assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens at the 5th swapRate', async () => {
      const INVESTOR = accounts[4];

      await increaseTime(ends[3] - startTime);
      const walletBalanceBefore = await web3.eth.getBalance(wallet);

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      const walletBalanceAfter = await web3.eth.getBalance(wallet);
      const tokensBalance = await token.balanceOf.call(INVESTOR);


      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[4]);
      assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });

    it('should allow investors to buy tokens at all swapRates across the crowdsales', async () => {
      const INVESTOR = accounts[4];
      const walletBalanceBefore = await web3.eth.getBalance(wallet);

      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});

      await increaseTime(ends[0] - startTime);
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});

      await increaseTime(ends[1] - ends[0]);
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});

      await increaseTime(ends[2] - ends[1]);
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});

      await increaseTime(ends[3] - ends[2]);
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});

      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[0] + rates[1] + rates[2] + rates[3] + rates[4]);
      const walletBalanceAfter = await web3.eth.getBalance(wallet);
      const tokensBalance = await token.balanceOf.call(INVESTOR);

      assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), 5 * MOCK_ONE_ETH, 'ether not deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens not deposited into the INVESTOR balance');
    });
  });
});
