// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IReceiver} from "./interfaces/IReceiver.sol";

/// @title SafeguardController - Automated circuit breaker triggered by CRE risk workflows
contract SafeguardController is IReceiver {
    enum SafeguardAction { PAUSE, LIMIT, EMERGENCY }
    enum Status { ACTIVE, PAUSED, LIMITED, EMERGENCY }

    struct SafeguardEvent {
        uint256 riskScore;
        uint256 triggerTimestamp;
        SafeguardAction action;
        uint256 executedAt;
    }

    Status public currentStatus;
    SafeguardEvent[] public safeguardHistory;
    address public forwarder;
    address public owner;

    // Protocols that can be paused
    mapping(address => bool) public registeredProtocols;

    event SafeguardTriggered(SafeguardAction action, uint256 riskScore, uint256 timestamp);
    event StatusChanged(Status oldStatus, Status newStatus);
    event ProtocolRegistered(address protocol);

    modifier onlyForwarder() {
        require(msg.sender == forwarder, "Only forwarder");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _forwarder) {
        forwarder = _forwarder;
        owner = msg.sender;
        currentStatus = Status.ACTIVE;
    }

    function onReport(bytes calldata metadata, bytes calldata report) external onlyForwarder {
        (uint256 riskScore, uint256 triggerTimestamp, uint8 action) =
            abi.decode(report, (uint256, uint256, uint8));

        SafeguardAction safeguardAction = SafeguardAction(action);
        Status oldStatus = currentStatus;

        if (safeguardAction == SafeguardAction.EMERGENCY) {
            currentStatus = Status.EMERGENCY;
        } else if (safeguardAction == SafeguardAction.LIMIT) {
            currentStatus = Status.LIMITED;
        } else {
            currentStatus = Status.PAUSED;
        }

        safeguardHistory.push(SafeguardEvent({
            riskScore: riskScore,
            triggerTimestamp: triggerTimestamp,
            action: safeguardAction,
            executedAt: block.timestamp
        }));

        emit SafeguardTriggered(safeguardAction, riskScore, triggerTimestamp);
        emit StatusChanged(oldStatus, currentStatus);
    }

    function resetStatus() external onlyOwner {
        Status oldStatus = currentStatus;
        currentStatus = Status.ACTIVE;
        emit StatusChanged(oldStatus, Status.ACTIVE);
    }

    function registerProtocol(address protocol) external onlyOwner {
        registeredProtocols[protocol] = true;
        emit ProtocolRegistered(protocol);
    }

    function getSafeguardHistory() external view returns (SafeguardEvent[] memory) {
        return safeguardHistory;
    }

    function setForwarder(address _forwarder) external onlyOwner {
        forwarder = _forwarder;
    }
}
