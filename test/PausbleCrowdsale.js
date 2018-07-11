const Crowdsale = artifacts.require('./mocks/PausableCrowdsaleMock.sol');
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

  describe('#purchase', () => {

    it('should allow purchase if crowdsale not paused', async () => {
      const INVESTOR = accounts[4];
      const walletBalanceBefore = await web3.eth.getBalance(wallet);
      
      // buy tokens
      await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
      
      const walletBalanceAfter = await web3.eth.getBalance(wallet);
      const tokensBalance = await token.balanceOf.call(INVESTOR);
      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[0]);
      assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), MOCK_ONE_ETH, 'ether still deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), tokensAmount.toNumber(), 'tokens still deposited into the INVESTOR balance');
    });

    it('should allow not allow purchase if crowdsale is paused', async () => {
      const INVESTOR = accounts[4];
      const walletBalanceBefore = await web3.eth.getBalance(wallet);
      await crowdsale.pause({gasPrice: 0});
      
      // buy tokens
      try {
        await crowdsale.buyTokens(INVESTOR, {value: MOCK_ONE_ETH, from: INVESTOR});
        assert.fail('should have thrown before');
      } catch(error) {
        assertRevert(error);
      }
      
      const walletBalanceAfter = await web3.eth.getBalance(wallet);
      const tokensBalance = await token.balanceOf.call(INVESTOR);
      const tokensAmount = new BigNumber(MOCK_ONE_ETH).mul(rates[0]);
      assert.equal(walletBalanceAfter.sub(walletBalanceBefore).toNumber(), 0, 'ether still deposited into the wallet');
      assert.equal(tokensBalance.toNumber(), 0, 'tokens still deposited into the INVESTOR balance');
    });

    it('should allow to set contracts if paused', async () => {
      const INVESTOR = accounts[4];
      const walletBalanceBefore = await web3.eth.getBalance(wallet);
      await crowdsale.pause();

      const tokenNew = await Token.new();
      // buy tokens
      await crowdsale.setContracts(tokenNew.address, accounts[2]);
      
      assert.equal(await crowdsale.token.call(), tokenNew.address, 'token contract not set');
      assert.equal(await crowdsale.wallet.call(), accounts[2], 'wallet address not set');
    });

    it('should allow to transfer token ownership if paused', async () => {
      const INVESTOR = accounts[4];
      const walletBalanceBefore = await web3.eth.getBalance(wallet);
      await crowdsale.pause();

      // buy tokens
      await crowdsale.transferTokenOwnership(accounts[0]);
      
      assert.equal(await token.owner.call(), accounts[0], 'token address not set');
    });
  });
});
