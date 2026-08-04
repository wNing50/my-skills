import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWall,
  canWin,
  canPeng,
  applyClaim,
  chooseClaim,
  choosePcClaim,
  choosePcDiscard,
  createSession,
  completeRound,
  createGame,
  evaluateDiscard,
  formatTableState,
  listGangs,
  parseTile,
  scoreHandShape,
  settleExhaustedRound,
  serializeTile,
} from "./yaoji-simulator.mjs";

test("buildWall uses Sichuan 108-tile deck without honors", () => {
  const wall = buildWall({ seed: 7 });
  assert.equal(wall.length, 108);
  assert.equal(new Set(wall.map(serializeTile)).size, 27);
  assert.equal(wall.filter((tile) => serializeTile(tile) === "1T").length, 4);
  assert.equal(wall.some((tile) => tile.suit === "Z"), false);
});

test("canWin treats 1T Yaoji as wildcard for standard hand", () => {
  const hand = [
    "1T",
    "3T",
    "4T",
    "6T",
    "7T",
    "8T",
    "2W",
    "3W",
    "4W",
    "5W",
    "6W",
    "7W",
    "9W",
    "9W",
  ].map(parseTile);

  assert.equal(canWin(hand, { missingSuit: "W" }).win, false);
  assert.equal(canWin(hand, { missingSuit: "B" }).win, true);
});

test("canWin supports seven pairs when enabled", () => {
  const hand = [
    "1T",
    "1T",
    "2W",
    "2W",
    "4W",
    "4W",
    "6W",
    "6W",
    "8W",
    "8W",
    "2T",
    "2T",
    "4T",
    "4T",
  ].map(parseTile);

  assert.equal(canWin(hand, { missingSuit: "B" }).win, false);
  assert.equal(canWin(hand, { missingSuit: "B", allowSevenPairs: true }).win, true);
});

test("createGame deals 14 tiles to user and 13 to each PC", () => {
  const game = createGame({ seed: 11 });
  assert.equal(game.players[0].hand.length, 14);
  assert.equal(game.players[1].hand.length, 13);
  assert.equal(game.players[2].hand.length, 13);
  assert.equal(game.players[3].hand.length, 13);
  assert.equal(game.wall.length, 55);
  assert.equal(game.players.every((player) => ["W", "B", "T"].includes(player.missingSuit)), true);
});

test("createGame honors user-selected missing suit while PCs auto-select", () => {
  const game = createGame({ seed: 4, userMissingSuit: "B" });
  assert.equal(game.players[0].missingSuit, "B");
  assert.equal(game.players.slice(1).every((player) => ["W", "B", "T"].includes(player.missingSuit)), true);
});

test("createGame can deal from a non-user dealer", () => {
  const game = createGame({ seed: 11, dealerIndex: 2 });
  assert.equal(game.dealerIndex, 2);
  assert.equal(game.current, 2);
  assert.equal(game.players[0].hand.length, 13);
  assert.equal(game.players[1].hand.length, 13);
  assert.equal(game.players[2].hand.length, 14);
  assert.equal(game.players[3].hand.length, 13);
});

test("session rotates dealer counterclockwise across rounds and keeps dealer on dealer win", () => {
  const session = createSession({ seed: 99, initialDealerIndex: 2 });
  assert.equal(session.rounds[0].dealerIndex, 2);

  completeRound(session, { winners: [2], reason: "xuezhan-complete" });
  assert.equal(session.rounds[1].dealerIndex, 2);

  completeRound(session, { winners: [0], reason: "xuezhan-complete" });
  assert.equal(session.rounds[2].dealerIndex, 1);
});

test("discard claims prefer hu over gang and peng", () => {
  const game = createGame({ seed: 1, dealerIndex: 0 });
  game.players[1].hand = ["2W", "3W", "4W", "5W", "6W", "7W", "3T", "4T", "5T", "6T", "7T", "9W", "9W"].map(parseTile);
  game.players[1].missingSuit = "B";
  game.players[2].hand = ["8T", "8T", "8T", "3W", "4W", "5W", "6W", "7W", "8W", "2T", "3T", "4T", "5T"].map(parseTile);
  game.players[2].missingSuit = "B";
  game.players[3].hand = ["8T", "8T", "1W", "2W", "3W", "4W", "5W", "6W", "7W", "2T", "3T", "4T", "5T"].map(parseTile);
  game.players[3].missingSuit = "B";

  const claim = chooseClaim(game, { discarderIndex: 0, tileText: "8T", allowSevenPairs: true });
  assert.equal(claim.type, "hu");
  assert.equal(claim.playerIndex, 1);
});

test("discard claims scan seats counterclockwise from the discarder", () => {
  const game = createGame({ seed: 14, dealerIndex: 0 });
  game.players[1].hand = ["8T", "8T", "2W", "3W", "4W", "5W", "6W", "7W", "2B", "3B", "4B", "5B", "6B"].map(parseTile);
  game.players[1].missingSuit = "W";
  game.players[2].hand = ["8T", "8T", "2W", "3W", "4W", "5W", "6W", "7W", "2B", "3B", "4B", "5B", "6B"].map(parseTile);
  game.players[2].missingSuit = "W";
  game.players[3].hand = ["8T", "8T", "2W", "3W", "4W", "5W", "6W", "7W", "2B", "3B", "4B", "5B", "6B"].map(parseTile);
  game.players[3].missingSuit = "W";

  const claim = chooseClaim(game, { discarderIndex: 0, tileText: "8T", allowSevenPairs: true });

  assert.equal(claim.type, "peng");
  assert.equal(claim.playerIndex, 3);
});

test("players cannot claim peng or gang in their missing suit", () => {
  const game = createGame({ seed: 789, dealerIndex: 0, userMissingSuit: "W" });
  game.players[3].missingSuit = "W";
  game.players[3].hand = ["3W", "1T", "2B", "3B", "4B", "5B", "6B", "7B", "2T", "3T", "4T", "5T", "6T"].map(parseTile);
  assert.equal(canPeng(game.players[3].hand, "3W"), true);

  const pengClaim = chooseClaim(game, { discarderIndex: 1, tileText: "3W", allowSevenPairs: true });
  assert.notEqual(pengClaim.playerIndex, 3);

  game.players[3].hand = ["3W", "3W", "1T", "2B", "3B", "4B", "5B", "6B", "7B", "2T", "3T", "4T", "5T"].map(parseTile);
  const gangClaim = chooseClaim(game, { discarderIndex: 1, tileText: "3W", allowSevenPairs: true });
  assert.notEqual(gangClaim.playerIndex, 3);
});

test("peng and gang helpers identify exposed and concealed actions", () => {
  const hand = ["3W", "3W", "3W", "3W", "5B", "6B", "7B", "2T", "3T", "4T", "6T", "7T", "8T"].map(parseTile);

  assert.equal(canPeng(hand, "3W"), true);
  assert.equal(canPeng(hand, "5W"), false);
  assert.deepEqual(listGangs(hand, { discardedTile: "3W" }), [
    { type: "concealed", tile: "3W" },
    { type: "exposed", tile: "3W" },
  ]);
});

test("Yaoji can substitute for peng and gang melds", () => {
  const pengHand = ["9T", "1T", "2W", "3W", "4W", "5W", "6W", "7W", "2B", "3B", "4B", "8B", "9B"].map(parseTile);
  assert.equal(canPeng(pengHand, "9T"), true);

  const gangHand = ["9T", "9T", "9T", "1T", "2W", "3W", "4W", "5W", "6W", "7W", "2B", "3B", "4B"].map(parseTile);
  assert.deepEqual(listGangs(gangHand), [{ type: "concealed", tile: "9T", wildcards: 1 }]);
  assert.deepEqual(listGangs(gangHand, { discardedTile: "9T" }).at(-1), { type: "exposed", tile: "9T" });

  const exposedWithYaoji = ["9T", "9T", "1T", "2W", "3W", "4W", "5W", "6W", "7W", "2B", "3B", "4B", "8B"].map(parseTile);
  assert.deepEqual(listGangs(exposedWithYaoji, { discardedTile: "9T" }).at(-1), { type: "exposed", tile: "9T", wildcards: 1 });
});

test("applyClaim mutates round state for hu and peng", () => {
  const huGame = createGame({ seed: 2 });
  applyClaim(huGame, { type: "hu", playerIndex: 1, tile: "8T", from: 0, pattern: "standard" });
  assert.equal(huGame.players[1].won, true);
  assert.deepEqual(huGame.players[1].win, { type: "dianpao", from: 0, tile: "8T", pattern: "standard" });

  const pengGame = createGame({ seed: 3 });
  pengGame.players[2].hand = ["5W", "5W", "1B", "2B", "3B", "4B", "5B", "6B", "2T", "3T", "4T", "6T", "7T"].map(parseTile);
  applyClaim(pengGame, { type: "peng", playerIndex: 2, tile: "5W", from: 0 });
  assert.equal(pengGame.players[2].hand.filter((tile) => serializeTile(tile) === "5W").length, 0);
  assert.deepEqual(pengGame.players[2].melds.at(-1), { type: "peng", tile: "5W", from: 0, tiles: ["5W", "5W", "5W"] });
  assert.equal(pengGame.current, 2);
});

test("applyClaim records actual Yaoji tiles consumed in melds", () => {
  const game = createGame({ seed: 4 });
  game.players[1].hand = ["9T", "1T", "2W", "3W", "4W", "5W", "6W", "7W", "2B", "3B", "4B", "8B", "9B"].map(parseTile);

  applyClaim(game, { type: "peng", playerIndex: 1, tile: "9T", from: 0 });

  assert.equal(game.players[1].hand.some((tile) => serializeTile(tile) === "1T"), false);
  assert.deepEqual(game.players[1].melds.at(-1), {
    type: "peng",
    tile: "9T",
    from: 0,
    tiles: ["9T", "1T", "9T"],
    wildcards: 1,
  });
});

test("PC claim strategy is cautious with Yaoji peng but accepts Yaoji gang", () => {
  const game = createGame({ seed: 13 });
  const player = game.players[2];
  player.missingSuit = "B";
  player.hand = ["9T", "1T", "2W", "3W", "4W", "5W", "6W", "7W", "2B", "3B", "4B", "8B", "9B"].map(parseTile);

  assert.equal(choosePcClaim(game, { type: "peng", playerIndex: 2, tile: "9T", from: 0 }).type, "none");

  player.hand = ["9T", "9T", "1T", "2W", "3W", "4W", "5W", "6W", "7W", "2B", "3B", "4B", "8B"].map(parseTile);
  assert.equal(choosePcClaim(game, { type: "gang", playerIndex: 2, tile: "9T", from: 0 }).type, "gang");
});

test("exhausted-round settlement flags huazhu and dajiao candidates", () => {
  const game = createGame({ seed: 5 });
  game.players[0].missingSuit = "W";
  game.players[0].hand = ["1W", "2B", "3B", "4B", "5B", "6B", "7B", "2T", "3T", "4T", "5T", "6T", "8T"].map(parseTile);
  game.players[1].missingSuit = "B";
  game.players[1].hand = ["2W", "3W", "4W", "5W", "6W", "7W", "8W", "8W", "2T", "3T", "4T", "5T", "6T"].map(parseTile);
  game.players[2].missingSuit = "B";
  game.players[2].hand = ["2W", "3W", "5W", "6W", "8W", "9W", "2T", "4T", "5T", "7T", "8T", "9T", "9T"].map(parseTile);
  game.players[3].won = true;

  const settlement = settleExhaustedRound(game, { allowSevenPairs: true });
  assert.deepEqual(settlement.huazhu.map((item) => item.playerIndex), [0]);
  assert.equal(settlement.dajiao.some((item) => item.playerIndex === 2), true);
  assert.equal(settlement.ting.some((item) => item.playerIndex === 1), true);
});

test("PC discard obeys dingque before normal hand-shape heuristics", () => {
  const hand = ["1W", "2W", "3W", "4B", "5B", "6B", "7T", "8T", "9T", "2T", "3T", "4T", "5T", "6T"].map(parseTile);
  const discard = choosePcDiscard(hand, { missingSuit: "W" });
  assert.equal(discard, "1W");
});

test("hand scoring rewards complete and connected shapes", () => {
  const connected = ["2W", "3W", "4W", "5W", "6W", "7W", "2B", "2B", "3T", "4T", "5T", "6T", "7T"].map(parseTile);
  const scattered = ["1W", "3W", "5W", "8W", "9W", "1B", "4B", "7B", "9B", "2T", "5T", "8T", "9T"].map(parseTile);

  assert.equal(scoreHandShape(connected, { missingSuit: "B" }) > scoreHandShape(scattered, { missingSuit: "B" }), true);
});

test("PC discard maximizes post-discard hand quality and ting outs", () => {
  const hand = ["2W", "3W", "4W", "5W", "6W", "7W", "2T", "2T", "3T", "4T", "5T", "6T", "7T", "9T"].map(parseTile);
  const weak = evaluateDiscard(hand, "9T", { missingSuit: "B" });
  const useful = evaluateDiscard(hand, "3T", { missingSuit: "B" });

  assert.equal(weak.score > useful.score, true);
  assert.equal(choosePcDiscard(hand, { missingSuit: "B" }), "9T");
});

test("PC discard avoids visible dangerous tiles in late game when alternatives are close", () => {
  const hand = ["2W", "3W", "4W", "5W", "6W", "7W", "2T", "3T", "4T", "5T", "6T", "7T", "8T", "9T"].map(parseTile);
  const publicState = {
    turn: 15,
    players: [
      { melds: [], discards: [] },
      { melds: [{ type: "peng", tile: "9T", tiles: ["9T", "9T", "9T"] }], discards: ["8T"] },
      { melds: [], discards: ["7T", "8T"] },
      { melds: [], discards: [] },
    ],
  };

  assert.notEqual(choosePcDiscard(hand, { missingSuit: "B", publicState }), "9T");
});

test("PC claim strategy passes low-value peng but takes hu and useful gang", () => {
  const game = createGame({ seed: 12 });
  const player = game.players[2];
  player.missingSuit = "B";
  player.hand = ["5W", "5W", "5W", "2W", "3W", "4W", "6W", "7W", "2T", "3T", "4T", "6T", "7T"].map(parseTile);

  assert.equal(choosePcClaim(game, { type: "hu", playerIndex: 2, tile: "8T", from: 0 }).type, "hu");
  assert.equal(choosePcClaim(game, { type: "peng", playerIndex: 2, tile: "5W", from: 0 }).type, "none");
  assert.equal(choosePcClaim(game, { type: "gang", playerIndex: 2, tile: "5W", from: 0 }).type, "gang");
});

test("formatTableState renders public table without leaking PC concealed tiles", () => {
  const game = createGame({ seed: 21, dealerIndex: 2 });
  game.current = 0;
  game.turn = 8;
  game.players[0].hand = ["4B", "5B", "5B", "6B", "8B", "9B", "1T", "1T", "2T", "4T", "8T", "9T", "9T", "9T"].map(parseTile);
  game.players[0].discards = ["2W", "6W", "8W", "1B"];
  game.players[1].hand = ["3W", "4W", "5W", "6B", "7B", "8B", "2T", "3T", "4T", "5T"].map(parseTile);
  game.players[1].melds = [{ type: "peng", tile: "9W", from: 3, tiles: ["9W", "9W", "9W"] }];
  game.players[1].discards = ["1W", "5W", "5W", "7W"];
  game.players[2].hand = ["7B", "7B", "8B", "9B", "2W", "3W", "4W", "5T", "6T", "7T", "8T", "9T", "9T"].map(parseTile);
  game.players[2].melds = [{ type: "gang", gangType: "concealed", tile: "9T", from: 2, tiles: ["9T", "9T", "9T", "1T"], wildcards: 1 }];
  game.players[2].discards = ["1B", "4B", "6B"];
  game.players[3].hand = ["1W", "1W", "3B", "4B", "5B", "6B", "7B", "2T", "3T", "4T", "5T", "6T", "7T"].map(parseTile);
  game.players[3].discards = ["9W", "2W", "5W", "3W"];

  const table = formatTableState(game);

  assert.match(table, /Round 1\s+Dealer: PC-2\s+Wall:/);
  assert.match(table, /PC-1 hand:10/);
  assert.match(table, /PC-2 hand:13/);
  assert.match(table, /Melds: \[PENG 9W: \[9W\]\[9W\]\[9W\]\]/);
  assert.match(table, /Melds: \[GANG 9T: \[9T\]\[9T\]\[9T\]\[Y\]\]/);
  assert.match(table, /River: 2W 6W 8W 1B/);
  assert.match(table, /Your hand: \[4B\]\[5B\].*\[Y\]\[Y\].*\[9T\]\[9T\]\[9T\]/);
  assert.equal(table.includes("[3W][4W][5W]"), false);
  assert.equal(table.includes("[7B][7B][8B]"), false);
  assert.equal(table.indexOf("[ RIGHT ]") < table.indexOf("[ TOP ]"), true);
  assert.equal(table.indexOf("[ TOP ]") < table.indexOf("[ LEFT ]"), true);
});
