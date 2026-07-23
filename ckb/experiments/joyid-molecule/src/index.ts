import { ccc } from "@ckb-ccc/core";

// My joyid testnet address
const JOYID_TESTNET_ADDRESS =
  "ckt1qrfrwcdnvssswdwpn3s9v8fp87emat306ctjwsm3nmlkjg8qyza2cqgqqxkxncmw48n87rfz0sauhjf7c4670h84sce2332n";

const client = new ccc.ClientPublicTestnet();
const address = await ccc.Address.fromString(JOYID_TESTNET_ADDRESS, client);
const script = address.script;
const encoded = script.toBytes();
const decoded = ccc.Script.fromBytes(encoded);

const readUint32Le = (offset: number) =>
  new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength).getUint32(
    offset,
    true,
  );

const totalSize = readUint32Le(0);
const codeHashOffset = readUint32Le(4);
const hashTypeOffset = readUint32Le(8);
const argsOffset = readUint32Le(12);
const argsLength = readUint32Le(argsOffset);
const hashTypeByte = encoded[hashTypeOffset];

console.log("JOYID ADDRESS");
console.log(JOYID_TESTNET_ADDRESS);

console.log("\nREADABLE LOCK SCRIPT");
console.log(
  JSON.stringify(
    {
      codeHash: script.codeHash,
      hashType: script.hashType,
      args: script.args,
    },
    null,
    2,
  ),
);

console.log("\nMOLECULE BYTES");
console.log(script.toHex());

console.log("\nMOLECULE BYTE MAP");
console.log("The first 16 bytes are a header. They describe where each field starts.");
console.log(`[bytes  0.. 3] total size       = ${totalSize} bytes`);
console.log(`[bytes  4.. 7] codeHash starts  = byte ${codeHashOffset}`);
console.log(`[bytes  8..11] hashType starts  = byte ${hashTypeOffset}`);
console.log(`[bytes 12..15] args field starts = byte ${argsOffset}`);

console.log("\nThe remaining bytes contain the actual fields.");
console.log(`[bytes 16..47] codeHash          = ${script.codeHash}`);
console.log(
  `[byte      48] hashType          = 0x${hashTypeByte.toString(16).padStart(2, "0")} ("${script.hashType}")`,
);
console.log(`[bytes 49..52] args byte length   = ${argsLength}`);
console.log(`[bytes 53..74] args               = ${script.args}`);

console.log("\nROUND TRIP");
console.log("Decoded script equals original:", decoded.eq(script));
console.log("Original script hash:", script.hash());

const args = ccc.bytesFrom(script.args);
args[args.length - 1] ^= 1;
const changedScript = ccc.Script.from({
  codeHash: script.codeHash,
  hashType: script.hashType,
  args: ccc.hexFrom(args),
});

console.log("\nCHANGE ONE ARG BYTE");
console.log("Original args:", script.args);
console.log("Changed args: ", changedScript.args);
console.log("Changed script hash:", changedScript.hash());
console.log("Hashes are different:", changedScript.hash() !== script.hash());
