const { poseidon } = require('circomlibjs');

class PoseidonHash {
  // Hash a single value
  hash(input) {
    const bigIntInput = BigInt(input);
    return poseidon([bigIntInput]).toString();
  }

  // Hash two values
  hash2(left, right) {
    const leftBigInt = BigInt(left);
    const rightBigInt = BigInt(right);
    return poseidon([leftBigInt, rightBigInt]).toString();
  }

  // Hash multiple values
  hashMultiple(inputs) {
    const bigIntInputs = inputs.map(input => BigInt(input));
    return poseidon(bigIntInputs).toString();
  }

  // Convert string to BigInt hash
  stringToBigInt(str) {
    const buffer = Buffer.from(str, 'utf8');
    return BigInt('0x' + buffer.toString('hex'));
  }
}

module.exports = new PoseidonHash();