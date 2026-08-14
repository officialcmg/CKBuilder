# Week 12 — CK Builder Track
Date: August 13, 2026

Working notes
-------------
This week I broke CKB KeyWay down into its main systems and reviewed what would need to change for it to grow from a hackathon MVP into infrastructure that other developers could actually use.

## 1. Developer onboarding and SDK integration

Current weakness: installing `@ckb-keyway/react` is not enough for a new application. Its browser origin still has to be manually added to the managed backend's CORS allowlist, and KeyWay has no first-class concept of a registered developer application.

Planned direction:
- Build a developer dashboard rather than relying on manual registration.
- Let developers create an application and receive a public app ID.
- Let each application register its development and production origins.
- Associate the application with its display name, OTP branding, rate limits, and usage records.
- Add an `appId` to `KeyWayProvider`; keep the managed backend URL internal to the SDK.
- Validate the public app ID together with the request's browser origin. The app ID is an identifier, not a secret.

Decision: the dashboard is not optional roadmap polish. Self-service registration is part of making KeyWay genuinely usable infrastructure rather than an SDK whose backend still needs a manual configuration change for every adopter.

## 2. Email authentication

Current weakness: OTP authentication works, but it is not application-aware. The browser currently supplies only display-level branding, while the backend has no registered application record it can trust when selecting an OTP sender or template.

Planned direction:
- Include the public app ID in OTP requests and resolve the verified application, registered origin, application name, and approved email template on the backend.
- Add KeyWay-level OTP limits per application, IP address, and one-way email hash, plus failed-attempt cooldowns.
- Show OTP usage and failures in the developer dashboard so one application cannot silently consume the shared provider quota.
- Use bounded concurrency and immediate backpressure around OTP provider calls.
- Improve session revocation and eventually move away from long-lived session credentials in `localStorage`, since consuming-application JavaScript can read them after an XSS compromise.

Decision: keep the roadmap focused on application-aware OTP, abuse prevention, visibility, and safer sessions. Replacing Stytch or designing a general authentication-provider abstraction is not part of this plan.

## 3. CKB and Fiber key management

The existing two-key design is still the right foundation. The Lit PKP owns and signs for the user's CKB cells, while the separate Fiber key identifies the browser node and signs its off-chain channel state.

Planned direction:
- Make Lit independently require proof of the user's authentication instead of trusting the backend request by itself.
- Use a one-time signing challenge bound to the user, exact transaction digest, application, and expiry. The challenge should expire after about two minutes and be consumed after one signature; this is not a reusable short-lived private key.
- Keep the backend responsible for validating the complete CKB transaction and applying funding policy, but prevent it from authorizing a Lit signature without the user's fresh proof.
- Support a verified secondary email as an alternate login identifier for the same KeyWay account, so losing the primary email does not automatically mean losing access.
- Explore phone verification as optional 2FA for sensitive actions, not as the default recovery identity.
- Stop returning the plaintext Fiber key through the backend. The browser can create an ephemeral encryption key, Lit can re-encrypt the recovered Fiber key to that browser key, and the backend can relay only ciphertext.
- Accept that the Fiber key still has to exist briefly in browser/WASM memory because the current Fiber node API requires it.

Decision: preserve the two-key architecture. Focus on independent user authorization inside Lit, secondary-email recovery, optional phone 2FA, and removing plaintext Fiber-key exposure from the backend. Fiber-key rotation is not part of the roadmap.

## 4. Fiber node lifecycle

Current weakness: login appears to be one long operation even though email authentication, CKB wallet recovery, Fiber WASM startup, relay connection, gossip synchronization, and balance loading are separate stages.

Planned direction:
- Expose separate lifecycle states such as `authenticated`, `walletReady`, `fiberStarting`, `fiberReady`, and `fiberError`.
- Show the recovered CKB identity immediately while Fiber continues starting in the background.
- Move lease heartbeat scheduling into the existing worker where possible so background-tab timer throttling does not incorrectly stop a healthy node.
- Change the heartbeat interval from 20 seconds to 30 seconds and the lease expiry from 45 seconds to 120 seconds. This tolerates short stalls while still preserving one active Fiber node.
- Retry temporary heartbeat failures, but stop when the backend explicitly reports that another device owns the lease.
- Detect `window.crossOriginIsolated` before attempting Fiber startup and return an exact setup error.
- Investigate whether Fiber can support a single-threaded WASM fallback; otherwise document the required COOP and COEP configuration for Next.js, Vite, and other common hosts.
- Expose structured startup stages and timings: identity recovery, lease acquisition, database restoration, WASM startup, peer connection, synchronization, and ready.
- Surface sanitized lifecycle failures and timings in the developer dashboard without logging emails, keys, or session credentials.

Decision: keep KeyWay browser-node-first. An optional managed always-online node may be considered later, but it is not part of the current roadmap because it changes the custody model, cost, and decentralised direction of the product.

## 5. IndexedDB backup and device migration

Week 11 implemented the clean handoff path: stop Fiber during explicit logout, export and encrypt the wallet's IndexedDB state, upload the ciphertext, then let the next device claim and restore it before Fiber starts.

Remaining weaknesses and planned direction:
- A crash, force-closed tab, lost device, or interrupted browser still cannot create a final backup.
- Do not copy a live Fiber database blindly. Background checkpoints need a Fiber-level pause or flush boundary so the snapshot cannot capture several stores halfway through one logical state update.
- Retain a small number of immutable backup generations instead of overwriting the only previous backup. A device should claim one exact generation, while older generations remain available until the restored node and channels are verified.
- Authenticate and structurally validate the complete archive before modifying the expected Fiber databases.
- On a new device, refuse to overwrite matching local Fiber databases automatically. Existing state may be newer than the claimed backup.
- Keep encrypted blobs in Postgres for now and record their sizes. Move ciphertext to object storage only when real database sizes or storage cost justify it.

Required final verification:
```text
Open a real testnet channel in browser A
  -> log out and upload the encrypted backup
  -> log in with the same account in browser B
  -> restore the same channel database
  -> inspect the same channel
  -> send and receive a Fiber payment
```

Decision: deploy and test the migration properly beyond unit and local integration tests. Then add immutable generations and rollback. Do not claim crash-safe background recovery until Fiber exposes a reliable checkpoint boundary.

## 6. Channels, liquidity, and payments

Current weakness: KeyWay proves that Fiber payments work, but parts of the channel flow still reflect the fixed choices made for a fast hackathon demo rather than a reusable product.

Planned direction:
- Replace the reference app's fixed 1,000 CKB activation assumption with application-controlled funding amount, maximum fee, preferred peer, public/private channel choice, and confirmation handling.
- Keep safe KeyWay defaults without turning demo values into permanent backend policy.
- Make application-aware peer selection evaluate availability, supported channel size, remote contribution, fees, connectivity, and reliability instead of depending on a short list of testnet peers.
- Clearly expose local balance as outbound/send liquidity and remote balance as inbound/receive liquidity.
- Investigate how KeyWay can provision useful inbound liquidity for new users through one reliable channel-provider or LSP integration. Start with one integration rather than building a provider marketplace before the basic model works.
- Replace raw Fiber error strings with typed payment failures, retryability, and safe user guidance. Important cases include no route, insufficient route liquidity, expired invoice, excessive fee, offline peer, and timeout.
- Add a small managed channel lifecycle API and React state for opening, pending confirmation, ready, local/remote balances, cooperative close, force close, settlement delay, and final on-chain settlement.
- Make payment preflight first-class by wrapping Fiber's dry-run routing: whether this exact amount can route now, its configured maximum fee, and a structured reason when it cannot.
- Be precise that preflight is a current route check, not a promise of total network liquidity. Channel state changes and some liquidity information is private.
- Keep the roadmap focused on CKB payments. Mainnet, UDTs, swaps, and multiple assets come after channel and liquidity management are reliable.

Decision: KeyWay should abstract the difficult channel lifecycle and payment failure handling rather than merely re-exporting Fiber methods. Inbound liquidity is partly a Fiber ecosystem problem, but KeyWay can make it much less visible to its users by integrating a channel provider during onboarding.

## 7. Managed backend and production reliability

Current weakness: the public SDK depends on one managed backend, so the backend contract, deployment process, and external provider failures are part of the SDK's reliability.

Planned direction:
- Version the managed API explicitly, for example `/api/v1`, so backend changes do not silently break already-installed SDK versions.
- Maintain old API versions for a defined support period and show SDK version usage in the developer dashboard.
- Add a staging environment with a separate API, Postgres database, frontend, Stytch credentials, and Lit credentials before production promotion.
- Replace table creation during API startup with small versioned SQL migrations and a recorded rollback procedure. A large ORM is unnecessary.
- Add idempotency keys to important mutations so retries cannot provision another identity, create duplicate backup generations, claim the wrong backup twice, or repeat a funding operation.
- Add sanitized operational metrics for OTP latency and failures, wallet recovery, Fiber startup stages, lease loss, backup size and restore outcome, channel activation, payment failure categories, and provider availability.
- Never put emails, OTPs, session credentials, Fiber keys, sensitive Lit responses, or complete invoices in logs.
- Add bounded timeouts, typed failures, and limited retries for Stytch, Lit, CKB RPC/indexer, Fiber peers, and Postgres. Only retry operations that are safe or protected by idempotency.
- Keep separate staging and production provider credentials.
- Alert on unusual signing or OTP volume.

Developer dashboard controls:
- Disable an application.
- Add and remove registered origins.

Decision: session revocation and device-ownership administration are not part of the current dashboard plan. The immediate goal is reliable application operations, deployments, and observability without building an oversized administration product.
