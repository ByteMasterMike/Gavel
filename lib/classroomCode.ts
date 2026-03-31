const ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomCode(length = 6): string {
  let s = "";
  const cryptoObj = globalThis.crypto;
  for (let i = 0; i < length; i++) {
    const n = cryptoObj.getRandomValues(new Uint8Array(1))[0]! % ALPHANUM.length;
    s += ALPHANUM[n]!;
  }
  return s;
}
