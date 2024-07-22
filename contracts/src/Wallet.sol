// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IEntryPoint} from "account-abstraction/interfaces/IEntryPoint.sol";
import {BaseAccount} from "account-abstraction/core/BaseAccount.sol";
import {PackedUserOperation} from "account-abstraction/interfaces/PackedUserOperation.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {TokenCallbackHandler} from "account-abstraction/samples/callback/TokenCallbackHandler.sol";
import {SIG_VALIDATION_FAILED, SIG_VALIDATION_SUCCESS} from "account-abstraction/core/Helpers.sol";

/**
 * @title Wallet
 * @dev Implementation of a simple ERC-4337 compatible wallet.
 */
contract Wallet is
    BaseAccount,
    Ownable,
    UUPSUpgradeable,
    TokenCallbackHandler,
    Initializable
{
    IEntryPoint private immutable _entryPoint;
    address public immutable walletFactory;

    event DepositAdded(address indexed sender, uint256 amount);
    event DepositWithdrawn(uint256 amount);
    event UpgradeAuthorized(address indexed newImplementation);
    event OwnerChanged(address indexed newOwner);
    event UserOperationValidated(bytes32 indexed userOpHash, uint256 validationData);
    event PrefundPaid(uint256 missingAccountFunds);
    event WalletInitialized(IEntryPoint indexed entryPoint, address owner);
    event TransactionExecuted(
        address indexed destination,
        uint256 value,
        bytes functionData
    );

    /**
     * @dev Constructor to set immutable variables.
     * @param anEntryPoint The EntryPoint contract address.
     * @param ourWalletFactory The wallet factory contract address.
     */
    constructor(
        IEntryPoint anEntryPoint,
        address ourWalletFactory
    ) Ownable() {
        _entryPoint = anEntryPoint;
        walletFactory = ourWalletFactory;
        _disableInitializers();
    }

    /**
     * @dev Allows the contract to receive ETH.
     */
    receive() external payable {}

    /**
     * @dev Modifier to restrict access to EntryPoint or WalletFactory.
     */
    modifier _requireFromEntryPointOrFactory() {
        require(
            msg.sender == address(_entryPoint) || msg.sender == walletFactory,
            "ENTRYPOINT_OR_FACTORY_REQUIRED"
        );
        _;
    }

    /**
     * @dev Returns the EntryPoint contract.
     */
    function entryPoint() public view override returns (IEntryPoint) {
        return _entryPoint;
    }

    /**
     * @dev Authorizes an upgrade to a new implementation.
     * @param newImplementation Address of the new implementation.
     */
    function _authorizeUpgrade(
        address newImplementation
    ) internal view override _requireFromEntryPointOrFactory {
        emit UpgradeAuthorized(newImplementation);
    }

    function transferOwnership(address newOwner) public override onlyOwner {
        Ownable._transferOwnership(newOwner);
        emit OwnerChanged(newOwner);
    }

    /**
     * @dev Returns the deposit balance of this contract in the EntryPoint.
     */
    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    /**
     * @dev Adds to the deposit in the EntryPoint.
     */
    function addDeposit() public payable {
        entryPoint().depositTo{value: msg.value}(address(this));
        emit DepositAdded(msg.sender, msg.value);
    }

    /**
     * @dev Withdraws from the deposit in the EntryPoint.
     * @param amount The amount to withdraw.
     */
    function withdrawDeposit(uint256 amount) public onlyOwner {
        entryPoint().withdrawFrom(address(this), amount);
        emit DepositWithdrawn(amount);
    }

    /**
     * @dev Internal function to initialize the wallet.
     * @param initialOwner The address of the initial owner.
     */
    function _initialize(address initialOwner) internal {
        require(initialOwner != address(0), "OWNER_REQUIRED");
        Ownable._transferOwnership(initialOwner);
        emit WalletInitialized(_entryPoint, initialOwner);
    }

    /**
     * @dev Initializes the wallet with the initial owner.
     * @param initialOwner The address of the initial owner.
     */
    function initialize(address initialOwner) external initializer {
        _initialize(initialOwner);
    } 

    /**
     * @dev Validates the user operation.
     * @param userOp The user operation to validate.
     * @param userOpHash The hash of the user operation.
     * @param missingAccountFunds The missing funds for this operation.
     * @return validationData The result of the validation.
     */
    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    )
        external
        _requireFromEntryPointOrFactory
        returns (uint256 validationData)
    {
        validationData = _validateSignature(userOp, userOpHash);
        _payPrefund(missingAccountFunds);
        emit UserOperationValidated(userOpHash, validationData);
    }

    /**
     * @dev Executes a transaction.
     * @param dest The destination address for the transaction.
     * @param value The amount of ETH to send.
     * @param functionData The function data to execute.
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata functionData
    ) external _requireFromEntryPointOrFactory {
        (bool success, bytes memory result) = dest.call{value: value}(
            functionData
        );
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
        emit TransactionExecuted(dest, value, functionData);
    }

    /**
     * @dev Validates the signature of a user operation.
     * @param userOp The user operation to validate.
     * @param userOpHash The hash of the user operation.
     * @return validationData The result of the validation.
     */
    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view returns (uint256 validationData) {
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(
            userOpHash
        );
        address signer = ECDSA.recover(ethSignedMessageHash, userOp.signature);
        return
            signer == owner() ? SIG_VALIDATION_SUCCESS : SIG_VALIDATION_FAILED;
    }

    /**
     * @dev Pays the prefund if necessary.
     * @param missingAccountFunds The amount of missing funds to prefund.
     */
    function _payPrefund(uint256 missingAccountFunds) internal {
        if (missingAccountFunds > 0) {
            (bool success, ) = payable(msg.sender).call{
                value: missingAccountFunds,
                gas: type(uint256).max
            }("");
            require(success, "PREFUND_PAYMENT_FAILED");
            emit PrefundPaid(missingAccountFunds);
        }
    }
}
