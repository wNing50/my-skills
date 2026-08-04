# Yaoji Mahjong Rules

This reference defines the bundled simulator's default rules. Local Yaoji Mahjong variants differ, so treat these as explicit defaults rather than universal law.

## Tile Set

Use only suited tiles:

| Suit | Code | Tiles |
| --- | --- | --- |
| Wan | `W` | `1W` through `9W`, four copies each |
| Bing/Tong | `B` | `1B` through `9B`, four copies each |
| Tiao | `T` | `1T` through `9T`, four copies each |

Total: 27 tile identities x 4 copies = 108 tiles.

`1T` is Yaoji. It acts as a wildcard in hu, peng, and gang detection.

## Round Flow

1. Shuffle the 108-tile wall.
2. Choose a dealer. The first dealer can be specified or random.
3. Deal 13 tiles to each player, then one extra tile to the dealer.
4. The user chooses their own missing suit after seeing the initial hand. PC players auto-select the suit with the lowest hand-shape score.
5. Players take turns drawing and discarding counterclockwise: seat `0 -> 3 -> 2 -> 1 -> 0`.
6. A player cannot win while holding any tile in their missing suit.
7. After each discard, resolve claims in this priority: hu, gang, peng. Chi is not allowed. A player cannot peng or gang a tile in their missing suit.
8. When a player wins, mark them complete and continue with the remaining players.
9. End after three players have won or the wall is exhausted.

## Multi-Round Dealer Rules

- A session stores `rounds` and `completedRounds`.
- If the dealer wins the completed round, the dealer keeps dealer for the next round.
- If the dealer does not win, dealer rotates counterclockwise to the next seat.
- Seat 0 is the user, but seat 0 is not automatically dealer.

Use `createSession({ seed, initialDealerIndex })` to create a multi-round session and `completeRound(session, { winners, reason })` to advance dealer state.

Use `createGame({ userMissingSuit: "W" | "B" | "T" })` when the user has already chosen a missing suit outside the interactive prompt.

## Supported Win Rules

The simulator supports:

- Standard hand: four melds plus one pair.
- Melds: triplets and suited sequences.
- Yaoji wildcard substitution while testing pairs, triplets, and sequences.
- Optional seven pairs through `allowSevenPairs: true`.

## Claims And Melds

Yaoji may substitute in claim melds:

- Peng a discarded `X` with hand tiles `X + 1T` or `1T + 1T`.
- Exposed gang a discarded `X` with any three hand tiles that can represent `X X X`, such as `X X 1T`.
- Concealed gang with any four hand tiles that can represent the same tile, such as `9T 9T 9T 1T`.
- Meld records must preserve the actual hand tiles consumed. Add `wildcards` only when at least one `1T` was consumed.
- Missing-suit restriction still applies. If a player is missing `W`, they cannot peng or gang `3W`, even with `1T`.

The simulator supports these helpers:

| Helper | Purpose |
| --- | --- |
| `chooseClaim` | Resolve discard claims, with hu before gang before peng |
| `applyClaim` | Mutate round state after hu, peng, or gang |
| `canPeng` | Check whether a hand can peng a discarded tile, including Yaoji substitution |
| `listGangs` | Detect concealed gang and exposed gang opportunities, including Yaoji substitution |
| `scoreHandShape` | Score hand quality using melds, pairs, connections, Yaoji, ting outs, and dingque penalties |
| `evaluateDiscard` | Score one discard by resulting hand shape and visible danger |
| `choosePcClaim` | Let PC take hu, take useful gang, or pass low-value peng |
| `settleExhaustedRound` | Flag huazhu, ting, and dajiao candidates when the wall is exhausted |
| `formatTableState` | Render a terminal table with user hand, PC hand counts, melds, rivers, dealer, turn, and wall count |

Gang scoring, robbed kong, multi-winner score allocation, and exact local fan calculation are still house-rule extensions.

The terminal table displays PC public information in RIGHT-TOP-LEFT order, then the user's seat.

## PC Strategy Defaults

PC decisions are deterministic scoring heuristics, not perfect play:

- Win claims are always taken.
- Missing-suit tiles are discarded before other tiles.
- Candidate discards are evaluated by the resulting hand's shape score.
- Shape score rewards Yaoji, pairs, triplets, completed sequences, connected two-tile shapes, middle tiles, and possible winning draws.
- Late-game danger score penalizes discards that match another player's exposed melds or hot suit.
- Peng is skipped unless it improves the hand enough or helps clear the missing suit. Claims that consume Yaoji get an extra penalty.
- Gang gets a larger action bonus, so PC takes most useful exposed gangs, including selected Yaoji gangs.

## Variant Switches To Ask About

Ask only when the user needs a precise local table rule:

- Should seven pairs be enabled?
- Can Yaoji be discarded freely, or only when no other legal discard exists?
- What fan/score values should peng, gang, dianpao, zimo, huazhu, and dajiao use?
- Should multiple players be allowed to hu the same discard?
- Should end scoring include cha huazhu and cha dajiao?
