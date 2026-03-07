// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title WorldIDVerifier - Verifies World ID proofs for sybil resistance
/// @notice Integrates World ID proof verification to gate prediction market access
/// @dev Reference: https://docs.world.org/world-id/id/on-chain
interface IWorldID {
    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external view;
}

contract WorldIDVerifier {
    IWorldID public immutable worldId;
    uint256 public immutable groupId;
    uint256 public immutable externalNullifier;

    address public predictionMarket;
    address public owner;
    mapping(uint256 => bool) public usedNullifiers;

    event HumanVerified(address indexed user, uint256 nullifierHash);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(
        address _worldId,
        uint256 _groupId,
        string memory _appId,
        string memory _action,
        address _predictionMarket
    ) {
        worldId = IWorldID(_worldId);
        groupId = _groupId;
        externalNullifier = uint256(keccak256(abi.encodePacked(
            uint256(keccak256(abi.encodePacked(_appId))),
            _action
        )));
        predictionMarket = _predictionMarket;
        owner = msg.sender;
    }

    /// @notice Verify a World ID proof and mark user as human
    function verifyAndRegister(
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external {
        require(!usedNullifiers[nullifierHash], "Nullifier already used");

        worldId.verifyProof(
            root,
            groupId,
            uint256(keccak256(abi.encodePacked(signal))),
            nullifierHash,
            externalNullifier,
            proof
        );

        usedNullifiers[nullifierHash] = true;

        // Notify the prediction market that this address is verified
        (bool success, ) = predictionMarket.call(
            abi.encodeWithSignature("setVerified(address)", signal)
        );
        require(success, "Failed to set verified");

        emit HumanVerified(signal, nullifierHash);
    }

    function setPredictionMarket(address _predictionMarket) external onlyOwner {
        predictionMarket = _predictionMarket;
    }
}
