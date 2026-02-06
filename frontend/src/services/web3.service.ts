import { ethers } from 'ethers';

const ACCESS_CONTROLLER_ABI = [
  "function updateRoot(bytes32 _newRoot) external",
  "function verifyAndExecute(tuple(uint[2] a, uint[2][2] b, uint[2] c) proof, bytes32 nullifier, bytes32 actionId, uint epochTimestamp) external returns (bool)",
  "function checkAccess(bytes32 nullifier) external view returns (bool)",
  "event AccessGranted(bytes32 indexed nullifier, uint timestamp)"
];

class Web3Service {
  provider: ethers.BrowserProvider | null = null;
  signer: ethers.Signer | null = null;
  contract: ethers.Contract | null = null;

  async connect() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not installed');
    }

    this.provider = new ethers.BrowserProvider(window.ethereum);
    await this.provider.send('eth_requestAccounts', []);
    this.signer = await this.provider.getSigner();

    const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || '0x61f83F5702FE4fc0fA727Ce7CAD560154385da1F';
    this.contract = new ethers.Contract(contractAddress, ACCESS_CONTROLLER_ABI, this.signer);

    return await this.signer.getAddress();
  }

  async getNetwork() {
    if (!this.provider) throw new Error('Provider not initialized');
    return await this.provider.getNetwork();
  }

  async getBalance(address: string) {
    if (!this.provider) throw new Error('Provider not initialized');
    return await this.provider.getBalance(address);
  }

  async switchNetwork(chainId: number) {
    if (typeof window.ethereum === 'undefined') return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added, add it
        console.log('Chain not found, please add it manually');
      }
    }
  }
}

export default new Web3Service();