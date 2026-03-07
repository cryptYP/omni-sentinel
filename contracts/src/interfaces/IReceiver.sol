// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Interface that CRE consumer contracts must implement
/// @dev The Chainlink Forwarder calls onReport() to deliver workflow data
interface IReceiver {
    function onReport(bytes calldata metadata, bytes calldata report) external;
}
