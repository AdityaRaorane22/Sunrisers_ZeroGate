// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MerkleTreeRegistry {
    struct Tree {
        bytes32 root;
        uint depth;
        uint leafCount;
        uint tier;
    }

    mapping(uint => Tree) public trees;
    mapping(address => bool) public authorized;
    
    uint public treeCount;
    
    event TreeCreated(uint indexed treeId, bytes32 root, uint tier);
    event LeafAdded(uint indexed treeId, bytes32 commitment);

    modifier onlyAuthorized() {
        require(authorized[msg.sender], "Not authorized");
        _;
    }

    constructor() {
        authorized[msg.sender] = true;
    }

    function createTree(uint tier, uint depth) external onlyAuthorized returns (uint) {
        uint treeId = treeCount++;
        trees[treeId] = Tree({
            root: bytes32(0),
            depth: depth,
            leafCount: 0,
            tier: tier
        });
        
        emit TreeCreated(treeId, bytes32(0), tier);
        return treeId;
    }

    function updateRoot(uint treeId, bytes32 newRoot) external onlyAuthorized {
        require(treeId < treeCount, "Invalid tree");
        trees[treeId].root = newRoot;
    }

    function addLeaf(uint treeId, bytes32 commitment) external onlyAuthorized {
        require(treeId < treeCount, "Invalid tree");
        trees[treeId].leafCount++;
        emit LeafAdded(treeId, commitment);
    }

    function getTree(uint treeId) external view returns (Tree memory) {
        return trees[treeId];
    }

    function authorize(address operator) external onlyAuthorized {
        authorized[operator] = true;
    }
}