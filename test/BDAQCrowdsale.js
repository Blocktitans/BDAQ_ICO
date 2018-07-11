const Crowdsale = artifacts.require('./BDQ/BDAQPublicSale.sol');
const Token = artifacts.require('./BDQ/BDQToken.sol');
const MockWallet = artifacts.require('./mocks/MockWallet.sol');
const WhiteList = artifacts.require('./crowdsale/WhiteList.sol')
import {advanceBlock} from './helpers/advanceToBlock';
import latestTime from './helpers/latestTime';
import increaseTime from './helpers/increaseTime';
const BigNumber = require('bignumber.js');
const assertRevert = require('./helpers/assertRevert');
const ONE_ETH = web3.toWei(1, 'ether');
const MOCK_ONE_ETH = web3.toWei(0.000001, 'ether'); // diluted ether value for testing


contract('BDAQCrowdsale', (accounts) => {
  let token;
  let ends;
  let rates;
  let wallet;
  let startTime;
  let crowdsale;
  let capTimes;
  let caps;
  let list;

  beforeEach(async () => {
    await advanceBlock();
    startTime = latestTime();
    capTimes = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
    rates = [500, 400, 300, 200, 100];

    ends = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
    caps = [900000e18, 900000e18, 900000e18, 900000e18, 900000e18];
    wallet = accounts[0];

    token = await Token.new(wallet, 100e18);
    list = await WhiteList.new({from: accounts[0]})
    crowdsale = await Crowdsale.new(startTime, ends, rates, wallet, token.address, capTimes, caps, list.address);
    await token.transferOwnership(crowdsale.address);
  });

  it('should allow owner to update end times', async () => {
    const endsNew = [startTime + 2*86400, startTime + 86400*4, startTime + 86400*6, startTime + 86400*8, startTime + 86400*10];

    await crowdsale.updateEndTimes(endsNew); 
  });

  it('should not update endTime because ends length smaller', async () => {
    const endsNew = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4];
    try {
      await crowdsale.updateEndTimes(endsNew); 
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should not update endTime because end times smaller than startTime', async () => {
    const endsNew = [startTime - 2, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
    try {
      await crowdsale.updateEndTimes(endsNew); 
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should not update endTime because end times not in ascending order', async () => {
    const endsNew = [startTime + 86400, startTime + 86400*3, startTime + 86400*2, startTime + 86400*4, startTime + 86400*5];
    try {
      await crowdsale.updateEndTimes(endsNew); 
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should allow owner to update cap times', async () => {
    const capTimesNew = [startTime + 2*86400, startTime + 86400*4, startTime + 86400*6, startTime + 86400*8, startTime + 86400*10];
    
    await crowdsale.updateEndTimes(capTimesNew); 
    await crowdsale.updateCapTimes(capTimesNew); 
  });

  it('should not update capTimes because caps length smaller', async () => {
    const capTimesNew = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4];
    try {
      await crowdsale.updateCapTimes(capTimesNew); 
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should not update capTimes because cap times smaller than startTime', async () => {
    const capTimesNew = [startTime - 2, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*5];
    try {
      await crowdsale.updateCapTimes(capTimesNew); 
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should not update capTimes because cap times not in ascending order', async () => {
    const capTimesNew = [startTime + 86400, startTime + 86400*3, startTime + 86400*2, startTime + 86400*4, startTime + 86400*5];
    try {
      await crowdsale.updateCapTimes(capTimesNew); 
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });

  it('should not update capTimes because last cap times not equal to endTime', async () => {
    const capTimesNew = [startTime + 86400, startTime + 86400*2, startTime + 86400*3, startTime + 86400*4, startTime + 86400*6];
    try {
      await crowdsale.updateCapTimes(capTimesNew); 
      assert.fail('should have thrown before');
    } catch(error) {
      assertRevert(error);
    }
  });
});
