// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/PredictionMarket.sol";

contract PredictionMarketTest is Test {
    PredictionMarket public market;
    address public forwarder = address(0x1);
    address public worldIdVerifier = address(0x2);
    address public alice = address(0xA);
    address public bob = address(0xB);

    function setUp() public {
        market = new PredictionMarket(forwarder, worldIdVerifier);

        // Verify users via owner
        market.setVerified(alice);
        market.setVerified(bob);
    }

    function test_createMarket() public {
        uint256 deadline = block.timestamp + 1 days;
        uint256 marketId = market.createMarket("Will Aave maintain >110% CR?", deadline);
        assertEq(marketId, 0);

        PredictionMarket.Market memory m = market.getMarket(0);
        assertEq(m.deadline, deadline);
        assertFalse(m.resolved);
    }

    function test_takePosition() public {
        uint256 deadline = block.timestamp + 1 days;
        market.createMarket("Test question", deadline);

        vm.deal(alice, 1 ether);
        vm.prank(alice);
        market.takePosition{value: 0.5 ether}(0, true);

        vm.deal(bob, 1 ether);
        vm.prank(bob);
        market.takePosition{value: 0.3 ether}(0, false);

        PredictionMarket.Market memory m = market.getMarket(0);
        assertEq(m.totalYesStake, 0.5 ether);
        assertEq(m.totalNoStake, 0.3 ether);
    }

    function test_takePosition_requiresWorldId() public {
        market.createMarket("Test", block.timestamp + 1 days);

        address unverified = address(0xC);
        vm.deal(unverified, 1 ether);
        vm.prank(unverified);
        vm.expectRevert("World ID verification required");
        market.takePosition{value: 0.1 ether}(0, true);
    }

    function test_settlement() public {
        uint256 deadline = block.timestamp + 1 days;
        market.createMarket("Test question", deadline);

        vm.deal(alice, 1 ether);
        vm.prank(alice);
        market.takePosition{value: 0.5 ether}(0, true);

        vm.deal(bob, 1 ether);
        vm.prank(bob);
        market.takePosition{value: 0.3 ether}(0, false);

        // Settle — outcome = Yes
        bytes memory report = abi.encode(uint256(0), true, uint256(9500), block.timestamp);
        vm.prank(forwarder);
        market.onReport("", report);

        PredictionMarket.Market memory m = market.getMarket(0);
        assertTrue(m.resolved);
        assertTrue(m.outcome);
        assertEq(m.confidence, 9500);
    }

    function test_claimWinnings() public {
        uint256 deadline = block.timestamp + 1 days;
        market.createMarket("Test", deadline);

        vm.deal(alice, 1 ether);
        vm.prank(alice);
        market.takePosition{value: 0.5 ether}(0, true); // Yes

        vm.deal(bob, 1 ether);
        vm.prank(bob);
        market.takePosition{value: 0.5 ether}(0, false); // No

        // Settle as Yes
        vm.prank(forwarder);
        market.onReport("", abi.encode(uint256(0), true, uint256(9000), block.timestamp));

        // Alice (winner) claims — should get full pool (1 ETH)
        uint256 balanceBefore = alice.balance;
        vm.prank(alice);
        market.claimWinnings(0);
        assertEq(alice.balance - balanceBefore, 1 ether);

        // Bob (loser) claims — should get nothing
        uint256 bobBefore = bob.balance;
        vm.prank(bob);
        market.claimWinnings(0);
        assertEq(bob.balance, bobBefore);
    }

    function test_requestSettlement_beforeDeadline_reverts() public {
        market.createMarket("Test", block.timestamp + 1 days);
        vm.expectRevert("Deadline not reached");
        market.requestSettlement(0);
    }

    function test_requestSettlement_afterDeadline() public {
        uint256 deadline = block.timestamp + 1 days;
        market.createMarket("Test", deadline);

        vm.warp(deadline + 1);
        market.requestSettlement(0); // Should emit SettlementRequested
    }
}
