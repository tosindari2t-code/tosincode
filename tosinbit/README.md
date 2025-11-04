# TosinBit Clarinet Project

A minimal Clarity smart contract implementing a simple fungible token (TosinBit / TBIT) for local development with Clarinet.

## Prerequisites
- Linux/macOS
- curl

Install Clarinet (if not installed):

```bash
# One-line install to ~/.local/bin
curl -fsSL https://get.hiro.so/clarinet/install | bash \
  && mkdir -p "$HOME/.local/bin" \
  && mv ./clarinet "$HOME/.local/bin/clarinet"
export PATH="$HOME/.local/bin:$PATH"
clarinet --version
```

## Project structure
- `contracts/tosinbit.clar` — Clarity contract for TosinBit token
- `Clarinet.toml` — Clarinet project configuration
- `settings/` — network configurations for devnet/testnet/mainnet
- `tests/` — place JS/TS tests for your contracts

## Build and verify
From the project root (`tosinbit`):

```bash
clarinet check
```

## REPL / manual testing
Start the console:

```bash
clarinet console
```

Example interactions inside the console:

```clarity
::contract-call? .tosinbit mint u1000
::contract-call? .tosinbit get-balance tx-sender
::contract-call? .tosinbit transfer 'ST3AM1Y02KX6G8N1G6N7E9Y1Y8Z5G9K0MB3B1X3C8 u200
::contract-call? .tosinbit get-balance 'ST3AM1Y02KX6G8N1G6N7E9Y1Y8Z5G9K0MB3B1X3C8
::contract-call? .tosinbit get-total-supply
```

Notes:
- Anyone can mint/burn in this demo for simplicity. For production, restrict minting to an admin and consider SIP-010 compliance.
- Decimals: `u6` (6 decimal places)

## Scripts (optional)
You can add npm scripts in `package.json` to wrap common Clarinet commands, e.g. `clarinet check`, `clarinet console`, etc.
