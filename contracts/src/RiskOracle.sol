// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IReceiver} from "./interfaces/IReceiver.sol";

/// @title RiskOracle - Receives AI-generated risk scores from CRE workflows
/// @notice Implements IReceiver to accept signed reports from Chainlink CRE
contract RiskOracle is IReceiver {
    struct RiskScore {
        uint256 riskScore;
        uint256 timestamp;
        bytes32 protocolId;
    }

    // State
    RiskScore public latestScore;
    uint256 public updateCount;
    mapping(bytes32 => RiskScore) public protocolScores;
    mapping(bytes32 => RiskScore[]) public scoreHistory;

    // Access control
    address public forwarder;
    address public owner;

    // Events
    event RiskScoreUpdated(bytes32 indexed protocolId, uint256 riskScore, uint256 timestamp);
    event SafeguardAlert(bytes32 indexed protocolId, uint256 riskScore, string severity);

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
    }

    /// @notice Called by CRE Forwarder to deliver risk score reports
    function onReport(bytes calldata metadata, bytes calldata report) external onlyForwarder {
        RiskScore memory score = abi.decode(report, (RiskScore));

        latestScore = score;
        protocolScores[score.protocolId] = score;
        scoreHistory[score.protocolId].push(score);
        updateCount++;

        emit RiskScoreUpdated(score.protocolId, score.riskScore, score.timestamp);

        // Emit severity alerts
        if (score.riskScore > 90) {
            emit SafeguardAlert(score.protocolId, score.riskScore, "CRITICAL");
        } else if (score.riskScore > 75) {
            emit SafeguardAlert(score.protocolId, score.riskScore, "HIGH");
        } else if (score.riskScore > 50) {
            emit SafeguardAlert(score.protocolId, score.riskScore, "MEDIUM");
        }
    }

    function getLatestRiskScore() external view returns (uint256 score, uint256 timestamp) {
        return (latestScore.riskScore, latestScore.timestamp);
    }

    function getScoreHistory(bytes32 protocolId) external view returns (RiskScore[] memory) {
        return scoreHistory[protocolId];
    }

    function setForwarder(address _forwarder) external onlyOwner {
        forwarder = _forwarder;
    }
}
