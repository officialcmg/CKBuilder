# Week 11 — CK Builder Track
Date: August 7, 2026

Summary
-------
Last week I designed a way to recover CKB KeyWay's Fiber IndexedDB state on another device. This week I actually built the first version of it. Before this, KeyWay could recover the same CKB and Fiber identities from an email, but the channels and latest off-chain state were still trapped in the original browser.

What I completed
-----------------
- Added a wallet-specific IndexedDB export and restore flow that keeps the database structure, indexes, keys, and binary values intact.
- Added client-side encryption for the backup using AES-GCM and a separate key derived from the Lit-recovered Fiber key.
- Added encrypted backup storage and a one-time `available -> claimed -> consumed` handoff flow in Postgres.
- Made logout transactional. KeyWay now stops the Fiber node, creates and verifies the encrypted backup, and only then releases device ownership and completes logout.
- Added automatic restore before the Fiber node starts on the next device.
- Tested the browser database round trip, corrupted backups, wallet isolation, failed uploads, failed restores, device ownership, and the Postgres handoff locally.

The design
----------
```text
Device A logout
  -> keep the active device lease
  -> stop Fiber
  -> snapshot the wallet's IndexedDB state
  -> encrypt and upload it
  -> verify the stored ciphertext
  -> release ownership and finish logout

Device B login
  -> recover the same identity from email
  -> claim the available backup
  -> acquire the Fiber lease
  -> decrypt and restore IndexedDB
  -> mark the backup as consumed
  -> start Fiber
```

Key learnings
-------------
- The backup is not just a file upload problem. It also needs a strict ownership handoff so two devices never run the same Fiber channels from different copies of the database.
- Logout has to behave like a transaction. If encryption or upload fails, KeyWay keeps the user signed in and does not release the device that still has the latest state.
- The backend only stores ciphertext. The backup key is derived in the browser from the Fiber key that KeyWay already recovers through Lit, and the temporary key bytes are cleared after use.
- Explicit logout now handles the normal device migration flow, but users will not always log out properly. Browser crashes, closed tabs, and lost devices still need a safe background checkpoint mechanism.

Implementation
--------------
[View the encrypted Fiber state migration commit on GitHub](https://github.com/officialcmg/ckb-keyway/commit/5e2b138)
