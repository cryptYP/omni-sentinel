// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/RiskOracle.sol";
import "../src/PredictionMarket.sol";
import "../src/SafeguardController.sol";
import "../src/WorldIDVerifier.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address forwarder = vm.envAddress("CRE_FORWARDER_ADDRESS");
        address worldIdContract = vm.envAddress("WORLD_ID_CONTRACT");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy RiskOracle
        RiskOracle riskOracle = new RiskOracle(forwarder);
        console.log("RiskOracle deployed at:", address(riskOracle));

        // Deploy SafeguardController
        SafeguardController safeguard = new SafeguardController(forwarder);
        console.log("SafeguardController deployed at:", address(safeguard));

        // Deploy PredictionMarket (worldIdVerifier set later)
        PredictionMarket market = new PredictionMarket(forwarder, address(0));
        console.log("PredictionMarket deployed at:", address(market));

        // Deploy WorldIDVerifier pointing to PredictionMarket
        WorldIDVerifier worldIdVerifier = new WorldIDVerifier(
            worldIdContract,
            1, // groupId
            "app_omni_sentinel",
            "verify_human",
            address(market)
        );
        console.log("WorldIDVerifier deployed at:", address(worldIdVerifier));

        vm.stopBroadcast();

        // Log addresses for CRE workflow config
        console.log("---");
        console.log("Update your CRE workflow configs and frontend .env with these addresses.");
    }
}
