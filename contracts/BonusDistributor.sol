// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "./interfaces/IVotingEscrow.sol";

contract BonusDistributor {
    struct BonusPayment {
        uint256 tokenId;
        uint256 bonusPayment;
    }

    address private immutable _owner;
    address private immutable _distributor;

    ERC20Upgradeable public jungl;
    IVotingEscrow public ve;

    constructor(address _operator, address _jungl, address _ve) {
        _owner = msg.sender;
        _distributor = _operator;
        jungl = ERC20Upgradeable(_jungl);
        ve = IVotingEscrow(_ve);
    }

    function distribute(
        uint256 _total,
        BonusPayment[] calldata _payments
    ) external {
        require(
            msg.sender == _distributor,
            "BonusDistributor: caller is not the distributor"
        );
        uint256 _numPayments = _payments.length;
        uint256 _balance = jungl.balanceOf(address(this));
        require(_total != 0, "BonusDistributor: nothing to distribute");
        require(_total <= _balance, "BonusDistributor: balance too low");
        require(_numPayments != 0, "BonusDistributor: no receivers");
        uint256 _allowance = jungl.allowance(address(this), address(ve));
        if (_allowance < _total) {
            jungl.approve(address(ve), _balance);
        }
        for (uint256 _i = 0; _i < _numPayments; ) {
            ve.deposit_for(_payments[_i].tokenId, _payments[_i].bonusPayment);
            unchecked {
                ++_i;
            }
        }
    }

    function withdraw() external {
        _withdraw(msg.sender);
    }

    function withdraw(address _receiver) external {
        _withdraw(_receiver);
    }

    function _withdraw(address _receiver) internal {
        require(
            msg.sender == _owner,
            "BonusDistributor: caller is not the owner"
        );
        uint256 _balance = jungl.balanceOf(address(this));
        jungl.transfer(_receiver, _balance);
    }
}
