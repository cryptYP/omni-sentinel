// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/RiskOracle.sol";

contract RiskOracleTest is Test {
    RiskOracle public oracle;
    address public forwarder = address(0x1);
    address public owner;

    function setUp() public {
        owner = address(this);
        oracle = new RiskOracle(forwarder);
    }

    function test_onReport_updatesLatestScore() public {
        bytes32 protocolId = bytes32(uint256(1));
        RiskOracle.RiskScore memory score = RiskOracle.RiskScore({
            riskScore: 75,
            timestamp: block.timestamp,
            protocolId: protocolId
        });

        bytes memory report = abi.encode(score);
        bytes memory metadata = "";

        vm.prank(forwarder);
        oracle.onReport(metadata, report);

        (uint256 riskScore, uint256 timestamp) = oracle.getLatestRiskScore();
        assertEq(riskScore, 75);
        assertEq(timestamp, block.timestamp);
        assertEq(oracle.updateCount(), 1);
    }

    function test_onReport_revertsIfNotForwarder() public {
        bytes memory report = abi.encode(RiskOracle.RiskScore(50, block.timestamp, bytes32(0)));
        vm.expectRevert("Only forwarder");
        oracle.onReport("", report);
    }

    function test_onReport_emitsSafeguardAlert() public {
        bytes32 protocolId = bytes32(uint256(1));
        RiskOracle.RiskScore memory score = RiskOracle.RiskScore({
            riskScore: 95,
            timestamp: block.timestamp,
            protocolId: protocolId
        });

        vm.prank(forwarder);
        vm.expectEmit(true, false, false, true);
        emit RiskOracle.SafeguardAlert(protocolId, 95, "CRITICAL");
        oracle.onReport("", abi.encode(score));
    }

    function test_scoreHistory() public {
        bytes32 protocolId = bytes32(uint256(1));

        for (uint256 i = 1; i <= 3; i++) {
            vm.prank(forwarder);
            oracle.onReport("", abi.encode(RiskOracle.RiskScore(i * 10, block.timestamp + i, protocolId)));
        }

        RiskOracle.RiskScore[] memory history = oracle.getScoreHistory(protocolId);
        assertEq(history.length, 3);
        assertEq(history[0].riskScore, 10);
        assertEq(history[2].riskScore, 30);
    }

    function test_setForwarder() public {
        address newForwarder = address(0x2);
        oracle.setForwarder(newForwarder);

        // Old forwarder should fail
        vm.prank(forwarder);
        vm.expectRevert("Only forwarder");
        oracle.onReport("", abi.encode(RiskOracle.RiskScore(50, block.timestamp, bytes32(0))));

        // New forwarder should work
        vm.prank(newForwarder);
        oracle.onReport("", abi.encode(RiskOracle.RiskScore(50, block.timestamp, bytes32(0))));
    }
}
