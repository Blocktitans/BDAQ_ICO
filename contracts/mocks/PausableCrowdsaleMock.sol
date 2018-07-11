pragma solidity ^0.4.11;

import '../crowdsale/PausableCrowdsale.sol';

/**
 * @title FinalizableCrowdsale
 * @dev Extension of Crowdsale where an owner can do extra work
 * after finishing.
 */
contract PausableCrowdsaleMock is PausableCrowdsale {

  function PausableCrowdsaleMock(uint256 _startTime, uint256[] _ends, uint256[] _swapRate, address _wallet, address _token) public
    Crowdsale(_startTime, _ends, _swapRate, _wallet, _token)
  {

  }
  
  function validPurchase() internal view returns (bool) {
      bool withinPeriod = now >= startTime && now <= endTime;
      bool nonZeroPurchase = msg.value > 1e11;
      return withinPeriod && nonZeroPurchase;
  }
}