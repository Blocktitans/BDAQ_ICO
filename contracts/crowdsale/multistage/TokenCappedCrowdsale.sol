pragma solidity ^0.4.21;

import "./Crowdsale.sol";


/**
 * @title TokenCappedCrowdsale
 * @dev Extension of Crowdsale with a max amount of tokens to be bought
 * in different stages, similar to multi stage crowdsale
 */
contract TokenCappedCrowdsale is Crowdsale {
    struct SoftCap {
        uint256 end;
        uint256 cap;
    }

    SoftCap[15] public softCap;
    uint256[15] public milestoneTotalSupply;

    constructor (
        uint256[] _capTimes,
        uint256[] _cap
    )
        public
    {
        require(_capTimes.length == _cap.length);
        require(_capTimes[0] > startTime);

        for(uint8 i = 0; i < _capTimes.length; i++) {
            require(_cap[i] > 0);
            if(i != 0) {
                require(_capTimes[i] > _capTimes[i-1]);
            }
            softCap[i].end = _capTimes[i];
            softCap[i].cap = _cap[i];
        }
    }

    // low level token purchase function
    function buyTokens(address beneficiary) public payable {
        uint8 currentPhase = phase();
        uint256 tokens = _buyTokens(beneficiary, currentRate());
        if(!setSupply(currentPhase, milestoneTotalSupply[currentPhase].add(tokens))) { 
            revert();
        }
    }

    function phase() internal view returns (uint8) {
        for(uint8 i = 0; i < softCap.length; i++) {
            if(now < softCap[i].end) {
                return i;
            }
        }
    }

    function setSupply(uint8 currentPhase, uint256 newSupply) internal returns (bool) {
        milestoneTotalSupply[currentPhase] = newSupply;
        return checkSupply(currentPhase);
    }

    function checkSupply(uint8 currentPhase) internal constant returns (bool) {
        uint256 rolledOverCap;
        uint256 rolledOverTotalSupply;
        for(uint8 i = 0; i <= currentPhase; i++) {
            rolledOverCap = rolledOverCap.add(softCap[i].cap); 
            rolledOverTotalSupply = rolledOverTotalSupply.add(milestoneTotalSupply[i]);
        }
        return rolledOverCap >= rolledOverTotalSupply;
    }
}
