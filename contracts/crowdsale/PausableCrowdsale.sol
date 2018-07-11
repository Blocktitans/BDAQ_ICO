pragma solidity ^0.4.11;

import "../zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import './multistage/Crowdsale.sol';

/**
 * @title FinalizableCrowdsale
 * @dev Extension of Crowdsale where an owner can do extra work
 * after finishing.
 */
contract PausableCrowdsale is Crowdsale, Pausable {

  // Admin Functions
  function setContracts(address _tokenAddr, address _wallet) public onlyOwner whenPaused {
    wallet = _wallet;
    token = MintableToken(_tokenAddr);
  }

  function transferTokenOwnership(address _nextOwner) public onlyOwner whenPaused {
    token.transferOwnership(_nextOwner);
  }

  // low level token purchase function
  function buyTokens(address beneficiary) public whenNotPaused payable {
    super.buyTokens(beneficiary);
  }
}