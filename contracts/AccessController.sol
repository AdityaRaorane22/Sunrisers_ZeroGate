// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AccessController {
    struct Proof {
        uint[2] a;
        uint[2][2] b;
        uint[2] c;
    }

    mapping(bytes32 => bool) public usedNullifiers;
    mapping(uint => bool) public validRoots;
    
    bytes32 public currentRoot;
    uint public epochDuration = 15 minutes;
    
    event AccessGranted(bytes32 indexed nullifier, uint timestamp);
    event RootUpdated(bytes32 newRoot);

    function updateRoot(bytes32 _newRoot) external {
        currentRoot = _newRoot;
        validRoots[uint(_newRoot)] = true;
        emit RootUpdated(_newRoot);
    }

    function verifyAndExecute(
        Proof calldata proof,
        bytes32 nullifier,
        bytes32 actionId,
        uint epochTimestamp
    ) external returns (bool) {
        require(!usedNullifiers[nullifier], "Already used");
        require(block.timestamp <= epochTimestamp + epochDuration, "Proof expired");
        require(validRoots[uint(currentRoot)], "Invalid root");
        
        // Simplified verification (use real ZK verifier in production)
        bool verified = _mockVerify(proof, nullifier, actionId);
        require(verified, "Invalid proof");
        
        usedNullifiers[nullifier] = true;
        emit AccessGranted(nullifier, block.timestamp);
        
        return true;
    }

    function _mockVerify(
        Proof calldata,
        bytes32,
        bytes32
    ) private pure returns (bool) {
        // Replace with actual snarkjs verifier
        return true;
    }

    function checkAccess(bytes32 nullifier) external view returns (bool) {
        return usedNullifiers[nullifier];
    }
}