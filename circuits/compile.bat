@echo off
echo ========================================
echo 🚀 ZeroGate Circuit Compilation Pipeline
echo ========================================
echo.

echo 📦 Installing circuit dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ npm install failed!
    exit /b 1
)

echo.
echo 🔧 Compiling circuit...
if not exist "build" mkdir build
call circom membership.circom --r1cs --wasm --sym --c -l node_modules -o ./build
if %errorlevel% neq 0 (
    echo ❌ Circuit compilation failed!
    exit /b 1
)

echo.
echo 📊 Circuit information:
call npx snarkjs r1cs info build/membership.r1cs

echo.
echo 📥 Downloading Powers of Tau (if not exists)...
if not exist "powersOfTau28_hez_final_14.ptau" (
    curl -L -o powersOfTau28_hez_final_14.ptau https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_14.ptau
) else (
    echo ✅ Powers of Tau already downloaded
)

echo.
echo 🔑 Generating proving key (trusted setup)...
call npx snarkjs groth16 setup build/membership.r1cs powersOfTau28_hez_final_14.ptau build/membership_0000.zkey

echo.
echo 🎲 Contributing to ceremony...
echo random entropy for zerogate hackathon | npx snarkjs zkey contribute build/membership_0000.zkey build/membership_final.zkey --name="ZeroGate Contributor" -v

echo.
echo 📜 Exporting verification key...
call npx snarkjs zkey export verificationkey build/membership_final.zkey build/verification_key.json

echo.
echo ✅ Generating Solidity verifier...
call npx snarkjs zkey export solidityverifier build/membership_final.zkey ../contracts/Verifier.sol

echo.
echo 🎉 Circuit compilation complete!
echo.
echo Generated files:
echo   - build/membership.r1cs (constraint system)
echo   - build/membership_js/ (WASM prover)
echo   - build/membership_final.zkey (proving key)
echo   - build/verification_key.json (verification key)
echo   - ../contracts/Verifier.sol (Solidity verifier)
echo.
echo ✅ Ready for proof generation!
