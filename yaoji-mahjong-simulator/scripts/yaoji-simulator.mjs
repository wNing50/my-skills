#!/usr/bin/env node
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

const SUITS = ["W", "B", "T"];
const RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const YAOJI = "1T";

export function parseTile(text) {
  const raw = String(text).trim().toUpperCase();
  const match = raw.match(/^([1-9])([WBT])$/);
  if (!match) {
    throw new Error(`Invalid tile "${text}". Use forms like 1W, 9B, 1T.`);
  }
  return { rank: Number(match[1]), suit: match[2] };
}

export function serializeTile(tile) {
  return `${tile.rank}${tile.suit}`;
}

function tileIndex(tile) {
  return SUITS.indexOf(tile.suit) * 9 + tile.rank - 1;
}

function fromIndex(index) {
  return { suit: SUITS[Math.floor(index / 9)], rank: (index % 9) + 1 };
}

function compareTiles(a, b) {
  return tileIndex(a) - tileIndex(b);
}

function nextSeatCounterclockwise(index) {
  return (index + 3) % 4;
}

function seatCounterclockwiseFrom(index, offset) {
  return (index - offset + 4) % 4;
}

function seededRandom(seed = Date.now()) {
  let state = Number(seed) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function buildWall({ seed } = {}) {
  const tiles = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      for (let copy = 0; copy < 4; copy += 1) {
        tiles.push({ suit, rank });
      }
    }
  }
  const random = seededRandom(seed);
  for (let i = tiles.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

function countTiles(hand) {
  const counts = Array(27).fill(0);
  for (const tile of hand) counts[tileIndex(tile)] += 1;
  return counts;
}

function countTileText(hand, tileText) {
  return hand.filter((tile) => serializeTile(tile) === tileText).length;
}

function selectMeldTiles(hand, tileText, neededFromHand) {
  const exact = hand.filter((tile) => serializeTile(tile) === tileText).map(serializeTile);
  const wildcards = tileText === YAOJI ? [] : hand.filter((tile) => serializeTile(tile) === YAOJI).map(serializeTile);
  if (exact.length + wildcards.length < neededFromHand) return null;
  const selected = exact.slice(0, neededFromHand);
  const wildcardNeeded = neededFromHand - selected.length;
  return [...selected, ...wildcards.slice(0, wildcardNeeded)];
}

function withWildcardCount(meld, selectedTiles) {
  const wildcards = selectedTiles.filter((tile) => tile === YAOJI).length;
  return wildcards > 0 ? { ...meld, wildcards } : meld;
}

function hasMissingSuit(hand, missingSuit) {
  return missingSuit && hand.some((tile) => tile.suit === missingSuit);
}

function removeMelds(counts, wildcards, memo = new Set()) {
  const first = counts.findIndex((count) => count > 0);
  if (first === -1) return true;
  const key = `${counts.join("")}|${wildcards}`;
  if (memo.has(key)) return false;
  memo.add(key);

  const tryUse = (indexes) => {
    const needed = indexes.reduce((sum, index) => sum + (counts[index] > 0 ? 0 : 1), 0);
    if (needed > wildcards) return false;
    for (const index of indexes) {
      if (counts[index] > 0) counts[index] -= 1;
    }
    const ok = removeMelds(counts, wildcards - needed, memo);
    for (const index of indexes) {
      if (counts[index] >= 0 && indexes.filter((item) => item === index).length > 0) {
        counts[index] += indexes.filter((item) => item === index && counts[index] < 4).length;
        break;
      }
    }
    return ok;
  };

  if (counts[first] >= 3) {
    counts[first] -= 3;
    if (removeMelds(counts, wildcards, memo)) {
      counts[first] += 3;
      return true;
    }
    counts[first] += 3;
  }
  if (counts[first] === 2 && wildcards >= 1) {
    counts[first] -= 2;
    if (removeMelds(counts, wildcards - 1, memo)) {
      counts[first] += 2;
      return true;
    }
    counts[first] += 2;
  }
  if (counts[first] === 1 && wildcards >= 2) {
    counts[first] -= 1;
    if (removeMelds(counts, wildcards - 2, memo)) {
      counts[first] += 1;
      return true;
    }
    counts[first] += 1;
  }

  const tile = fromIndex(first);
  if (tile.rank <= 7) {
    const sequence = [first, first + 1, first + 2];
    if (sequence.every((index) => Math.floor(index / 9) === Math.floor(first / 9))) {
      const removed = [];
      let need = 0;
      for (const index of sequence) {
        if (counts[index] > 0) {
          counts[index] -= 1;
          removed.push(index);
        } else {
          need += 1;
        }
      }
      if (need <= wildcards && removeMelds(counts, wildcards - need, memo)) {
        for (const index of removed) counts[index] += 1;
        return true;
      }
      for (const index of removed) counts[index] += 1;
    }
  }

  return false;
}

function canSevenPairs(counts, wildcards) {
  let singles = 0;
  let pairs = Math.floor(wildcards / 2);
  for (const count of counts) {
    pairs += Math.floor(count / 2);
    singles += count % 2;
  }
  return singles <= wildcards && pairs + singles >= 7;
}

export function canWin(hand, { missingSuit, allowSevenPairs = false } = {}) {
  if (hand.length % 3 !== 2) return { win: false, reason: "hand-size" };
  if (hasMissingSuit(hand, missingSuit)) return { win: false, reason: "missing-suit-not-cleared" };

  const wildcards = hand.filter((tile) => serializeTile(tile) === YAOJI).length;
  const normalTiles = hand.filter((tile) => serializeTile(tile) !== YAOJI);
  const counts = countTiles(normalTiles);

  if (allowSevenPairs && canSevenPairs([...counts], wildcards)) {
    return { win: true, pattern: "seven-pairs" };
  }

  for (let pairIndex = 0; pairIndex < 27; pairIndex += 1) {
    const pairCost = Math.max(0, 2 - counts[pairIndex]);
    if (pairCost > wildcards) continue;
    counts[pairIndex] -= 2 - pairCost;
    if (removeMelds([...counts], wildcards - pairCost)) {
      counts[pairIndex] += 2 - pairCost;
      return { win: true, pattern: "standard" };
    }
    counts[pairIndex] += 2 - pairCost;
  }

  if (wildcards >= 2 && removeMelds([...counts], wildcards - 2)) {
    return { win: true, pattern: "standard" };
  }
  return { win: false, reason: "no-pattern" };
}

function chooseMissingSuit(hand) {
  const score = Object.fromEntries(SUITS.map((suit) => [suit, 0]));
  for (const tile of hand) {
    score[tile.suit] += tile.rank === 1 || tile.rank === 9 ? 1 : 2;
    if (serializeTile(tile) === YAOJI) score[tile.suit] += 3;
  }
  return SUITS.reduce((best, suit) => (score[suit] < score[best] ? suit : best), SUITS[0]);
}

function tileShapeScore(tile, hand) {
  const text = serializeTile(tile);
  if (text === YAOJI) return 100;
  const same = hand.filter((item) => serializeTile(item) === text).length;
  let score = same * 8;
  for (const delta of [-2, -1, 1, 2]) {
    if (hand.some((item) => item.suit === tile.suit && item.rank === tile.rank + delta)) {
      score += Math.abs(delta) === 1 ? 4 : 1;
    }
  }
  if (tile.rank === 1 || tile.rank === 9) score -= 2;
  return score;
}

function cloneWithoutOne(hand, tileText) {
  const next = [...hand];
  removeOne(next, tileText);
  return next;
}

function countPotentialWins(hand, { missingSuit, allowSevenPairs = true } = {}) {
  if (hasMissingSuit(hand, missingSuit)) return 0;
  let outs = 0;
  for (const suit of SUITS) {
    if (suit === missingSuit) continue;
    for (const rank of RANKS) {
      if (canWin([...hand, { suit, rank }], { missingSuit, allowSevenPairs }).win) outs += 1;
    }
  }
  return outs;
}

export function scoreHandShape(hand, { missingSuit, allowSevenPairs = true } = {}) {
  let score = 0;
  const counts = countTiles(hand.filter((tile) => serializeTile(tile) !== YAOJI));
  const missingTiles = hand.filter((tile) => tile.suit === missingSuit).length;
  score -= missingTiles * 80;
  score += hand.filter((tile) => serializeTile(tile) === YAOJI).length * 35;

  for (let index = 0; index < counts.length; index += 1) {
    const count = counts[index];
    if (count === 0) continue;
    const tile = fromIndex(index);
    if (tile.suit === missingSuit) continue;
    if (count >= 2) score += 16;
    if (count >= 3) score += 28;
    if (tile.rank >= 3 && tile.rank <= 7) score += count * 2;
    if (tile.rank === 1 || tile.rank === 9) score -= count;
  }

  for (const suit of SUITS) {
    if (suit === missingSuit) continue;
    const base = SUITS.indexOf(suit) * 9;
    for (let rank = 1; rank <= 7; rank += 1) {
      const a = counts[base + rank - 1] > 0;
      const b = counts[base + rank] > 0;
      const c = counts[base + rank + 1] > 0;
      if (a && b && c) score += 22;
      else if ((a && b) || (b && c)) score += 8;
      else if (a && c) score += 4;
    }
  }

  const win = canWin(hand, { missingSuit, allowSevenPairs });
  if (win.win) score += 500;
  score += countPotentialWins(hand, { missingSuit, allowSevenPairs }) * 12;
  return score;
}

function dangerScore(tileText, publicState) {
  if (!publicState) return 0;
  const tile = parseTile(tileText);
  const late = (publicState.turn ?? 0) >= 12 ? 1 : 0;
  let danger = late * (tile.rank >= 3 && tile.rank <= 7 ? 4 : 2);
  for (const player of publicState.players ?? []) {
    for (const meld of player.melds ?? []) {
      if (meld.tile === tileText) danger += 20;
      if (meld.tile?.endsWith(tile.suit)) danger += 4;
    }
    const recent = (player.discards ?? []).slice(-3);
    if (recent.includes(tileText)) danger -= 8;
  }
  return Math.max(0, danger);
}

export function evaluateDiscard(hand, tileText, { missingSuit, publicState, allowSevenPairs = true } = {}) {
  const tile = parseTile(tileText);
  if (tile.suit === missingSuit) {
    return { tile: tileText, score: 10000 - tileShapeScore(tile, hand), reason: "clear-missing-suit" };
  }
  if (tileText === YAOJI && hand.length > 1) {
    return { tile: tileText, score: -10000, reason: "protect-yaoji" };
  }
  const nextHand = cloneWithoutOne(hand, tileText);
  const shape = scoreHandShape(nextHand, { missingSuit, allowSevenPairs });
  const safetyPenalty = dangerScore(tileText, publicState);
  const score = shape - safetyPenalty;
  return { tile: tileText, score, shape, safetyPenalty };
}

export function choosePcDiscard(hand, { missingSuit, publicState, allowSevenPairs = true } = {}) {
  const sorted = [...hand].sort(compareTiles);
  const candidates = sorted.filter((tile) => tile.suit === missingSuit);
  const pool = candidates.length > 0 ? candidates : sorted.filter((tile) => serializeTile(tile) !== YAOJI);
  const fallback = pool.length > 0 ? pool : sorted;
  return fallback
    .map((tile) => evaluateDiscard(hand, serializeTile(tile), { missingSuit, publicState, allowSevenPairs }))
    .sort((a, b) => b.score - a.score || tileIndex(parseTile(a.tile)) - tileIndex(parseTile(b.tile)))[0].tile;
}

export function canPeng(hand, tileText) {
  return tileText !== YAOJI && selectMeldTiles(hand, tileText, 2) !== null;
}

export function listGangs(hand, { discardedTile } = {}) {
  const counts = new Map();
  for (const tile of hand) {
    const text = serializeTile(tile);
    counts.set(text, (counts.get(text) ?? 0) + 1);
  }
  const gangs = [];
  for (const [tile, count] of [...counts.entries()].sort()) {
    if (tile === YAOJI) continue;
    const selected = selectMeldTiles(hand, tile, 4);
    if (selected) gangs.push(withWildcardCount({ type: "concealed", tile }, selected));
  }
  if (discardedTile && discardedTile !== YAOJI) {
    const selected = selectMeldTiles(hand, discardedTile, 3);
    if (selected) gangs.push(withWildcardCount({ type: "exposed", tile: discardedTile }, selected));
  }
  return gangs;
}

export function chooseClaim(game, { discarderIndex, tileText, allowSevenPairs = false } = {}) {
  const claims = [];
  const tile = parseTile(tileText);
  for (let offset = 1; offset < 4; offset += 1) {
    const playerIndex = seatCounterclockwiseFrom(discarderIndex, offset);
    const player = game.players[playerIndex];
    if (player.won) continue;
    const win = canWin([...player.hand, tile], {
      missingSuit: player.missingSuit,
      allowSevenPairs,
    });
    if (win.win) claims.push({ type: "hu", playerIndex, tile: tileText, from: discarderIndex, pattern: win.pattern });
  }
  if (claims.length > 0) return claims[0];

  for (let offset = 1; offset < 4; offset += 1) {
    const playerIndex = seatCounterclockwiseFrom(discarderIndex, offset);
    const player = game.players[playerIndex];
    if (player.won) continue;
    if (tile.suit === player.missingSuit) continue;
    if (listGangs(player.hand, { discardedTile: tileText }).some((gang) => gang.type === "exposed")) {
      return { type: "gang", playerIndex, tile: tileText };
    }
  }

  for (let offset = 1; offset < 4; offset += 1) {
    const playerIndex = seatCounterclockwiseFrom(discarderIndex, offset);
    const player = game.players[playerIndex];
    if (player.won) continue;
    if (tile.suit === player.missingSuit) continue;
    if (canPeng(player.hand, tileText)) return { type: "peng", playerIndex, tile: tileText };
  }
  return { type: "none" };
}

export function choosePcClaim(game, claim, { allowSevenPairs = true } = {}) {
  if (claim.type === "none") return claim;
  if (claim.type === "hu") return claim;
  const player = game.players[claim.playerIndex];
  if (!player || player.type !== "pc") return claim;
  if (claim.tile === YAOJI) return { type: "none" };

  if (claim.type === "gang") {
    const before = scoreHandShape(player.hand, { missingSuit: player.missingSuit, allowSevenPairs });
    const selected = selectMeldTiles(player.hand, claim.tile, 3);
    if (!selected) return { type: "none" };
    let afterHand = [...player.hand];
    for (const tile of selected) afterHand = cloneWithoutOne(afterHand, tile);
    const wildcardPenalty = selected.filter((tile) => tile === YAOJI).length * 45;
    const after = scoreHandShape(afterHand, {
      missingSuit: player.missingSuit,
      allowSevenPairs,
    });
    return after + 150 - wildcardPenalty >= before ? claim : { type: "none" };
  }

  if (claim.type === "peng") {
    const before = scoreHandShape(player.hand, { missingSuit: player.missingSuit, allowSevenPairs });
    const selected = selectMeldTiles(player.hand, claim.tile, 2);
    if (!selected) return { type: "none" };
    let afterHand = [...player.hand];
    for (const tile of selected) afterHand = cloneWithoutOne(afterHand, tile);
    const wildcardPenalty = selected.filter((tile) => tile === YAOJI).length * 80;
    const after = scoreHandShape(afterHand, { missingSuit: player.missingSuit, allowSevenPairs });
    const clearsMissingSuit = parseTile(claim.tile).suit === player.missingSuit;
    const improves = after + (clearsMissingSuit ? 120 : 0) - wildcardPenalty >= before + 20;
    return improves ? claim : { type: "none" };
  }
  return claim;
}

export function applyClaim(game, claim) {
  const player = game.players[claim.playerIndex];
  if (!player || claim.type === "none") return game;
  if (claim.type === "hu") {
    player.won = true;
    player.win = {
      type: claim.from === claim.playerIndex ? "zimo" : "dianpao",
      from: claim.from,
      tile: claim.tile,
      pattern: claim.pattern,
    };
    game.log.push(`${player.name} hu ${claim.tile} from ${game.players[claim.from]?.name ?? claim.from}`);
    return game;
  }
  if (claim.type === "peng") {
    const selected = removeMeldTiles(player.hand, claim.tile, 2);
    player.melds.push(withWildcardCount({
      type: "peng",
      tile: claim.tile,
      from: claim.from,
      tiles: [...selected, claim.tile],
    }, selected));
    game.current = claim.playerIndex;
    game.log.push(`${player.name} peng ${claim.tile}`);
    return game;
  }
  if (claim.type === "gang") {
    const gangType = claim.gangType ?? "exposed";
    const handCopies = gangType === "concealed" ? 4 : 3;
    const selected = removeMeldTiles(player.hand, claim.tile, handCopies);
    player.melds.push(withWildcardCount({
      type: "gang",
      gangType,
      tile: claim.tile,
      from: claim.from,
      tiles: gangType === "concealed" ? selected : [...selected, claim.tile],
    }, selected));
    game.current = claim.playerIndex;
    player.needsSupplement = true;
    game.log.push(`${player.name} gang ${claim.tile}`);
    return game;
  }
  return game;
}

function canTing(hand, { missingSuit, allowSevenPairs = false } = {}) {
  if (hasMissingSuit(hand, missingSuit)) return false;
  for (const suit of SUITS) {
    if (suit === missingSuit) continue;
    for (const rank of RANKS) {
      if (canWin([...hand, { suit, rank }], { missingSuit, allowSevenPairs }).win) {
        return true;
      }
    }
  }
  return false;
}

export function settleExhaustedRound(game, { allowSevenPairs = false } = {}) {
  const huazhu = [];
  const ting = [];
  const dajiao = [];
  for (let playerIndex = 0; playerIndex < game.players.length; playerIndex += 1) {
    const player = game.players[playerIndex];
    if (player.won) continue;
    if (hasMissingSuit(player.hand, player.missingSuit)) {
      huazhu.push({ playerIndex, missingSuit: player.missingSuit, penalty: "huazhu" });
      continue;
    }
    if (canTing(player.hand, { missingSuit: player.missingSuit, allowSevenPairs })) {
      ting.push({ playerIndex });
    } else {
      dajiao.push({ playerIndex, penalty: "dajiao" });
    }
  }
  return { huazhu, ting, dajiao };
}

export function createGame({ seed, playerName = "User", dealerIndex = 0, roundNumber = 1, userMissingSuit } = {}) {
  const wall = buildWall({ seed });
  const players = [
    { name: playerName, type: "human", hand: [], melds: [], discards: [], won: false },
    { name: "PC-1", type: "pc", hand: [], melds: [], discards: [], won: false },
    { name: "PC-2", type: "pc", hand: [], melds: [], discards: [], won: false },
    { name: "PC-3", type: "pc", hand: [], melds: [], discards: [], won: false },
  ];
  for (let round = 0; round < 13; round += 1) {
    for (const player of players) player.hand.push(wall.pop());
  }
  players[dealerIndex].hand.push(wall.pop());
  for (const [playerIndex, player] of players.entries()) {
    player.hand.sort(compareTiles);
    player.missingSuit = playerIndex === 0 && userMissingSuit ? userMissingSuit : chooseMissingSuit(player.hand);
  }
  return { wall, players, current: dealerIndex, dealerIndex, roundNumber, turn: 1, finished: false, log: [] };
}

export function createSession({ seed = Date.now(), initialDealerIndex, playerName = "User" } = {}) {
  const random = seededRandom(seed);
  const dealerIndex = initialDealerIndex ?? Math.floor(random() * 4);
  const firstRound = createGame({ seed, playerName, dealerIndex, roundNumber: 1 });
  return { seed, playerName, rounds: [firstRound], completedRounds: [] };
}

async function askUserMissingSuit(rl, hand) {
  output.write(`Your initial hand: ${formatHand(hand)}\n`);
  while (true) {
    const answer = (await rl.question("Choose your missing suit (W=Wan, B=Bing/Tong, T=Tiao): ")).trim().toUpperCase();
    if (SUITS.includes(answer)) return answer;
    output.write("Please enter W, B, or T.\n");
  }
}

export function completeRound(session, { winners = [], reason = "completed" } = {}) {
  const round = session.rounds[session.rounds.length - 1];
  round.finished = true;
  round.finishReason = reason;
  round.winners = [...winners];
  session.completedRounds.push({
    roundNumber: round.roundNumber,
    dealerIndex: round.dealerIndex,
    winners: [...winners],
    reason,
  });
  const dealerWon = winners.includes(round.dealerIndex);
  const nextDealerIndex = dealerWon ? round.dealerIndex : nextSeatCounterclockwise(round.dealerIndex);
  const nextRound = createGame({
    seed: Number(session.seed) + round.roundNumber,
    playerName: session.playerName,
    dealerIndex: nextDealerIndex,
    roundNumber: round.roundNumber + 1,
  });
  session.rounds.push(nextRound);
  return nextRound;
}

function formatHand(hand) {
  return [...hand].sort(compareTiles).map(serializeTile).join(" ");
}

function formatTileBlock(tileText) {
  return `[${tileText === YAOJI ? "Y" : tileText}]`;
}

function formatMeld(meld) {
  const label = meld.type.toUpperCase();
  const tiles = (meld.tiles ?? []).map(formatTileBlock).join("");
  return `[${label} ${meld.tile}: ${tiles}]`;
}

function formatRiver(discards, width = 36) {
  if (!discards.length) return "-";
  const rows = [];
  let row = "";
  for (const tile of discards) {
    const next = row ? `${row} ${tile}` : tile;
    if (next.length > width) {
      rows.push(row);
      row = tile;
    } else {
      row = next;
    }
  }
  if (row) rows.push(row);
  return rows.join("\n       ");
}

function playerSummary(player, { revealHand = false } = {}) {
  const melds = player.melds.length ? player.melds.map(formatMeld).join(" ") : "-";
  const lines = [
    `${player.name} hand:${player.hand.length} missing:${player.missingSuit}${player.won ? " WIN" : ""}`,
    `Melds: ${melds}`,
    `River: ${formatRiver(player.discards)}`,
  ];
  if (revealHand) {
    lines.push(`Your hand: ${[...player.hand].sort(compareTiles).map((tile) => formatTileBlock(serializeTile(tile))).join("")}`);
  }
  return lines;
}

function padLine(text, width) {
  const plainLength = [...text].length;
  return plainLength >= width ? text.slice(0, width) : text + " ".repeat(width - plainLength);
}

function boxed(lines, width = 72) {
  const top = `+${"-".repeat(width + 2)}+`;
  const body = lines.flatMap((line) => String(line).split("\n")).map((line) => `| ${padLine(line, width)} |`);
  return [top, ...body, top].join("\n");
}

export function formatTableState(game) {
  const players = game.players;
  const header = `Round ${game.roundNumber}   Dealer: ${players[game.dealerIndex].name}   Wall: ${game.wall.length}   Turn: ${players[game.current].name}`;
  const lines = [
    header,
    "",
    "[ RIGHT ]",
    ...playerSummary(players[3]),
    "",
    "                 [ TOP ]",
    ...playerSummary(players[2]),
    "",
    "[ LEFT ]",
    ...playerSummary(players[1]),
    "",
    "                 [ YOU ]",
    ...playerSummary(players[0], { revealHand: true }),
  ];
  return boxed(lines);
}

function removeOne(hand, tileText) {
  const index = hand.findIndex((tile) => serializeTile(tile) === tileText);
  if (index < 0) throw new Error(`Tile ${tileText} is not in hand.`);
  return hand.splice(index, 1)[0];
}

function removeCopies(hand, tileText, count) {
  const removed = [];
  for (let index = 0; index < count; index += 1) {
    removed.push(removeOne(hand, tileText));
  }
  return removed;
}

function removeMeldTiles(hand, tileText, neededFromHand) {
  const selected = selectMeldTiles(hand, tileText, neededFromHand);
  if (!selected) throw new Error(`Cannot form ${tileText} meld from hand.`);
  for (const selectedTile of selected) {
    removeOne(hand, selectedTile);
  }
  return selected;
}

function publicState(game) {
  return formatTableState(game);
}

async function resolveClaimAfterDiscard(game, { discarderIndex, tileText, rl }) {
  let claim = chooseClaim(game, { discarderIndex, tileText, allowSevenPairs: true });
  if (claim.type === "none") return false;
  const player = game.players[claim.playerIndex];
  if (player.type === "pc") {
    claim = choosePcClaim(game, claim, { allowSevenPairs: true });
    if (claim.type === "none") return false;
  }
  if (player.type === "human") {
    const answer = (await rl.question(`You can ${claim.type} ${tileText}. Take it? (y/N): `)).trim().toLowerCase();
    if (answer !== "y" && answer !== "yes") return false;
  }
  applyClaim(game, claim);
  output.write(`${player.name} claims ${tileText} with ${claim.type}.\n`);
  if (claim.type === "hu" && game.players.filter((item) => item.won).length >= 3) {
    game.finished = true;
  }
  return claim.type !== "hu";
}

export async function runInteractive({ seed } = {}) {
  const rl = readline.createInterface({ input, output });
  const game = createGame({ seed });
  output.write("Yaoji Mahjong: 108 tiles, no chi, dingque, xuezhan, 1T wildcard.\n");
  game.players[0].missingSuit = await askUserMissingSuit(rl, game.players[0].hand);
  output.write(`Dealer is ${game.players[game.dealerIndex].name}. Your missing suit is ${game.players[0].missingSuit}. Yaoji is 1T.\n`);

  while (!game.finished && game.wall.length > 0) {
    const player = game.players[game.current];
    if (player.won) {
      game.current = nextSeatCounterclockwise(game.current);
      continue;
    }
    if (player.hand.length % 3 === 1) {
      player.hand.push(game.wall.pop());
      player.hand.sort(compareTiles);
    }
    if (player.needsSupplement) {
      player.hand.push(game.wall.pop());
      player.hand.sort(compareTiles);
      player.needsSupplement = false;
    }
    const win = canWin(player.hand, { missingSuit: player.missingSuit, allowSevenPairs: true });
    if (win.win) {
      player.won = true;
      output.write(`${player.name} wins by self draw (${win.pattern}).\n`);
      if (game.players.filter((item) => item.won).length >= 3) break;
      game.current = nextSeatCounterclockwise(game.current);
      continue;
    }
    if (player.type === "human") {
      output.write("\n" + publicState(game) + "\n");
      output.write(`Your hand: ${formatHand(player.hand)}\n`);
      let answer = "";
      while (!answer) {
        answer = (await rl.question("Discard tile, or type hint: ")).trim().toUpperCase();
        if (answer === "HINT") {
          output.write(`Suggestion: ${choosePcDiscard(player.hand, { missingSuit: player.missingSuit })}\n`);
          answer = "";
        }
      }
      const discarded = removeOne(player.hand, answer);
      player.discards.push(serializeTile(discarded));
      output.write(`You discard ${serializeTile(discarded)}.\n`);
      if (await resolveClaimAfterDiscard(game, { discarderIndex: game.current, tileText: serializeTile(discarded), rl })) {
        continue;
      }
    } else {
      const discard = choosePcDiscard(player.hand, { missingSuit: player.missingSuit });
      removeOne(player.hand, discard);
      player.discards.push(discard);
      output.write(`${player.name} discards ${discard}.\n`);
      if (await resolveClaimAfterDiscard(game, { discarderIndex: game.current, tileText: discard, rl })) {
        continue;
      }
    }
    game.current = nextSeatCounterclockwise(game.current);
  }

  rl.close();
  output.write(game.wall.length === 0 ? "Wall exhausted. Check ting/dajiao manually if scoring is needed.\n" : "Round complete.\n");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const seedArg = process.argv.find((arg) => arg.startsWith("--seed="));
  await runInteractive({ seed: seedArg ? Number(seedArg.split("=")[1]) : undefined });
}
