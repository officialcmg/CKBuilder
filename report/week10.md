# Week 10 — CK Builder Track
Date: July 30, 2026

Summary
-------
This week I was looking at what needs to be done next on the CKB KeyWay roadmap. I made a basic MVP of the SDK during the Fiber Infrastructure hackathon, but one important thing was still missing: backing up the Fiber node's IndexedDB state. This meant that someone could sign in on one device, but they could not properly continue using their Fiber channels after signing in on another device later.

KeyWay was already recovering the same email-derived CKB and Fiber identities, but the actual Fiber state was still stuck in the first browser. The user's keys were recoverable, but their channels, payments, invoices, and latest off-chain state were not. This was probably the most glaring issue with the SDK's functionality, so I have started working out how to tackle it.

What I completed
-----------------
- Reviewed the CKB KeyWay roadmap and identified Fiber node state recovery as the next major priority.
- Traced how KeyWay currently separates email identity, CKB and Fiber keys, and the browser's Fiber database.
- Designed a cross-device handoff where only one device can own and run a user's Fiber node at a time.
- Planned an encrypted backup flow for moving the Fiber IndexedDB state between devices.
- Considered failure cases such as a backup upload failing during sign-out or a browser closing before the user signs out.

Proposed design
---------------
The experience I want is simple: a user should be able to sign out on device A, sign in on device B, and continue using the same Fiber wallet and channels.

```text
Device A
Sign out
  -> stop the Fiber node
  -> capture the latest IndexedDB state
  -> encrypt it with Lit Protocol
  -> upload and verify the encrypted backup
  -> release ownership of the Fiber node

Device B
Sign in with the same email
  -> recover the same CKB and Fiber identities
  -> download and decrypt the latest IndexedDB backup
  -> restore the Fiber database
  -> claim ownership
  -> start the Fiber node
```

Only one device would be allowed to own and run the Fiber node at a time. If creating, uploading, or verifying the backup fails, device A remains the owner and sign-out does not complete. This prevents KeyWay from releasing the only device that still has the latest channel state.

Key learnings
-------------
- Trying to keep two live copies of the same Fiber database in sync would be both difficult and dangerous. If the two devices progressed from the same channel state separately, one of them would eventually be operating with outdated information.
- I think a better approach is to allow only one device to own the Fiber node at a time. When the user signs out, KeyWay would stop the node, encrypt and upload the latest IndexedDB snapshot, and only then release ownership. When the user signs in on another device, KeyWay would download and restore that snapshot before starting the node.
- Sign-out has to be treated like a transaction. If the snapshot is not uploaded and verified successfully, sign-out should not complete and the original device should remain the owner. Otherwise, KeyWay could release the only device with the latest state before that state is safely backed up.
- Users will not always press the sign-out button. Browser crashes, lost connections, and closed tabs mean that background checkpoints will eventually be needed too, but those snapshots must be taken in a way that does not copy the database halfway through a Fiber state update.
- Lit Protocol can protect the database backup in the same way it helps protect KeyWay's key recovery flow, but encryption is only one part of the problem. KeyWay also needs exclusive device ownership and a reliable way to capture a complete Fiber database snapshot.
