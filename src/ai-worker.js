import { Chess } from "chess.js";

const game = new Chess();
const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const MATE_SCORE = 1000000;
const SEARCH_INFINITY = 2000000;

function evaluatePosition() {
  const board = game.board();

  let score = 0;
  let nonPawnMaterial = 0;

  const pawns = {
    w: Array.from({ length: 8 }, () => []),
    b: Array.from({ length: 8 }, () => [])
    
  };

  const kings = {};
  const bishops = { w: 0, b: 0 };
const rooks = { w: [], b: [] };

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const sign = piece.color === "w" ? 1 : -1;
      const center = 6 - Math.abs(3.5 - r) - Math.abs(3.5 - c);

      const value = pieceValues[piece.type];

      let positional = 0;

      if (piece.type === "p") {
        const advance = piece.color === "w" ? 7 - r : r;

        positional += advance * 8;
        positional += (3.5 - Math.abs(3.5 - c)) * 2;

        pawns[piece.color][c].push(r);
      }

      if (piece.type === "n") {
        positional += center * 12;
      }

      if (piece.type === "b") {
        positional += center * 6;
        bishops[piece.color]++;
      }

      if (piece.type === "q") {
        positional += center * 2;
      }

     if (piece.type === "r") {
  rooks[piece.color].push({ r, c });
}

      if (piece.type === "k") {
        kings[piece.color] = { r, c };
      } else if (piece.type !== "p") {
        nonPawnMaterial += value;
      }

      score += sign * (value + positional);
    }
  }

  for (const color of ["w", "b"]) {
    const sign = color === "w" ? 1 : -1;

    for (const rook of rooks[color]) {
      const ownPawns = pawns[color][rook.c];
      const enemy = color === "w" ? "b" : "w";
      const enemyPawns = pawns[enemy][rook.c];

      if (!ownPawns.length && !enemyPawns.length) {
        score += sign * 18;
      } else if (!ownPawns.length) {
        score += sign * 9;
      }

      if (
        (color === "w" && rook.r === 1) ||
        (color === "b" && rook.r === 6)
      ) {
        score += sign * 20;
      }
    }
  }

  for (const color of ["w", "b"]) {
    const sign = color === "w" ? 1 : -1;
    const enemy = color === "w" ? "b" : "w";

    for (let file = 0; file < 8; file++) {
      const ownPawns = pawns[color][file];

      if (ownPawns.length > 1) {
        score -= sign * (ownPawns.length - 1) * 14;
      }

      for (const rank of ownPawns) {
        const hasNeighbor =
          (file > 0 && pawns[color][file - 1].length > 0) ||
          (file < 7 && pawns[color][file + 1].length > 0);

        if (!hasNeighbor) {
          score -= sign * 10;
        }

        let passed = true;

        for (
          let enemyFile = Math.max(0, file - 1);
          enemyFile <= Math.min(7, file + 1);
          enemyFile++
        ) {
          for (const enemyRank of pawns[enemy][enemyFile]) {
            const enemyAhead =
              color === "w"
                ? enemyRank < rank
                : enemyRank > rank;

            if (enemyAhead) {
              passed = false;
            }
          }
        }

        if (passed) {
          const advance = color === "w" ? 7 - rank : rank;
          score += sign * (20 + advance * advance * 5);
        }
      }
    }

    if (bishops[color] >= 2) {
      score += sign * 28;
    }

    
  }

  const endgame = nonPawnMaterial < 2600;

  for (const color of ["w", "b"]) {
    const king = kings[color];
    if (!king) continue;

    const sign = color === "w" ? 1 : -1;
    const center = 6 -
      Math.abs(3.5 - king.r) -
      Math.abs(3.5 - king.c);

    if (endgame) {
      score += sign * center * 12;
    } else {
      score -= sign * Math.max(0, center) * 8;

      const castled =
        (color === "w" && king.r === 7 &&
          (king.c === 2 || king.c === 6)) ||
        (color === "b" && king.r === 0 &&
          (king.c === 2 || king.c === 6));

      if (castled) {
        score += sign * 20;
      }
    }
  }

  if (game.isCheck()) {
    score += game.turn() === "w" ? -25 : 25;
  }

  return score;
}

function evaluateForSideToMove(ply = 0) {
  if (game.isCheckmate()) {
    return -MATE_SCORE + ply;
  }

  if (game.isDraw()) {
    return 0;
  }

  const whiteScore = evaluatePosition();

  return game.turn() === "w"
    ? whiteScore
    : -whiteScore;
}

function movePriority(move) {
  let score = 0;

  if (move.captured) {
    score += 100000 +
      (pieceValues[move.captured] || 0) * 10 -
      (pieceValues[move.piece] || 0);
  }

  if (move.promotion) {
    score += 80000 + (pieceValues[move.promotion] || 0);
  }

  if (move.san?.includes("+")) {
    score += 5000;
  }

  if (move.san?.includes("#")) {
    score += 1000000;
  }

  return score;
}

function orderMoves(moves) {
  return moves.sort(
    (a, b) => movePriority(b) - movePriority(a)
  );
}

function shouldStopSearch(ctx) {
  if (ctx.stopped) return true;

  if (
    ctx.nodes >= ctx.maxNodes ||
    performance.now() >= ctx.deadline
  ) {
    ctx.stopped = true;
  }

  return ctx.stopped;
}

function quiescenceSearch(alpha, beta, ply, ctx, remaining = 5) {
  if (shouldStopSearch(ctx)) {
    return evaluateForSideToMove(ply);
  }

  ctx.nodes++;

  if (game.isCheckmate()) {
    return -MATE_SCORE + ply;
  }

  if (game.isDraw()) {
    return 0;
  }

  const inCheck = game.isCheck();
  const standPat = evaluateForSideToMove(ply);

  if (remaining <= -2) {
    return standPat;
  }

  if (!inCheck) {
    if (standPat >= beta) return beta;

    alpha = Math.max(alpha, standPat);

    if (remaining <= 0) {
      return alpha;
    }
  }

  let moves = game.moves({ verbose: true });

  if (!inCheck) {
    moves = moves.filter(move =>
      move.captured || move.promotion
    );
  }

  orderMoves(moves);

  for (const move of moves) {
    game.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion || "q"
    });

    let score;

    try {
      score = -quiescenceSearch(
        -beta,
        -alpha,
        ply + 1,
        ctx,
        remaining - 1
      );
    } finally {
      game.undo();
    }

    if (ctx.stopped) break;

    if (score >= beta) {
      return beta;
    }

    alpha = Math.max(alpha, score);
  }

  return alpha;
}

function negamax(depth, alpha, beta, ply, ctx) {
  if (shouldStopSearch(ctx)) {
    return evaluateForSideToMove(ply);
  }

  ctx.nodes++;

  if (game.isCheckmate()) {
    return -MATE_SCORE + ply;
  }

  if (game.isDraw()) {
    return 0;
  }

  if (depth <= 0) {
    return quiescenceSearch(alpha, beta, ply, ctx);
  }

  const originalAlpha = alpha;
  const originalBeta = beta;

  const key = game.fen();
  const cached = ctx.table.get(key);

  if (cached && cached.depth >= depth) {
    if (cached.bound === "exact") return cached.score;

    if (cached.bound === "lower") {
      alpha = Math.max(alpha, cached.score);
    } else if (cached.bound === "upper") {
      beta = Math.min(beta, cached.score);
    }

    if (alpha >= beta) {
      return cached.score;
    }
  }

  const moves = orderMoves(game.moves({ verbose: true }));

  if (!moves.length) {
    return game.isCheck() ? -MATE_SCORE + ply : 0;
  }

  let bestScore = -SEARCH_INFINITY;

  for (const move of moves) {
    game.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion || "q"
    });

    let score;

    try {
      score = -negamax(
        depth - 1,
        -beta,
        -alpha,
        ply + 1,
        ctx
      );
    } finally {
      game.undo();
    }

    if (ctx.stopped) break;

    bestScore = Math.max(bestScore, score);
    alpha = Math.max(alpha, score);

    if (alpha >= beta) {
      break;
    }
  }

  if (!ctx.stopped) {
    let bound = "exact";

    if (bestScore <= originalAlpha) {
      bound = "upper";
    } else if (bestScore >= originalBeta) {
      bound = "lower";
    }

    if (ctx.table.size > 40000) {
      ctx.table.clear();
    }

    ctx.table.set(key, {
      depth,
      score: bestScore,
      bound
    });
  }

  return bestScore;
}

function findBestMove({
  maxDepth = 3,
  maxMs = 500,
  maxNodes = 30000,
  randomTop = 1
} = {}) {
  const rootMoves = orderMoves(
    game.moves({ verbose: true })
  );

  if (!rootMoves.length) return null;

  const ctx = {
    nodes: 0,
    maxNodes,
    deadline: performance.now() + maxMs,
    stopped: false,
    table: new Map()
  };

  let bestMove = rootMoves[0];
  let bestScore = -SEARCH_INFINITY;
  let completedResults = [];

  for (let depth = 1; depth <= maxDepth; depth++) {
    const results = [];
    let alpha = -SEARCH_INFINITY;

    for (const move of rootMoves) {
      game.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || "q"
      });

      let score;

      try {
        score = -negamax(
          depth - 1,
          -SEARCH_INFINITY,
          -alpha,
          1,
          ctx
        );
      } finally {
        game.undo();
      }

      if (ctx.stopped) break;

      results.push({ move, score });
      alpha = Math.max(alpha, score);
    }

    if (ctx.stopped || !results.length) {
      break;
    }

    results.sort((a, b) => b.score - a.score);

    completedResults = results;
    bestMove = results[0].move;
    bestScore = results[0].score;
  }

  const candidates = completedResults.slice(
    0,
    Math.min(
      Math.max(1, randomTop),
      completedResults.length
    )
  );

  if (candidates.length > 1) {
    bestMove =
      candidates[Math.floor(Math.random() * candidates.length)].move;
  }

  return {
    move: bestMove,
    score: bestScore,
    nodes: ctx.nodes
  };
}


self.onmessage = ({ data }) => {
  try {
    game.load(data.fen);
    const result = findBestMove(data.options || {});
    self.postMessage({ id: data.id, result });
  } catch (error) {
    self.postMessage({ id: data.id, error: error?.message || String(error) });
  }
};
