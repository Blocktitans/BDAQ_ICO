pragma solidity ^0.4.21;

import "../token/PausableAndMintableToken.sol";


contract BDQToken is PausableAndMintableToken {
    string public name = "BDAQ";
    string public symbol = "BDQ";
    uint8 public constant decimals = 18;

    // For patient incentive programs
    uint256 public initialSupply;

    event UpdatedTokenInformation(string newName, string newSymbol);

    constructor(address bdqWallet, uint256 _initialSupply) public {
        require(bdqWallet != address(0));
        require(_initialSupply > 0);

        initialSupply = _initialSupply;
        totalSupply_ = _initialSupply;
        balances[bdqWallet] = _initialSupply;

        emit Transfer(address(0), bdqWallet, _initialSupply);
    }

    /**
    * Owner can update token information here
    */
    function setTokenInformation(string _name, string _symbol) public onlyOwner {
        name = _name;
        symbol = _symbol;

        emit UpdatedTokenInformation(name, symbol);
    }
}
