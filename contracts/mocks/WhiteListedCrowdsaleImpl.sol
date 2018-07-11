pragma solidity ^0.4.16;


import "../../contracts/crowdsale/WhiteListedCrowdsale.sol";


contract WhiteListedCrowdsaleImpl is WhiteListedCrowdsale {

    function WhiteListedCrowdsaleImpl (uint256 _startTime, uint256[] _ends, uint256[] _swapRate, address _wallet, address _token, address _whiteList) public
        Crowdsale(_startTime, _ends, _swapRate, _wallet, _token)
        WhiteListedCrowdsale(_whiteList)
    {
        
    }

    function validPurchase() internal view returns (bool) {
        bool withinPeriod = now >= startTime && now <= endTime;
        bool nonZeroPurchase = msg.value > 1e11;
        return withinPeriod && nonZeroPurchase;
    }
}