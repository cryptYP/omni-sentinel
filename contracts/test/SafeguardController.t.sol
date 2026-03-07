// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/SafeguardController.sol";

contract SafeguardControllerTest is Test {
    SafeguardController public safeguard;
    address public forwarder = address(0x1);

    function setUp() public {
        safeguard = new SafeguardController(forwarder);
    }

    function test_initialStatus() public view {
        assertEq(uint256(safeguard.currentStatus()), uint256(SafeguardController.Status.ACTIVE));
    }

    function test_onReport_pause() public {
        bytes memory report = abi.encode(uint256(60), block.timestamp, uint8(0)); // PAUSE
        vm.prank(forwarder);
        safeguard.onReport("", report);
        assertEq(uint256(safeguard.currentStatus()), uint256(SafeguardController.Status.PAUSED));
    }

    function test_onReport_limit() public {
        bytes memory report = abi.encode(uint256(80), block.timestamp, uint8(1)); // LIMIT
        vm.prank(forwarder);
        safeguard.onReport("", report);
        assertEq(uint256(safeguard.currentStatus()), uint256(SafeguardController.Status.LIMITED));
    }

    function test_onReport_emergency() public {
        bytes memory report = abi.encode(uint256(95), block.timestamp, uint8(2)); // EMERGENCY
        vm.prank(forwarder);
        safeguard.onReport("", report);
        assertEq(uint256(safeguard.currentStatus()), uint256(SafeguardController.Status.EMERGENCY));
    }

    function test_resetStatus() public {
        bytes memory report = abi.encode(uint256(95), block.timestamp, uint8(2));
        vm.prank(forwarder);
        safeguard.onReport("", report);

        safeguard.resetStatus();
        assertEq(uint256(safeguard.currentStatus()), uint256(SafeguardController.Status.ACTIVE));
    }

    function test_resetStatus_onlyOwner() public {
        vm.prank(address(0xBAD));
        vm.expectRevert("Only owner");
        safeguard.resetStatus();
    }

    function test_safeguardHistory() public {
        vm.prank(forwarder);
        safeguard.onReport("", abi.encode(uint256(60), block.timestamp, uint8(0)));
        vm.prank(forwarder);
        safeguard.onReport("", abi.encode(uint256(95), block.timestamp, uint8(2)));

        SafeguardController.SafeguardEvent[] memory history = safeguard.getSafeguardHistory();
        assertEq(history.length, 2);
        assertEq(history[0].riskScore, 60);
        assertEq(history[1].riskScore, 95);
    }
}
