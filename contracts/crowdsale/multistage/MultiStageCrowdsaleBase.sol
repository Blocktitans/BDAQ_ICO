pragma solidity ^0.4.21;

import "../CrowdsaleBase.sol";


/**
 * @title FinalizableCrowdsale
 * @dev Extension of Crowdsale where an owner can do extra work
 * after finishing.
 */
contract MultiStageCrowdsaleBase is CrowdsaleBase {
    struct Rate {
        uint256 end;
        uint256 swapRate;
    }

    uint256 internal endsLength;
    // how many token units a buyer gets per wei
    Rate[15] internal rate;

    constructor(
        uint256 _startTime,
        uint256[] _ends,
        uint256[] _swapRate,
        address _wallet,
        address _token
    )
        public
        CrowdsaleBase(_startTime, _wallet, _token)
    {
        require(_ends.length == _swapRate.length);
        endsLength = _ends.length;
        for(uint8 i = 0; i < _ends.length; i++) {
            require(_swapRate[i] > 0);

            if(i != 0) {
                require(_ends[i] > _ends[i-1]);
            }
            rate[i].end = _ends[i];
            rate[i].swapRate = _swapRate[i];
        }
    }
}
