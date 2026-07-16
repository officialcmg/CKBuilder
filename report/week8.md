# Week 8 — CK Builder Track
Date: July 16, 2026

Summary
-------
This week was basically all CKB KeyWay lol. Crypto UX has been massively improved for me by apps that let users log in with email instead of forcing them to already have a wallet, especially on mobile. Users can be onboarded waaay faster and the app can abstract most of the blockchain away until they actually need to think about it. I did not see anything offering that kind of experience for CKB or Fiber, so I decided to build it.

I knew key management would be a huge part of the work, which is why I chose Lit Protocol. It lets KeyWay recover and use the same CKB identity without exposing the private key to the app or turning my backend into a wallet custodian, which is amazing. I then used Stytch for email OTP authentication and came across Fiber Pay, which gave me the tools I needed to turn the idea into an actual React SDK for CKB accounts and Fiber payments.

What I completed
-----------------
- Built and published the `@ckb-keyway/react` SDK.
- Added email OTP login with Stytch and stable CKB account recovery from the same email identity.
- Integrated Lit Protocol PKPs and pinned Lit Actions for non-custodial CKB transaction signing.
- Added automatic browser Fiber node startup, testnet peer connections, and channel activation.
- Added Fiber channel balances, invoice creation, invoice payment, and routed payments.
- Split the managed backend from the Next.js demo app and deployed it independently on Railway with Postgres.
- Built the CKB KeyWay landing page, live testnet demo, and SDK documentation.
- Tested the full flow with two separate email sessions and successfully settled a Fiber payment between them.

Key learnings
-------------
- Email login is not just a nicer login button. Especially on mobile, it removes the requirement for someone to install and understand a wallet before they can even use the product. It lets developers meet users where they already are: their email.
- Key management really was the crux of the product. Lit Protocol made it possible to keep the CKB signing flow non-custodial while still recovering the same identity after the user logs in again.
- I finally understand that connecting a Fiber node to a relay is not the same as opening a payment channel. Relays provide network reachability and gossip, while channels are where the actual payment liquidity lives.
- Two users do not need a direct channel between each other. Fiber can build a multi-hop route through public channels as long as every channel along that route has enough outbound liquidity.
- Fiber balances are allocations inside channels, not normal on-chain wallet balances. Opening a channel moves CKB into an on-chain funding cell, then payments update the balance split off-chain.
- I also learned why locking 1,000 CKB did not show 1,000 CKB as spendable. Fiber reserved 99 CKB for occupied capacity and settlement fees, leaving 901 CKB on my side of the channel. The funds did not just disappear lol.
- Building infrastructure means hiding a lot of moving parts behind a clean API. KeyWay now handles OTP login, account recovery, browser-node startup, channel funding, invoices, and routed payments through one React provider.

Project links
-------------
- [CKB KeyWay repository](https://github.com/officialcmg/ckb-keyway)
- [CKB KeyWay app screenshots](https://github.com/officialcmg/ckb-keyway/tree/main/screenshots)
- [Live demo app](https://ckb-keyway.vercel.app/)
