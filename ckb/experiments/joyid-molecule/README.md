# JoyID Molecule Script Encoder

This experiment decodes a real JoyID testnet address into its CKB lock script,
encodes that script into Molecule bytes, maps each byte range to its meaning, and
decodes the bytes back into the original script.

It also changes one byte in the script arguments to demonstrate that the script
hash, and therefore the lock identity, changes.

## Run

```bash
npm install
npm start
```
