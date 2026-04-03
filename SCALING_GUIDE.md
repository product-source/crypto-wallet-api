# Paycoinz Payment Gateway — Scaling & Capacity Guide

> **Last Updated:** April 3, 2026  
> **Architecture:** Event-driven (Tatum Webhooks for TRON, Moralis Streams for EVM, Tatum API for BTC)

---

## 1. Current API Plans

| Service | Plan | Monthly Limit | Rate Limit | Cost |
|---------|------|:------------:|:----------:|:----:|
| **Moralis** | Starter | 2M CU/month | 1,000 CU/s | Free |
| **Tatum** | PAYGO | 4M credits/month | — | Pay-as-you-go |
| **TronGrid** | Standard | 100K requests/day | ~15 QPS | Free |

---

## 2. Which Service Powers Which Chain

| Chain | Payment Detection | Withdrawal | Balance Check |
|-------|:-----------------:|:----------:|:-------------:|
| **ETH** | Moralis Streams (webhook) | ethers.js + RPC | Moralis API |
| **BSC** | Moralis Streams (webhook) | ethers.js + RPC | Moralis API |
| **Polygon** | Moralis Streams (webhook) | ethers.js + RPC | Moralis API |
| **AVAX** | Moralis Streams (webhook) | ethers.js + RPC | Moralis API |
| **TRON (TRX)** | Tatum Webhook (instant) | TronWeb + TronGrid | TronGrid |
| **TRON (USDT/TRC20)** | Tatum Webhook (instant) | TronWeb + TronGrid | TronGrid |
| **Bitcoin** | Tatum API (polling 1min) | Tatum API | Tatum API |

---

## 3. API Usage Per Payment Lifecycle

### Moralis CU (Compute Units) — EVM Chains Only

| Operation | CU Cost |
|-----------|:-------:|
| Webhook from Stream (1 tx record) | 10 CU |
| Webhook from Stream (1 ERC20 transfer record) | 10 CU |
| `Streams.addAddress` (on payment link creation) | 50 CU |
| `Streams.deleteAddress` (on expiry/completion) | 50 CU |
| `getNativeBalancesForAddresses` (admin dashboard, 4 chains) | 80 CU |
| `getWalletTokenTransfers` (token history) | 50 CU |
| **Total per EVM native payment** | **~120 CU** |
| **Total per EVM ERC20 payment** | **~130 CU** |

### Tatum Credits — TRON + BTC

| Operation | Credits |
|-----------|:-------:|
| Subscribe TRON webhook | 1 |
| Unsubscribe TRON webhook | 1 |
| Webhook delivery (TRON) | FREE |
| **Total per TRON payment** | **2 credits** |
| BTC batch TX check (polling) | 1/batch |
| BTC withdrawal broadcast | ~2 |
| BTC deposit monitor | 1/cycle |
| **Total per BTC payment** | **~4 credits** |

### TronGrid Requests — TRON Only

| Operation | Calls |
|-----------|:-----:|
| Balance check (after webhook) | 1-2 |
| Native TRX transfer to merchant | ~3 |
| Native TRX transfer to admin | ~3 |
| TRC20: Send gas TRX | ~3 |
| TRC20: Transfer to merchant | ~3 |
| TRC20: Transfer to admin | ~3 |
| **Total per TRX payment** | **~7 calls** |
| **Total per TRC20 payment** | **~11 calls** |

---

## 4. Current Capacity — Transactions Per Day

### Per Chain

| Chain | Max Payments/Day | Bottleneck | Detection Speed |
|-------|:----------------:|:----------:|:---------------:|
| **ETH** | **~555** | Moralis 2M CU/month | ~3 sec (webhook) |
| **BSC** | **~555** | Moralis 2M CU/month | ~3 sec (webhook) |
| **Polygon** | **~555** | Moralis 2M CU/month | ~3 sec (webhook) |
| **AVAX** | **~555** | Moralis 2M CU/month | ~3 sec (webhook) |
| **TRON (TRX)** | **~11,111** | TronGrid 100K/day | ~7 sec (webhook) |
| **TRON (TRC20)** | **~9,090** | TronGrid 100K/day | ~7 sec (webhook) |
| **Bitcoin** | **~33,333** | Tatum 4M/month | ~60 sec (polling) |

> **Note:** EVM chains share the same 2M CU Moralis budget. 555/day is the TOTAL across all EVM chains combined, not per chain.

### Combined Daily Capacity (Current Plans)

| Scenario | EVM | TRON | BTC | Total/Day |
|----------|:---:|:----:|:---:|:---------:|
| All EVM | 555 | 0 | 0 | **555** |
| All TRON | 0 | 11,111 | 0 | **11,111** |
| All BTC | 0 | 0 | 33,333 | **33,333** |
| Mixed (realistic) | 100 | 5,000 | 500 | **5,600** |

### Concurrent Payments (Simultaneously Pending)

| Chain | Max Concurrent | Limit Source |
|-------|:--------------:|:------------:|
| EVM | ~unlimited (stream) | Moralis stream has no sub limit |
| TRON | ~5,000 | Tatum max active subscriptions |
| BTC | ~50 per batch | Tatum batch API limit |

---

## 5. Idle System Overhead (No Payments)

Even with zero payments, cron jobs consume API calls:

| Cron Job | Frequency | API Service | Calls/Hour |
|----------|:---------:|:-----------:|:----------:|
| Delete expired links | 30 sec | Moralis (deleteAddress) | ~120 × 50 CU = up to 6,000 CU |
| EVM withdraw check | 10 sec | None (DB only) | 0 |
| TRON fallback check | 5 min | TronGrid | ~12 calls |
| TRON withdraw | 2 min | TronGrid | ~30 calls |
| BTC payment check | 1 min | Tatum | ~60 credits |
| BTC withdraw | 1 min | Tatum | ~60 credits |
| BTC deposit monitor | 1 min | Tatum | ~60 credits |
| TRON deposit monitor | 5 min | TronGrid | ~12 calls |
| Webhook retry | 1 min | None (internal) | 0 |

**Estimated idle overhead per day:**
- Moralis: ~144,000 CU (7.2% of monthly budget)
- Tatum: ~4,320 credits (0.1% of monthly budget)
- TronGrid: ~1,296 calls (1.3% of daily budget)

---

## 6. Scaling Tiers — When to Upgrade

### Tier 1: Current Setup (Free/PAYGO) — Up to 5,000 payments/day

| Service | Plan | Payments Supported |
|---------|------|--------------------|
| Moralis | Starter (2M CU) | ~555 EVM/day |
| Tatum | PAYGO (4M credits) | ~66,666 TRON/day, ~33,333 BTC/day |
| TronGrid | 100K/day | ~11,111 TRON/day |

**Good for:** Early stage, mostly TRON/BTC payments, light EVM usage.

---

### Tier 2: Growing ($199-299/mo) — Up to 50,000 payments/day

| Service | Plan | Cost | Payments Supported |
|---------|------|:----:|:------------------:|
| Moralis | **Pro (100M CU)** | $199/mo | **~27,777 EVM/day** |
| Tatum | PAYGO (4M credits) | ~$50-100/mo | ~66,666 TRON/day |
| TronGrid | **500K/day** | ~$50/mo | **~55,555 TRON/day** |

**Good for:** Multi-platform deployment, growing merchant base.

---

### Tier 3: High Volume ($500-1000/mo) — Up to 200,000 payments/day

| Service | Plan | Cost | Payments Supported |
|---------|------|:----:|:------------------:|
| Moralis | **Business (500M CU)** | $490/mo | **~138,888 EVM/day** |
| Tatum | **Growth (20M credits)** | ~$99/mo | **~333,333 TRON/day** |
| TronGrid | **2M/day** | ~$200/mo | **~222,222 TRON/day** |

**Good for:** Large-scale deployment across many platforms.

---

### Tier 4: Enterprise (Custom) — 500,000+ payments/day

| Service | Plan | Payments Supported |
|---------|------|--------------------|
| Moralis | Enterprise (Custom) | Unlimited EVM |
| Tatum | Enterprise (Custom) | Unlimited TRON/BTC |
| TronGrid | Enterprise | Unlimited TRON |

**At this scale, consider:**
- Migrate EVM from Moralis to Tatum (saves Moralis cost entirely)
- Run your own TronGrid full node (~$500-1000/mo server)
- Add Redis/BullMQ for parallel withdrawal processing
- Run multiple API server instances behind a load balancer

---

## 7. Scaling Strategies (No Plan Upgrade Needed)

These optimizations can increase capacity WITHOUT upgrading plans:

### Strategy 1: Reduce Idle CU Waste
Currently expired link deletion runs every 30 seconds and calls `Moralis.Streams.deleteAddress` (50 CU each). 
- **Fix:** Batch deletions — collect expired addresses and delete once per 5 minutes instead of every 30 seconds.
- **Savings:** ~100,000 CU/day → can support ~830 more EVM payments/day.

### Strategy 2: Cache Admin Balance Checks
`getEVMNativeBalance` calls Moralis 4 times (BSC, ETH, Polygon, AVAX) at 80 CU total.
- **Fix:** Replace with ethers.js RPC calls (free) or cache results for 5 minutes.
- **Savings:** All 80 CU per dashboard load eliminated.

### Strategy 3: Per-Chain Tatum Subscriptions (for EVM)
Instead of Moralis Streams for EVM, use Tatum ADDRESS_EVENT webhooks (same as TRON).
- **Impact:** Moves EVM from Moralis budget (2M CU) to Tatum budget (4M credits).
- **Result:** EVM capacity jumps from 555/day to ~66,666/day at zero extra cost.
- **Complexity:** Medium — needs ~2-3 days of development + testing.

### Strategy 4: Parallel Withdrawal Processing
Currently withdrawals process sequentially in cron jobs.
- **Fix:** Add Redis + BullMQ queue. Process 5-10 withdrawals in parallel.
- **Impact:** 5-10x faster withdrawal throughput.

### Strategy 5: Upgrade BTC Detection to Webhooks
BTC currently uses 1-minute polling via Tatum API.
- **Fix:** Use Tatum ADDRESS_EVENT webhooks for BTC (same as TRON).
- **Impact:** Instant BTC detection + fewer Tatum credits consumed.

---

## 8. Quick Reference — Plan Comparison

### Moralis Plans

| Plan | CU/Month | CU/Sec | EVM Payments/Day | Cost |
|------|:--------:|:------:|:-----------------:|:----:|
| Starter | 2M | 1,000 | **~555** | Free |
| Pro | 100M | 2,000 | **~27,777** | $199/mo |
| Business | 500M | 5,000 | **~138,888** | $490/mo |

### Tatum Plans

| Plan | Credits/Month | TRON/Day | BTC/Day | Cost |
|------|:------------:|:--------:|:-------:|:----:|
| PAYGO | 4M | **~66,666** | **~33,333** | Pay per use |
| Growth | 20M | **~333,333** | **~166,666** | ~$99/mo |
| Enterprise | Unlimited | Unlimited | Unlimited | Custom |

### TronGrid Plans

| Plan | Requests/Day | TRON Payments/Day | Cost |
|------|:------------:|:-----------------:|:----:|
| Free | 100K | **~11,111** | Free |
| Basic | 500K | **~55,555** | ~$50/mo |
| Pro | 2M | **~222,222** | ~$200/mo |

---

## 9. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PAYCOINZ API SERVER                       │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ EVM Handler  │  │ TRON Handler │  │ BTC Handler  │      │
│  │              │  │              │  │              │      │
│  │ Moralis      │  │ Tatum        │  │ Tatum        │      │
│  │ Streams      │  │ Webhooks     │  │ Polling      │      │
│  │ (webhook)    │  │ (instant)    │  │ (1 min)      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐      │
│  │  Withdraw    │  │  Withdraw    │  │  Withdraw    │      │
│  │  Cron: 10s   │  │  Cron: 2min  │  │  Cron: 1min  │      │
│  │              │  │              │  │              │      │
│  │ ethers.js    │  │ TronWeb      │  │ Tatum API    │      │
│  │ + RPC Nodes  │  │ + TronGrid   │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  Chains: ETH,     Chains: TRX,      Chain: BTC             │
│  BSC, Polygon,    USDT, USDC                               │
│  AVAX             (TRC20)                                   │
└─────────────────────────────────────────────────────────────┘

External APIs:
  Moralis  → EVM payment detection + balance checks
  Tatum   → TRON webhooks + BTC transactions
  TronGrid → TRON balance checks + withdrawals
  RPC Nodes → EVM withdrawals (Alchemy/Infura/Public)
```

---

## 10. Summary

| Metric | Current Capacity |
|--------|:----------------:|
| **EVM payments/day** | **~555** (Moralis bottleneck) |
| **TRON payments/day** | **~11,111** (TronGrid bottleneck) |
| **BTC payments/day** | **~33,333** |
| **Total concurrent** | **~5,000** |
| **Monthly API cost** | **~$0-50** (PAYGO) |
| **First upgrade trigger** | EVM > 400/day → Moralis Pro ($199/mo) |
| **Best free optimization** | Migrate EVM to Tatum webhooks → 555 → 66,666/day |
