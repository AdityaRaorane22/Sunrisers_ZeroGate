const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying ZeroGate contracts...\n");

    // Deploy MerkleTreeRegistry
    const MerkleTreeRegistry = await hre.ethers.getContractFactory("MerkleTreeRegistry");
    const registry = await MerkleTreeRegistry.deploy();
    await registry.waitForDeployment();
    console.log("✅ MerkleTreeRegistry:", await registry.getAddress());

    // Deploy AccessController
    const AccessController = await hre.ethers.getContractFactory("AccessController");
    const controller = await AccessController.deploy();
    await controller.waitForDeployment();
    console.log("✅ AccessController:", await controller.getAddress());

    // Initialize sample tree
    const tx = await registry.createTree(1, 20);
    await tx.wait();
    console.log("✅ Sample tree created\n");

    console.log("📋 Deployment Summary:");
    console.log("Registry:", await registry.getAddress());
    console.log("Controller:", await controller.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});