'user strict';

import assertRevert from '../helpers/assertRevert';
var PausableTokenMock = artifacts.require('PausableTokenMock');

contract('PausableToken', function (accounts) {
  let token;

  beforeEach(async function () {
    token = await PausableTokenMock.new(accounts[0], 100);
  });

  it('should return paused false after construction', async function () {
    let paused = await token.paused();

    assert.equal(paused, false);
  });

  it('should return paused true after pause', async function () {
    await token.pause();
    let paused = await token.paused();

    assert.equal(paused, true);
  });

  it('should return paused false after pause and unpause', async function () {
    await token.pause();
    await token.unpause();
    let paused = await token.paused();

    assert.equal(paused, false);
  });

  it('should be able to transfer if transfers are unpaused', async function () {
    await token.transfer(accounts[1], 100);
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance1, 100);
  });

  it('should be able to approve and transferFrom if unpaused', async function () {
    await token.approve(accounts[1], 100);
    await token.transferFrom(accounts[0], accounts[1], 100, {from: accounts[1]});
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance1, 100);
  });

  it('should be able to decrease approval if unpaused', async function () {
    await token.approve(accounts[1], 100);
    await token.decreaseApproval(accounts[1], 10);
    let approval0 = await token.allowance(accounts[0], accounts[1]);
    assert.equal(approval0, 90);
  });

  it('should be able to increase approval if unpaused', async function () {
    await token.approve(accounts[1], 90);
    await token.increaseApproval(accounts[1], 10);
    let approval0 = await token.allowance(accounts[0], accounts[1]);
    assert.equal(approval0, 100);
  });

  it('should be able to transfer after transfers are paused and unpaused', async function () {
    await token.pause();
    await token.unpause();
    await token.transfer(accounts[1], 100);
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance1, 100);
  });

  it('should throw an error trying to transfer while transactions are paused', async function () {
    await token.pause();
    await assertRevert(token.transfer(accounts[1], 100));
  });

  it('should throw an error trying to transfer from another account while transactions are paused', async function () {
    await token.pause();
    await assertRevert(token.transferFrom(accounts[0], accounts[1], 100));
  });
});
