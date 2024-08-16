// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/ClonesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/MathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

import "../interfaces/IPairFactory.sol";
import "../interfaces/IPair.sol";

contract PairFactory is IPairFactory, OwnableUpgradeable, PausableUpgradeable {
    using ClonesUpgradeable for address;
    using MathUpgradeable for uint256;

    uint256 public constant FEE_PRECISION = 10 ** 18;
    uint256 public constant MAX_FEE = 0.5 * 10 ** 16; // 0.5%

    address public pairImplementation;

    uint256 public stableFee;
    uint256 public volatileFee;

    address public feeManager;
    address public pendingFeeManager;

    mapping(address => mapping(address => mapping(bool => address)))
        public getPair;
    mapping(address => bool) public isPair; // simplified check if its a pair, given that `stable` flag might not be available in peripherals
    mapping(address => bool) private _privileged;

    address[] public allPairs;

    mapping(address => bool) public pairManagers;
    mapping(address => bool) public whitelistedAMO;

    event PairCreated(
        address indexed token0,
        address indexed token1,
        bool stable,
        address pair,
        uint256
    );
    event PrivilegedAccountStatusUpdated(address indexed account, bool _added);
    event UpdateAmoStatus(address indexed owner, bool isActive);
    event PairManagerUpdated(address indexed manager, bool isActive);

    modifier onlyFeeManager() {
        require(_msgSender() == feeManager);
        _;
    }

    modifier onlyPairManager() {
        require(pairManagers[_msgSender()], "!pairManager");
        _;
    }

    function initialize(address _pairImplementation) public initializer {
        __Ownable_init();
        pairImplementation = _pairImplementation;
        feeManager = _msgSender();
        pairManagers[_msgSender()] = true;

        stableFee = 0.1 * 10 ** 16; // 0.1%
        volatileFee = 0.3 * 10 ** 16; // 0.3%
    }

    function pause() external whenNotPaused onlyOwner {
        _pause();
    }

    function unpause() external whenPaused onlyOwner {
        _unpause();
    }

    function isPrivileged(address _account) external view returns (bool) {
        return _privileged[_account];
    }

    function isAMO(address _amo) external view returns (bool) {
        return whitelistedAMO[_amo];
    }

    function setPairImplementationAddress(
        address _pairImplementation
    ) public onlyOwner {
        pairImplementation = _pairImplementation;
    }

    function updatePairFees() external {
        for (uint i = allPairs.length; i != 0; ) {
            unchecked {
                --i;
            }
            updatePairFees(allPairs[i]);
        }
    }

    function updatePairFees(address pair) public onlyOwner {
        (bool success, bytes memory data) = pair.call(
            abi.encodeWithSignature("migratePairFees()")
        );
        require(success && data.length == 0, "fee migration failed");
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    function pairs() external view returns (address[] memory) {
        return allPairs;
    }

    function setFeeManager(address _feeManager) external onlyFeeManager {
        pendingFeeManager = _feeManager;
    }

    function acceptFeeManager() external {
        require(_msgSender() == pendingFeeManager);
        feeManager = pendingFeeManager;
    }

    function setFee(bool _stable, uint256 _fee) external onlyFeeManager {
        require(_fee <= MAX_FEE, "MF");
        require(_fee != 0);
        if (_stable) {
            stableFee = _fee;
        } else {
            volatileFee = _fee;
        }
    }

    function updatePairManager(
        address _pairManager,
        bool _isActive
    ) external onlyOwner {
        require(pairManagers[_pairManager] != _isActive);
        pairManagers[_pairManager] = _isActive;
        emit PairManagerUpdated(_pairManager, _isActive);
    }

    function updatePrivilegedAccount(
        address _account,
        bool _addToPrivileged
    ) external onlyFeeManager {
        require(_privileged[_account] != _addToPrivileged);
        _privileged[_account] = _addToPrivileged;
        emit PrivilegedAccountStatusUpdated(_account, _addToPrivileged);
    }

    function updateAmoAccount(
        address _amo,
        bool _isActive
    ) external onlyFeeManager {
        whitelistedAMO[_amo] = _isActive;
        emit UpdateAmoStatus(_amo, _isActive);
    }

    function getFee(bool _stable) public view returns (uint256) {
        return _stable ? stableFee : volatileFee;
    }

    function getFeeAmount(
        bool _stable,
        uint256 _amount,
        address _account
    ) external view returns (uint256) {
        if (_privileged[_account]) return 0;
        return getFee(_stable).mulDiv(_amount, FEE_PRECISION);
    }

    function createPair(
        address tokenA,
        address tokenB,
        bool stable
    ) external onlyPairManager returns (address pair) {
        require(tokenA != tokenB, "IA"); // Pair: IDENTICAL_ADDRESSES
        (address token0, address token1) = tokenA < tokenB
            ? (tokenA, tokenB)
            : (tokenB, tokenA);
        require(token0 != address(0), "ZA"); // Pair: ZERO_ADDRESS
        require(getPair[token0][token1][stable] == address(0), "PE"); // Pair: PAIR_EXISTS - single check is sufficient
        bytes32 salt = keccak256(abi.encodePacked(token0, token1, stable)); // notice salt includes stable as well, 3 parameters
        pair = pairImplementation.cloneDeterministic(salt);
        IPair(pair).initialize(token0, token1, stable);
        getPair[token0][token1][stable] = pair;
        getPair[token1][token0][stable] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        isPair[pair] = true;
        emit PairCreated(token0, token1, stable, pair, allPairs.length);
    }
}
