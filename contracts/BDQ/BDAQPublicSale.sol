pragma solidity ^0.4.21;

import "../crowdsale/multistage/TokenCappedCrowdsale.sol";
import "../crowdsale/WhiteListedCrowdsale.sol";
import "../crowdsale/PausableCrowdsale.sol";


/**
 * @title SimpleCrowdsale
 * @dev This is an example of a fully fledged crowdsale.
 * The way to add new features to a base crowdsale is by multiple inheritance.
 * In order to switch between multistage and single stage, one must also change base contract import of the add-ons.
 * In this example we are providing following extensions:
 * TokenCappedCrowdsale - sets a max boundary for Token sold in milestones
 * RefundableCrowdsale - set a min goal to be reached and returns funds if it's not met
 *
 * After adding multiple features it's good practice to run integration tests
 * to ensure that subcontracts works together as intended.
 */
contract BDAQPublicSale is TokenCappedCrowdsale, WhiteListedCrowdsale, PausableCrowdsale {
    function BDAQPublicSale (
        uint256 _startTime,
        uint256[] _ends,
        uint256[] _swapRate,
        address _wallet,
        address token,
        uint256[] _capTimes,
        uint256[] _caps,
        address _whiteListAddr
    ) 
        public
        TokenCappedCrowdsale(
            _capTimes,
            _caps
        )
        WhiteListedCrowdsale(
            _whiteListAddr
        )
        Crowdsale(
            _startTime,
            _ends,
            _swapRate,
            _wallet,
            token
        )
    {
    }
    
    function updateEndTimes(uint256[] _ends) public onlyOwner {
        require(_ends.length == endsLength);
        require(_ends[0] > startTime);

        for(uint8 i = 0; i < endsLength; i++) {
            if(i != 0) {
                require(_ends[i] > _ends[i-1]);
            }
            rate[i].end = _ends[i];
        }
        endTime = _ends[endsLength - 1];
    }

    function updateCapTimes(uint256[] _capTimes) public onlyOwner {
        require(_capTimes.length == endsLength);
        require(_capTimes[0] > startTime);
        for(uint8 i = 0; i < endsLength; i++) {
            if(i != 0) {
                require(_capTimes[i] > _capTimes[i-1]);
            }
            softCap[i].end = _capTimes[i];
        }
        require(endTime == _capTimes[endsLength - 1]);
    }
}
