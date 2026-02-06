const hre = require('hardhat');

async function main() {
  console.log('🚀 Starting deployment...\n');

  // Deploy MerkleTreeRegistry
  console.log('📝 Deploying MerkleTreeRegistry...');
  const MerkleTreeRegistry = await hre.ethers.getContractFactory('MerkleTreeRegistry');
  const merkleRegistry = await MerkleTreeRegistry.deploy();
  await merkleRegistry.waitForDeployment();
  const merkleRegistryAddress = await merkleRegistry.getAddress();
  console.log('✅ MerkleTreeRegistry deployed to:', merkleRegistryAddress);

  // Deploy AccessController
  console.log('\n📝 Deploying AccessController...');
  const AccessController = await hre.ethers.getContractFactory('AccessController');
  const accessController = await AccessController.deploy();
  await accessController.waitForDeployment();
  const accessControllerAddress = await accessController.getAddress();
  console.log('✅ AccessController deployed to:', accessControllerAddress);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 DEPLOYMENT SUMMARY');
  console.log('='.repeat(60));
  console.log('MerkleTreeRegistry:', merkleRegistryAddress);
  console.log('AccessController:', accessControllerAddress);
  console.log('='.repeat(60));
  console.log('\n💾 Update your .env file with these addresses:');
  console.log(`MERKLE_REGISTRY_ADDRESS=${merkleRegistryAddress}`);
  console.log(`ACCESS_CONTROLLER_ADDRESS=${accessControllerAddress}`);
  console.log('\n✨ Deployment complete!\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });