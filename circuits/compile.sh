#!/bin/bash

echo "🚀 ZeroGate Circuit Compilation Pipeline"
echo "=========================================="
echo ""

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    echo "❌ Circom not found. Installing..."
    npm install -g circom
fi

# Check if snarkjs is installed
if ! command -v snarkjs &> /dev/null; then
    echo "❌ SnarkJS not found. Installing..."
    npm install -g snarkjs
fi

echo "📦 Installing circuit dependencies..."
npm install

echo ""
echo "🔧 Compiling circuit..."
circom membership.circom --r1cs --wasm --sym --c -o ./build

if [ $? -ne 0 ]; then
    echo "❌ Circuit compilation failed!"
    exit 1
fi

echo ""
echo "📊 Circuit information:"
snarkjs r1cs info build/membership.r1cs

echo ""
echo "📥 Downloading Powers of Tau (if not exists)..."
if [ ! -f "powersOfTau28_hez_final_14.ptau" ]; then
    curl -o powersOfTau28_hez_final_14.ptau https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau
else
    echo "✅ Powers of Tau already downloaded"
fi

echo ""
echo "🔑 Generating proving key (trusted setup)..."
snarkjs groth16 setup build/membership.r1cs powersOfTau28_hez_final_14.ptau build/membership_0000.zkey

echo ""
echo "🎲 Contributing to ceremony..."
echo "random entropy for zerogate hackathon" | snarkjs zkey contribute build/membership_0000.zkey build/membership_final.zkey --name="ZeroGate Contributor" -v

echo ""
echo "📜 Exporting verification key..."
snarkjs zkey export verificationkey build/membership_final.zkey build/verification_key.json

echo ""
echo "✅ Generating Solidity verifier..."
snarkjs zkey export solidityverifier build/membership_final.zkey ../contracts/Verifier.sol

echo ""
echo "🎉 Circuit compilation complete!"
echo ""
echo "Generated files:"
echo "  - build/membership.r1cs (constraint system)"
echo "  - build/membership_js/ (WASM prover)"
echo "  - build/membership_final.zkey (proving key)"
echo "  - build/verification_key.json (verification key)"
echo "  - ../contracts/Verifier.sol (Solidity verifier)"
echo ""
echo "✅ Ready for proof generation!"
