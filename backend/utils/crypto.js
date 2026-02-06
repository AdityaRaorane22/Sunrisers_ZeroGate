const crypto = require('crypto');
const poseidonHash = require('./poseidon');

class CryptoUtils {
  // Generate random secret
  generateSecret(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash string using SHA256
  sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Generate commitment from userId and secret
  generateCommitment(userId, secret) {
    const userIdHash = poseidonHash.stringToBigInt(userId);
    const secretHash = poseidonHash.stringToBigInt(secret);
    return poseidonHash.hash2(userIdHash, secretHash);
  }

  // Generate nullifier
  generateNullifier(commitment, actionId) {
    const actionHash = poseidonHash.stringToBigInt(actionId);
    return poseidonHash.hash2(commitment, actionHash);
  }

  // Encrypt sensitive data (AES-256)
  encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt sensitive data
  decrypt(encryptedData, key) {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}

module.exports = new CryptoUtils();