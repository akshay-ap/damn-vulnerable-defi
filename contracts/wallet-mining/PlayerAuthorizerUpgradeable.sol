// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "hardhat/console.sol";

/**
 * @title PlayerAuthorizerUpgradeable
 * @author Akshay Patel
 */
contract PlayerAuthorizerUpgradeable is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    mapping(address => mapping(address => uint256)) private wards;

    event Rely(address indexed usr, address aim);

    function init(
        address[] memory _wards,
        address[] memory _aims
    ) external initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();

        for (uint256 i = 0; i < _wards.length; ) {
            _rely(_wards[i], _aims[i]);
            unchecked {
                i++;
            }
        }
    }

    function _rely(address usr, address aim) private {
        wards[usr][aim] = 1;
        emit Rely(usr, aim);
    }

    function can(address usr, address aim) external view returns (bool) {
        console.log("can in auth", msg.sender, owner());
        console.log(usr, aim);

        console.logBool(wards[usr][aim] == 1);
        return wards[usr][aim] == 1;
    }

    function upgradeToAndCall(
        address imp,
        bytes memory wat
    ) external payable override {
        _authorizeUpgrade(imp);
        _upgradeToAndCallUUPS(imp, wat, true);
    }

    function _authorizeUpgrade(address imp) internal override onlyOwner {}
}
