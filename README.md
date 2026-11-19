# Global Chronicle — 19 November 2026

[![make.fun](https://make.fun/badge/news-image-20261119.svg)](https://make.fun/c/news-image-20261119)
[![rank](https://make.fun/badge/news-image-20261119/arianda17/news-image-20261119/rank.svg)](https://make.fun/c/news-image-20261119)
[![reward](https://make.fun/badge/news-image-20261119/arianda17/news-image-20261119/reward.svg)](https://make.fun/c/news-image-20261119)

A one-day newspaper front page that sums up the world's news of
**Thursday 19 November 2026**, drawn entirely in code: no photographs,
no downloaded assets, just typography, rules and small vector icons on
paper.

## What the image shows

- **Lead:** the first-ever Trump–Xi–Putin trilateral, convening in
  Shenzhen on nuclear arms and trade.
- **Gulf escalation:** Iran hits the Ali Al Salem base in Kuwait after a
  third attack wave on Bahrain; three US carriers and 53,000 troops in
  the region.
- **Eastern Europe:** the Crimean Bridge hit again, its third strike in
  a week.
- **Market record:** Anthropic's $81.3B IPO — the largest ever — priced
  at $83, listing on Nasdaq as ANT.
- **US Congress:** Jeffries nominated 251–11, the first Black Speaker.
- **Wall Street:** the Dow plunges 561 as the S&P falls a fifth day,
  with Nasdaq bouncing on tech.
- **Gaza:** Israel launches a rare ground push; three killed.
- A markets strip (Dow, S&P, Nasdaq, Anthropic, gold, VIX) and a
  sources line: NYT, Bloomberg, Reuters, AP, BBC.

## How to run it

Requires Node 22, nothing else — standard library only, no network,
no randomness, fully deterministic.

```sh
mkdir -p out
MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png`: exactly 1024×1024, well under the 1 MiB
limit. Running it twice produces byte-identical output. Without
`MAKEFUN_OUTPUT_DIR` it writes to `/output/entry.png`, as the
competition harness expects.

## How it is drawn

`main.ts` renders a 5×7 master bitmap font at scales 2, 2.5, 3, 4 and 6,
with nearest-neighbour pixel replication, and encodes the PNG itself
with Node's built-in zlib (fixed compression level, so the bytes are
reproducible run after run). Every string, line split and grid
coordinate follows the entry's unified spec for this day's news.

## Referral

Referral code: `4hnkatg5`

## License

MIT — see [LICENSE](LICENSE).
