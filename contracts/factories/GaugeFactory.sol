// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";

import "../interfaces/IGauge.sol";
import "../interfaces/IGaugeFactory.sol";

contract GaugeFactory is IGaugeFactory, OwnableUpgradeable {
    UpgradeableBeacon public gaugeBeacon;

    address[] public gaugeAddress;
    address public last_gauge;
    address public gaugeImplementation;

    mapping(address => bool) public distributors;

    event GaugeImplementationChanged(address indexed gaugeALMImplementation);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _gaugeImplementation) public initializer {
        __Ownable_init();

        // create gauge Proxy and transfer ownership
        gaugeBeacon = new UpgradeableBeacon(_gaugeImplementation);
        gaugeImplementation = _gaugeImplementation;
    }

    function createGauge(
        address _rewardToken,
        address _ve,
        address _token,
        address _distribution,
        address _internal_bribe,
        address _external_bribe,
        bool _isPair
    ) external returns (address) {
        address gauge = address(
            new BeaconProxy(
                address(gaugeBeacon),
                abi.encodeWithSignature(
                    "initialize(address,address,address,address,address,address,bool)",
                    _rewardToken,
                    _ve,
                    _token,
                    _distribution,
                    _internal_bribe,
                    _external_bribe,
                    _isPair
                )
            )
        );

        last_gauge = gauge;
        gaugeAddress.push(gauge);

        return gauge;
    }

    /**
     * @notice Sets a new gauge CL implementation address
     * @dev This function can only be called by the owner of the contract.
     * @param _gaugeImplementation The address of the new gauge implementation.
     */
    function setGaugeImplementation(
        address _gaugeImplementation
    ) external onlyOwner {
        require(_gaugeImplementation != address(0), "zeroAddr");

        // upgrade the box implementation
        gaugeBeacon.upgradeTo(_gaugeImplementation);

        gaugeImplementation = _gaugeImplementation;
        emit GaugeImplementationChanged(_gaugeImplementation);
    }

    function setDistribution(
        address _gauge,
        address _newDistribution
    ) external onlyOwner {
        IGauge(_gauge).setDistribution(_newDistribution);
    }

    function whitelistDistributors(
        address _distributor,
        bool _isActive
    ) external onlyOwner {
        distributors[_distributor] = _isActive;
    }

    function isDistributor(address _distributor) external view returns (bool) {
        return distributors[_distributor];
    }
}
