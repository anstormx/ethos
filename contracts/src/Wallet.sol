// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.19;

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
    address[] public owners;


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


    event WalletInitialized(IEntryPoint indexed entryPoint, address[] owners);


    // Fallback function to accept ether
    receive() external payable {}


    function entryPoint() public view override returns (IEntryPoint) {
        return _entryPoint;
    }

    // Function to upgrade the contract
    function _authorizeUpgrade(address) internal view override _requireFromEntryPointOrFactory {}

    // Function to encode the signatures in a bytes array
    function encodeSignatures(bytes[] memory signatures) public pure returns (bytes memory) {
        return abi.encode(signatures);
    }

    // Check the balance of the wallet
    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    // Deposit ether for the wallet to entry point
    function addDeposit() public payable {
        entryPoint().depositTo{value: msg.value}(address(this));
    }
        
    // Initialize the wallet with the owners once
    function _initialize(address[] memory initialOwners) internal {
        require(initialOwners.length > 0, "Owners cannot be empty");
        owners = initialOwners;
        emit WalletInitialized(_entryPoint, initialOwners);
    }

    // Initialize the wallet with the owners once
    function initialize(address[] memory initialOwners) public initializer {
        _initialize(initialOwners);
    }

    function _validateSignature(
        PackedUserOperation calldata userOp, // UserOperation data structure passed as input
        bytes32 userOpHash // Hash of the UserOperation without the signatures
    ) internal view override returns (uint256) {
        // Convert the userOpHash to an Ethereum Signed Message Hash
        bytes32 hash = userOpHash.toEthSignedMessageHash();

        // Decode the signatures from the userOp and store them in a bytes array in memory
        bytes[] memory signatures = abi.decode(userOp.signature, (bytes[]));

        // Loop through all the owners of the wallet
        for (uint256 i = 0; i < owners.length; i++) {
            // Recover the signer's address from each signature
            // If the recovered address doesn't match the owner's address, return SIG_VALIDATION_FAILED
            if (owners[i] != hash.recover(signatures[i])) {
                return 1;
            }
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