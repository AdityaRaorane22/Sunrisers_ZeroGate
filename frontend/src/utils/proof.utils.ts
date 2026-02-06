export const formatProof = (proof: any) => {
  return {
    a: proof.a.map((x: string) => BigInt(x)),
    b: proof.b.map((row: string[]) => row.map((x: string) => BigInt(x))),
    c: proof.c.map((x: string) => BigInt(x))
  };
};

export const formatNullifier = (nullifier: string): string => {
  if (nullifier.startsWith('0x')) {
    return nullifier;
  }
  const hex = BigInt(nullifier).toString(16);
  return '0x' + hex.padStart(64, '0');
};

export const formatActionId = (actionId: string): string => {
  const buffer = Buffer.from(actionId, 'utf8');
  const hex = buffer.toString('hex');
  return '0x' + hex.padStart(64, '0');
};

export const truncateHash = (hash: string, length: number = 10): string => {
  if (hash.length <= length) return hash;
  return `${hash.slice(0, length / 2)}...${hash.slice(-length / 2)}`;
};

export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};