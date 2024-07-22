//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.24;

// Entry point interface
import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
// Basic account implementation for a smart contract wallet
import {BaseAccount} from "account-abstraction/core/BaseAccount.sol"; 
// Structs and functions for user operations
import {PackedUserOperation} from "account-abstraction/interfaces/PackedUserOperation.sol"; 
// Used to verify signatures
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
// Used to hash messages
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
// Used to initialize the contract
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
// Used to upgrade the contract
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
// Enables the handling of various token types
import {TokenCallbackHandler} from "account-abstraction/samples/callback/TokenCallbackHandler.sol";


contract Wallet is BaseAccount, Initializable, UUPSUpgradeable, TokenCallbackHandler{

    // Allow bytes32 to use functions from ECDSA and MessageHashUtils
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;


    // WalletFactory contract address
    address public immutable walletFactory; 
    // Entry point contract address
    IEntryPoint private immutable _entryPoint;
    // Owners of the wallet
    address public owner;


    // Modifier to restrict access to the entry point or wallet factory
    modifier _requireFromEntryPointOrFactory() {
        require(
            msg.sender == address(_entryPoint) || msg.sender == walletFactory,
            "Only entry point or factory can call this function"
        );
        _;
    }


    constructor(IEntryPoint anEntryPoint, address ourWalletFactory) {
        _entryPoint = anEntryPoint;
        walletFactory = ourWalletFactory;
    }


    event WalletInitialized(IEntryPoint indexed entryPoint, address owner);


    // Fallback function to accept ether
    receive() external payable {}


    // Function to get the entry point contract
    function entryPoint() public view override returns (IEntryPoint) {
        return _entryPoint;
    }

    // Function to upgrade the contract
    function _authorizeUpgrade(address) internal view override _requireFromEntryPointOrFactory {}

    // Function to encode the signature
    function encodeSignatures(bytes memory signature) public pure returns (bytes memory) {
        return abi.encode(signature);
    }

    // Check the balance of the wallet
    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    // Deposit ether for the wallet to entry point
    function addDeposit() public payable {
        entryPoint().depositTo{value: msg.value}(address(this));
    }
        
    // Initialize the wallet with the owner once
    function _initialize(address initialOwner) internal {
        require(initialOwner != address(0), "Owner cannot be zero address");
        owner = initialOwner;
        emit WalletInitialized(_entryPoint, initialOwner);
    }

    // Initialize the wallet with the owner once
    function initialize(address initialOwner) public initializer {
        _initialize(initialOwner);
    }

    function _validateSignature(
        PackedUserOperation calldata userOp, // UserOperation data structure passed as input
        bytes32 userOpHash // Hash of the UserOperation without the signatures
    ) internal view override returns (uint256) {
        // Convert the userOpHash to an Ethereum Signed Message Hash
        bytes32 hash = userOpHash.toEthSignedMessageHash();

        // Decode the signatures from the userOp and store them in a bytes array in memory
        bytes memory signature = abi.decode(userOp.signature, (bytes));

        // Recover the signer's address from signature
        // If the recovered address doesn't match the owner's address, return SIG_VALIDATION_FAILED
        if (owner != hash.recover(signature)) {
            return 1;
        }
        
        // If all signatures are valid return 0
        return 0;
    }

    // Call the target contract address with amount of ether to send (value) and data payload (function signature and arguments)
    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                // The assembly code here skips the first 32 bytes of the result, which contains the length of data.
                // It then loads the actual error message using mload and calls revert with this error message.
                revert(add(result, 32), mload(result))
            }
        }
    }
    
    // Execute a single transaction
    function execute(address dest, uint256 value, bytes calldata func) external _requireFromEntryPointOrFactory {
        _call(dest, value, func);
    }

    // Execute multiple transactions in a single batch
    function executeBatch(address[] calldata dests, uint256[] calldata values, bytes[] calldata funcs) external _requireFromEntryPointOrFactory {
        require(dests.length == funcs.length, "Wrong dests lengths");
        require(values.length == funcs.length, "Wrong values lengths");
        for (uint256 i = 0; i < dests.length; i++) {
            _call(dests[i], values[i], funcs[i]);
        }
    }
}