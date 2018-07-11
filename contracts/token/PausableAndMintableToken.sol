pragma solidity ^0.4.21;

import "../zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";


contract PausableAndMintableToken is PausableToken {
    event Mint(address indexed to, uint256 amount);
    event MintFinished();
    event MintStarted();

    bool public mintingFinished = false;

    modifier canMint() {
        require(!mintingFinished);
        _;
    }

    modifier cannotMint() {
        require(mintingFinished);
        _;
    }

    function mint(address _to, uint256 _amount)
        public
        onlyOwner
        canMint
        whenNotPaused
        returns (bool)
    {
        totalSupply_ = totalSupply_.add(_amount);
        balances[_to] = balances[_to].add(_amount);
        emit Mint(_to, _amount);
        emit Transfer(address(0), _to, _amount);
        return true;
    }

    function finishMinting() public onlyOwner canMint returns (bool) {
        mintingFinished = true;
        emit MintFinished();
        return true;
    }

    function startMinting() public onlyOwner cannotMint returns (bool) {
        mintingFinished = false;
        emit MintStarted();
        return true;
    }
}
