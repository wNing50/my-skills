---
name: yaoji-mahjong-simulator
description: Use when a user wants Codex to host, simulate, play-test, or explain a single-human Yaoji Mahjong game against three PC players, including multi-round dealer rotation, Sichuan-style 108-tile rules, dingque, no chi, xuezhan continuation, Yaoji wildcard handling, discard claims, peng/gang, strategic PC scoring, graphical terminal table display, turn prompts, or local command-line simulation.
---

# Yaoji Mahjong Simulator

## Overview

Host a multi-round single-human Yaoji Mahjong session against three PC players. Default to a Sichuan-style version: 108 suited tiles, no chi, dingque, xuezhan continuation, rotating dealer, and `1T` as the Yaoji wildcard for hu, peng, and gang.

Use `scripts/yaoji-simulator.mjs` when the user wants an actual playable command-line round, deterministic testing, or PC decisions. Read `references/rules.md` when the user asks for rule details, scoring extensions, or local-variant changes.

## Default Rules

Assume these unless the user says otherwise:

- Tiles: 108 tiles only, four copies of 1-9 in Wan, Bing, and Tiao. Do not include winds or dragons.
- Notation: `W` = Wan, `B` = Bing/Tong, `T` = Tiao. `1T` is Yaoji.
- Seating: user is seat 0; PC players are seats 1-3. Dealer may be any seat. Play order is counterclockwise: 0 -> 3 -> 2 -> 1 -> 0.
- Dealer: first dealer may be random or specified. Dealer keeps dealer on dealer win; otherwise dealer rotates counterclockwise to the next seat.
- Dealing: dealer starts with 14 tiles, each other player starts with 13.
- Dingque: the user must choose their own missing suit after seeing the initial hand. PC players auto-select one missing suit. A player cannot win while still holding that suit.
- Actions: no chi. Support discard, self-draw win, dianpao, peng, exposed gang, concealed gang detection, and supplement draw after gang. Players cannot peng or gang their missing suit, even with Yaoji substitution.
- Yaoji: `1T` is a wildcard for hu, peng, and gang. Prefer not to discard it. Record melds with the actual tiles consumed, including `wildcards` when one or more Yaoji tiles were used.
- Win shape: standard four melds plus one pair. Seven pairs is optional; enable it when the user asks or when running the script interactively.
- Xuezhan: after a player wins, keep the remaining players going until three players have won or the wall is exhausted.

## Running A Round

From the skill directory or repo root:

```powershell
node .\yaoji-mahjong-simulator\scripts\yaoji-simulator.mjs --seed=123
```

During the human turn:

- At the start of a round, inspect the initial hand and enter `W`, `B`, or `T` to choose the user's missing suit.
- Enter a tile such as `3W`, `9B`, or `2T` to discard it.
- Enter `hint` to ask the PC heuristic for a suggested discard.
- Show the graphical terminal table from `formatTableState`: wall count, dealer, current player, PC sections in RIGHT-TOP-LEFT order, each player's hand count, missing suit, melds, river, and the user's full hand.
- Keep hidden PC hands hidden. Show only PC hand counts, public melds, public rivers, missing suits, and wins.

## Hosting Workflow

1. State the default rule set in one sentence and ask for corrections only if the user appears to need a specific local variant.
2. Start the simulator for live play when possible. Show the user's initial hand and ask them to choose `W`, `B`, or `T` for dingque before the first turn. If a command-line session is inconvenient, use the same rules and functions mentally to narrate turns.
3. On each user turn, show `formatTableState(game)` and available commands.
4. For PC turns, use `choosePcDiscard`; PCs never inspect the user's hidden hand.
5. After each discard, call `chooseClaim` and then `applyClaim` if the human accepts or a PC takes the claim. Hu outranks gang and peng.
6. For win checks, call `canWin(hand, { missingSuit, allowSevenPairs })`. Explain failed wins with the returned reason when useful.
7. At wall exhaustion, call `settleExhaustedRound` to flag huazhu, ting, and dajiao candidates. Treat scores as a skeleton unless the user gives house scoring.

## PC Strategy

PC behavior is scoring-based but still transparent:

- Win immediately when `canWin` succeeds.
- Take winning discard claims before any gang or peng.
- Treat dingque as a hard rule: discard missing-suit tiles before normal hand-shape optimization.
- Use `evaluateDiscard` and `scoreHandShape` to compare candidate discards by post-discard hand quality.
- Preserve Yaoji, pairs, triplets, completed sequences, connected middle shapes, and tiles that increase ting outs.
- Penalize dangerous late-game discards using public melds and recent discards.
- Use `choosePcClaim` for peng/gang decisions. PC always takes hu, usually takes useful gang, may pass low-value peng, and penalizes claims that consume Yaoji.

Do not describe PC decisions as optimal Mahjong AI. Call them lightweight scoring heuristics.

## Common Mistakes

- Do not use a 136-tile deck with winds and dragons unless the user explicitly asks for a non-Sichuan house variant.
- Do not allow chi by default.
- Do not let a player win while still holding their missing suit.
- Do not let a player peng or gang their missing suit, even if `1T` can substitute the missing-suit tile.
- Do not auto-pick the user's missing suit. Only PC missing suits are automatic.
- Do not assume the user is dealer; dealer is part of round state.
- Do not advance turns or dealer rotation clockwise; use counterclockwise seat order.
- Do not reveal PC hands during hosted play.
- Do not replace the graphical table with a raw list unless the terminal cannot render it.
- Do not discard or consume `1T` as an ordinary low tile in PC logic; using it for peng/gang should be explicit and recorded.
- Do not treat Yaoji as a scoring chicken from Guizhou Zhuoji Mahjong; here it is a wildcard tile.
