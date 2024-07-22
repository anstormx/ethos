// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {Wallet} from "./Wallet.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";

/// @title WalletFactory
/// @notice A factory contract for creating and managing Wallet instances
/// @dev This contract uses the ERC1967 proxy pattern for upgradeable wallets
contract WalletFactory {
    /// @notice The implementation contract for all Wallet instances
    Wallet public immutable walletImplementation;

    /// @notice Initializes the WalletFactory with an EntryPoint contract
    /// @param entryPoint The address of the EntryPoint contract
    constructor(IEntryPoint entryPoint) {
        walletImplementation = new Wallet(entryPoint, address(this));
    }

    /// @notice Computes the counterfactual address of a Wallet proxy
    /// @param owner The address of the wallet owner
    /// @param salt A unique value to ensure a unique address
    /// @return The computed address of the Wallet proxy
    function getProxyAddress(address owner, uint256 salt) public view returns (address) {
        bytes memory walletInit = abi.encodeCall(Wallet.initialize, owner);
        bytes memory proxyConstructor = abi.encode(
            address(walletImplementation),
            walletInit
        );
        bytes memory bytecode = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            proxyConstructor
        );
        bytes32 bytecodeHash = keccak256(bytecode);
        return Create2.computeAddress(bytes32(salt), bytecodeHash);
    }

    /// @notice Creates a new Wallet instance or returns an existing one
    /// @param owner The address of the wallet owner
    /// @param salt A unique value to ensure a unique address
    /// @return The Wallet instance (new or existing)
    function createAccount(address owner, uint256 salt) external returns (Wallet) {
        address addr = getProxyAddress(owner, salt);
        uint256 codeSize = addr.code.length;
        
        if (codeSize > 0) {
            return Wallet(payable(addr));
        }

        bytes memory walletInit = abi.encodeCall(Wallet.initialize, owner);
        ERC1967Proxy proxy = new ERC1967Proxy{salt: bytes32(salt)}(
            address(walletImplementation),
            walletInit
        );

        return Wallet(payable(address(proxy)));
    }
}