//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.24;

// Interface for the entry point contract
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
// Implementation of the Wallet contract
import {Wallet} from "./Wallet.sol";
// Implementation of a proxy contract that can make delegate call to a  upgradeable contract
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
// Create2 is a library from OpenZeppelin that helps in generating counterfactual addresses using CREATE2 opcode
import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";

contract WalletFactory {
    Wallet public immutable walletImplementation;

    constructor(IEntryPoint entryPoint) {
        walletImplementation = new Wallet(entryPoint, address(this));
    }

    // Function to generate the counterfactual address of the proxy contract
    function getProxyAddress(address owner, uint256 salt) public view returns (address) {
        // Encode the initialize function in our wallet with the owner as the argument
        bytes memory walletInit = abi.encodeCall(Wallet.initialize, owner);
        // Encode the proxyContract's constructor arguments which include the address walletImplementation and the walletInit
        bytes memory proxyConstructor = abi.encode(
            address(walletImplementation),
            walletInit
        );
        // Encode the creation code for ERC1967Proxy along with the encoded proxyConstructor data
        bytes memory bytecode = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            proxyConstructor
        );
        // Compute the keccak256 hash of the bytecode generated
        bytes32 bytecodeHash = keccak256(bytecode);
        // Use the hash and the salt to compute the counterfactual address of the proxy
        return Create2.computeAddress(bytes32(salt), bytecodeHash);
    }

    // Function to deploy a new Wallet contract
    function createAccount(address owner, uint256 salt) external returns (Wallet) {
        // Get the counterfactual address
        address addr = getProxyAddress(owner, salt);
        // Check if the code at the counterfactual address is non-empty
        uint256 codeSize = addr.code.length;
        if (codeSize > 0) {
            // If the code is non-empty, i.e. account already deployed, return the Wallet at the counterfactual address
            return Wallet(payable(addr));
        }

        // If the code is empty, deploy a new Wallet
        bytes memory walletInit = abi.encodeCall(Wallet.initialize, owner);
        ERC1967Proxy proxy = new ERC1967Proxy{salt: bytes32(salt)}(
            address(walletImplementation),
            walletInit
        );

        // Return the newly deployed Wallet
        return Wallet(payable(address(proxy)));
    }
}