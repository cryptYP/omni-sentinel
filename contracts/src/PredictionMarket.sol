// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IReceiver} from "./interfaces/IReceiver.sol";

/// @title PredictionMarket - DeFi risk prediction markets settled by CRE + AI
/// @notice Users bet on protocol safety events, settled via Chainlink CRE workflows
contract PredictionMarket is IReceiver {
    struct Market {
        uint256 id;
        string question;
        uint256 deadline;
        uint256 totalYesStake;
        uint256 totalNoStake;
        bool resolved;
        bool outcome;
        uint256 confidence;
        uint256 settlementTimestamp;
    }

    struct Position {
        uint256 yesStake;
        uint256 noStake;
        bool claimed;
    }

    // State
    uint256 public nextMarketId;
    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Position)) public positions;
    mapping(address => bool) public worldIdVerified;

    // Access control
    address public forwarder;
    address public owner;
    address public worldIdVerifier;

    // Events
    event MarketCreated(uint256 indexed marketId, string question, uint256 deadline);
    event SettlementRequested(uint256 indexed marketId, string question, uint256 deadline);
    event MarketSettled(uint256 indexed marketId, bool outcome, uint256 confidence);
    event PositionTaken(uint256 indexed marketId, address indexed user, bool isYes, uint256 amount);
    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 amount);

    modifier onlyForwarder() {
        require(msg.sender == forwarder, "Only forwarder");
        _;
    }

    modifier onlyVerifiedHuman() {
        require(worldIdVerified[msg.sender], "World ID verification required");
        _;
    }

    constructor(address _forwarder, address _worldIdVerifier) {
        forwarder = _forwarder;
        worldIdVerifier = _worldIdVerifier;
        owner = msg.sender;
    }

    /// @notice Mark address as World ID verified (called by WorldIDVerifier contract)
    function setVerified(address user) external {
        require(msg.sender == worldIdVerifier || msg.sender == owner, "Not authorized");
        worldIdVerified[user] = true;
    }

    /// @notice Create a new prediction market
    function createMarket(string calldata question, uint256 deadline) external returns (uint256) {
        require(deadline > block.timestamp, "Deadline must be in future");

        uint256 marketId = nextMarketId++;
        markets[marketId] = Market({
            id: marketId,
            question: question,
            deadline: deadline,
            totalYesStake: 0,
            totalNoStake: 0,
            resolved: false,
            outcome: false,
            confidence: 0,
            settlementTimestamp: 0
        });

        emit MarketCreated(marketId, question, deadline);
        return marketId;
    }

    /// @notice Take a position (Yes or No) — requires World ID
    function takePosition(uint256 marketId, bool isYes) external payable onlyVerifiedHuman {
        Market storage market = markets[marketId];
        require(!market.resolved, "Market already resolved");
        require(block.timestamp < market.deadline, "Market deadline passed");
        require(msg.value > 0, "Must stake ETH");

        Position storage pos = positions[marketId][msg.sender];

        if (isYes) {
            pos.yesStake += msg.value;
            market.totalYesStake += msg.value;
        } else {
            pos.noStake += msg.value;
            market.totalNoStake += msg.value;
        }

        emit PositionTaken(marketId, msg.sender, isYes, msg.value);
    }

    /// @notice Request settlement — emits event that triggers CRE workflow
    function requestSettlement(uint256 marketId) external {
        Market storage market = markets[marketId];
        require(!market.resolved, "Already resolved");
        require(block.timestamp >= market.deadline, "Deadline not reached");

        emit SettlementRequested(marketId, market.question, market.deadline);
    }

    /// @notice Called by CRE Forwarder with AI settlement result
    function onReport(bytes calldata metadata, bytes calldata report) external onlyForwarder {
        (uint256 marketId, bool outcome, uint256 confidence, uint256 timestamp) =
            abi.decode(report, (uint256, bool, uint256, uint256));

        Market storage market = markets[marketId];
        require(!market.resolved, "Already resolved");

        market.resolved = true;
        market.outcome = outcome;
        market.confidence = confidence;
        market.settlementTimestamp = timestamp;

        emit MarketSettled(marketId, outcome, confidence);
    }

    /// @notice Claim winnings after market resolution
    function claimWinnings(uint256 marketId) external {
        Market storage market = markets[marketId];
        require(market.resolved, "Market not resolved");

        Position storage pos = positions[marketId][msg.sender];
        require(!pos.claimed, "Already claimed");
        pos.claimed = true;

        uint256 totalPool = market.totalYesStake + market.totalNoStake;
        uint256 winningPool = market.outcome ? market.totalYesStake : market.totalNoStake;
        uint256 userStake = market.outcome ? pos.yesStake : pos.noStake;

        if (userStake > 0 && winningPool > 0) {
            uint256 payout = (userStake * totalPool) / winningPool;
            (bool sent, ) = payable(msg.sender).call{value: payout}("");
            require(sent, "Transfer failed");
            emit WinningsClaimed(marketId, msg.sender, payout);
        }
    }

    /// @notice Get full market data
    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    /// @notice Get user position for a market
    function getPosition(uint256 marketId, address user) external view returns (Position memory) {
        return positions[marketId][user];
    }
}
