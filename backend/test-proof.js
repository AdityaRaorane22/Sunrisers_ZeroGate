import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Testing Circuit File Paths...\n');

const wasmPath = path.join(__dirname, '../circuits/build/membership_js/membership.wasm');
const zkeyPath = path.join(__dirname, '../circuits/build/membership_final.zkey');
const vkeyPath = path.join(__dirname, '../circuits/build/verification_key.json');

console.log('WASM Path:', wasmPath);
console.log('WASM Exists:', fs.existsSync(wasmPath));
console.log('WASM Size:', fs.existsSync(wasmPath) ? fs.statSync(wasmPath).size + ' bytes' : 'N/A');
console.log('');

console.log('ZKEY Path:', zkeyPath);
console.log('ZKEY Exists:', fs.existsSync(zkeyPath));
console.log('ZKEY Size:', fs.existsSync(zkeyPath) ? fs.statSync(zkeyPath).size + ' bytes' : 'N/A');
console.log('');

console.log('VKEY Path:', vkeyPath);
console.log('VKEY Exists:', fs.existsSync(vkeyPath));
console.log('VKEY Size:', fs.existsSync(vkeyPath) ? fs.statSync(vkeyPath).size + ' bytes' : 'N/A');
console.log('');

if (fs.existsSync(wasmPath) && fs.existsSync(zkeyPath)) {
    console.log('✅ All circuit files found! Real proofs should be generated.');
} else {
    console.log('❌ Circuit files missing. Mock proofs will be used.');
}
