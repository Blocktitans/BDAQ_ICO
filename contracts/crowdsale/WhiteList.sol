pragma solidity ^0.4.21;

import "../zeppelin-solidity/contracts/ownership/Ownable.sol";


/**
 * @title WhiteList
 * @dev This contract is used for storing whiteListed addresses before a crowdsale
 * is in progress. Only owner can add and remove white lists and address of this contract must be
 * set in the WhiteListedCrowdsale contract
 */
contract WhiteList is Ownable {
    mapping (address => bool) internal whiteListMap;

    function isWhiteListed(address investor) public view returns (bool) {
        return whiteListMap[investor];
    }

    function addWhiteListed(address whiteListAddress) public onlyOwner {
        require(whiteListMap[whiteListAddress] == false);
        whiteListMap[whiteListAddress] = true;
    }
    
    function addWhiteListedInBulk(address[] whiteListAddress) public onlyOwner {
        for (uint i = 0; i < whiteListAddress.length; i++) {
            whiteListMap[whiteListAddress[i]] = true;
        }
    }

    function removeWhiteListed(address whiteListAddress) public onlyOwner {
        require(whiteListMap[whiteListAddress] == true);
        delete whiteListMap[whiteListAddress];
    }
}
