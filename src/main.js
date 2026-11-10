
import { Chess } from "chess.js";
import { initializeUpdater } from "./updater.js";

// ==========================================
// CHESS ACADEMY v0.6.0
// GAME ENGINE + DEVELOPER MODE
// ==========================================

const game = new Chess();

const $ = id => document.getElementById(id);

const symbols = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟"
};

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];

const pieceValues = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// ==========================================
// GAME STATE
// ==========================================

let selectedSquare = null;
let legalMoves = [];
let flipped = false;
let thinking = false;
let botLevel = 3;
let playerColor = "w";
let botTimer = null;

const appStartedAt = performance.now();

function setLia(message) {
  const element = $("lia-message");
  if (element) element.textContent = message;
}

function getSquareName(file, rank) {
  return files[file] + rank;
}

// ==========================================
// DEVELOPER LOGGER
// ==========================================

const DEV_KEY = "chess_academy_developer_mode";
const DEV_LOG_KEY = "chess_academy_dev_logs";

let devLogs = [];
let devTapCount = 0;
let devTapTimer = null;

function devIsActive() {
  try {
    return localStorage.getItem(DEV_KEY) === "true";
  } catch {
    return false;
  }
}

function devLog(message, type = "INFO") {
  const time = new Date().toLocaleTimeString();
  const entry = `[${time}] [${type}] ${message}`;

  devLogs.push(entry);

  if (devLogs.length > 150) {
    devLogs.shift();
  }

  const log = $("dev-log");

  if (log && devIsActive()) {
    log.textContent = devLogs.join("\n");
    log.scrollTop = log.scrollHeight;
  }

  try {
    sessionStorage.setItem(
      DEV_LOG_KEY,
      JSON.stringify(devLogs)
    );
  } catch {}
}

// ==========================================
// DEVELOPER MODE ACTIVATION
// ==========================================

function devSetActive(active) {
  try {
    if (active) {
      localStorage.setItem(DEV_KEY, "true");
    } else {
      localStorage.removeItem(DEV_KEY);
    }
  } catch (error) {
    console.warn("Developer Mode storage error:", error);
  }

  const panel = $("developer-panel");

  if (panel) panel.hidden = !active;

  if (active) {
    devLog("Developer Mode ativado.");
    devRefresh();
    setLia("Developer Mode ativado. Console disponível!");
  } else {
    setLia("Developer Mode desativado.");
  }
}

function devInitialize() {
  const version = $("app-version");
  const panel = $("developer-panel");

  if (!version || !panel) {
    console.error("Developer Mode: elementos não encontrados.");
    return;
  }

  try {
    const savedLogs = sessionStorage.getItem(DEV_LOG_KEY);

    if (savedLogs) {
      const parsed = JSON.parse(savedLogs);

      if (Array.isArray(parsed)) {
        devLogs = parsed.slice(-150);
      }
    }
  } catch {
    devLogs = [];
  }

  panel.hidden = !devIsActive();

  function handleSecretTap() {
    devTapCount++;

    clearTimeout(devTapTimer);

    devTapTimer = setTimeout(() => {
      devTapCount = 0;
    }, 2500);

    if (devTapCount >= 7) {
      devTapCount = 0;
      devSetActive(!devIsActive());
    }
  }

  version.addEventListener("click", handleSecretTap);

  version.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSecretTap();
    }
  });

  $("dev-refresh").addEventListener("click", () => {
    devRefresh();
    devLog("Diagnóstico atualizado.");
  });

  $("dev-test-moves").addEventListener("click", devTestMoves);
  $("dev-test-animation").addEventListener("click", devTestAnimation);
  $("dev-test-sound").addEventListener("click", devTestSound);
  $("dev-export").addEventListener("click", devExportReport);

  $("dev-clear-log").addEventListener("click", () => {
    devLogs = [];

    const log = $("dev-log");

    if (log) log.textContent = "Console limpo.";

    devLog("Console reiniciado.");
  });

  $("dev-close").addEventListener("click", () => {
    devSetActive(false);
  });

  if (devIsActive()) {
    $("dev-log").textContent = devLogs.join("\n");
    devRefresh();
  }

  devLog("Developer Console inicializado.");
}

// ==========================================
// DEVELOPER DIAGNOSTICS
// ==========================================

function devRefresh() {
  if (!devIsActive()) return;

  $("dev-game-state").textContent =
    game.isGameOver() ? "Finalizada" : "Em andamento";

  $("dev-legal-count").textContent =
    game.moves().length;

  $("dev-turn").textContent =
    game.turn() === "w" ? "Brancas" : "Pretas";

  $("dev-ai-level").textContent = botLevel;

  const memory = performance.memory;

  $("dev-memory").textContent = memory
    ? (memory.usedJSHeapSize / 1048576).toFixed(2) + " MB"
    : "N/D";

  const uptime = Math.floor(
    (performance.now() - appStartedAt) / 1000
  );

  $("dev-uptime").textContent = uptime + "s";
}

function devTestMoves() {
  if (!devIsActive()) return;

  const before = game.fen();
  const moves = game.moves({ verbose: true });
  const after = game.fen();

  const unchanged = before === after;

  devLog(
    `Teste de movimentos: ${moves.length} movimentos legais.`
  );

  devLog(
    unchanged
      ? "Integridade da partida preservada."
      : "ATENÇÃO: posição modificada!",
    unchanged ? "SUCCESS" : "ERROR"
  );

  devRefresh();
}

function devTestAnimation() {
  if (!devIsActive()) return;

  const board = $("board");

  board.classList.remove("dev-pulse");
  void board.offsetWidth;
  board.classList.add("dev-pulse");

  setTimeout(() => {
    board.classList.remove("dev-pulse");
  }, 2200);

  devLog("Teste visual executado.", "SUCCESS");
}

async function devTestSound() {
  if (!devIsActive()) return;

  try {
    const AudioClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioClass) {
      throw new Error("Web Audio indisponível.");
    }

    const audio = new AudioClass();

    await audio.resume();

    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 660;

    gain.gain.setValueAtTime(0.12, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audio.currentTime + 0.3
    );

    oscillator.connect(gain);
    gain.connect(audio.destination);

    oscillator.start();
    oscillator.stop(audio.currentTime + 0.3);

    oscillator.onended = () => audio.close();

    devLog("Teste de áudio executado.", "SUCCESS");
  } catch (error) {
    devLog("Erro no áudio: " + error.message, "ERROR");
  }
}

function devExportReport() {
  if (!devIsActive()) return;

  const report = {
    application: "Chess Academy",
    version: "0.6.0",
    generatedAt: new Date().toISOString(),
    developerMode: devIsActive(),
    game: {
      fen: game.fen(),
      turn: game.turn(),
      history: game.history(),
      legalMoves: game.moves().length,
      gameOver: game.isGameOver()
    },
    ai: {
      level: botLevel,
      playerColor
    },
    browser: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      online: navigator.onLine
    },
    logs: devLogs
  };

  const blob = new Blob(
    [JSON.stringify(report, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "chess-academy-diagnostic.json";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  devLog("Relatório exportado.", "SUCCESS");
}

// ==========================================
// CHESS BOARD
// ==========================================

function renderBoard({ animateMoves = [] } = {}) {
    const board = $("board");

    // Save the original positions of moving pieces.
    const animationStarts = animateMoves.map(move => {
        const source = board.querySelector(
            `[data-square="${move.from}"] .piece-glyph`
        );

        if (!source) return null;

        return {
            to: move.to,
            rect: source.getBoundingClientRect()
        };
    }).filter(Boolean);

    board.innerHTML = "";

    const position = game.board();
    const history = game.history({ verbose: true });
    const lastMove = history[history.length - 1];

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const rank = flipped ? row + 1 : 8 - row;
            const file = flipped ? 7 - col : col;

            const squareName = getSquareName(file, rank);
            const piece = position[8 - rank][file];

            const square = document.createElement("button");

            square.type = "button";
            square.className =
                "square " +
                ((file + rank) % 2 === 0 ? "light" : "dark");

            square.dataset.square = squareName;
            square.setAttribute("aria-label", squareName);

            const coordinate = document.createElement("span");

            coordinate.className = "square-coordinate";
            coordinate.textContent = squareName;

            square.appendChild(coordinate);

            // Chess piece.
            if (piece) {
                const glyph = document.createElement("span");

                glyph.className = "piece-glyph";
                glyph.textContent =
                    symbols[piece.color + piece.type];

                glyph.dataset.piece =
                    piece.color + piece.type;

                square.classList.add(
                    piece.color === "w"
                        ? "white-piece"
                        : "black-piece"
                );

                square.appendChild(glyph);
            }

            if (selectedSquare === squareName) {
                square.classList.add("selected");
            }

            const possible = legalMoves.find(
                move => move.to === squareName
            );

            if (possible) {
                square.classList.add("possible");

                if (piece) {
                    square.classList.add("capture");
                }
            }

            if (
                lastMove &&
                (
                    lastMove.from === squareName ||
                    lastMove.to === squareName
                )
            ) {
                square.classList.add("last-move");
            }

            square.addEventListener("click", () => {
                handleSquareClick(squareName);
            });

            board.appendChild(square);
        }
    }

    if (animationStarts.length) {
        requestAnimationFrame(() => {
            for (const animation of animationStarts) {
                const destination = board.querySelector(
                    `[data-square="${animation.to}"] .piece-glyph`
                );

                if (!destination) continue;

                const targetRect =
                    destination.getBoundingClientRect();

                const dx =
                    animation.rect.left +
                    animation.rect.width / 2 -
                    (targetRect.left + targetRect.width / 2);

                const dy =
                    animation.rect.top +
                    animation.rect.height / 2 -
                    (targetRect.top + targetRect.height / 2);

              
destination.animate(
  [
    {
      transform: `translate(${dx}px, ${dy}px) scale(0.82) rotate(-5deg)`,
      opacity: 0.75
    },
    {
      transform: "translate(0px, 0px) scale(1.08) rotate(1deg)",
      opacity: 1,
      offset: 0.78
    },
    {
      transform: "translate(0px, 0px) scale(1) rotate(0deg)",
      opacity: 1
    }
  ],
  {
    duration: 420,
    easing: "cubic-bezier(0.2, 0.85, 0.25, 1)"
  }
);

            }
        });
    }

    updateInformation();
    devRefresh();
}

// ==========================================
// MOVE ANIMATION
// ==========================================

function getAnimationMoves(move) {
    const animations = [
        {
            from: move.from,
            to: move.to
        }
    ];

    const rank = move.from[1];

    if (move.flags?.includes("k")) {
        animations.push({
            from: `h${rank}`,
            to: `f${rank}`
        });
    }

    if (move.flags?.includes("q")) {
        animations.push({
            from: `a${rank}`,
            to: `d${rank}`
        });
    }

    return animations;
}

// ==========================================
// PLAYER MOVEMENT
// ==========================================

function handleSquareClick(square) {
  if (thinking || game.isGameOver()) return;
  if (game.turn() !== playerColor) return;

  const piece = game.get(square);

  if (!selectedSquare) {
    if (!piece || piece.color !== playerColor) return;

    selectedSquare = square;

    legalMoves = game.moves({
      square,
      verbose: true
    });

    renderBoard();
    return;
  }

  if (square === selectedSquare) {
    selectedSquare = null;
    legalMoves = [];

    renderBoard();
    return;
  }

  const move = legalMoves.find(item => item.to === square);

  if (move) {
    try {
      const result = game.move({
        from: selectedSquare,
        to: square,
        promotion: "q"
      });

      devLog(`Jogada do jogador: ${result.san}`);

      selectedSquare = null;
      legalMoves = [];

      renderBoard({animateMoves: getAnimationMoves(result)});

      updateHistory();

      if (!game.isGameOver()) {
        thinking = true;
        updateInformation();

        setLia("Boa jogada! Estou pensando na minha resposta.");

        botTimer = window.setTimeout(makeBotMove, 350);
      } else {
        finishGame();
      }
    } catch (error) {
      setLia("Esse movimento não foi possível. Tente outro.");
      devLog("Erro de movimento: " + error.message, "ERROR");
    }

    return;
  }

  if (piece && piece.color === playerColor) {
    selectedSquare = square;

    legalMoves = game.moves({
      square,
      verbose: true
    });
  } else {
    selectedSquare = null;
    legalMoves = [];
  }

  renderBoard();
}


// ==========================================
// AI CONTROL
// ==========================================

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

// ==========================================
// OPPONENT AI
// ==========================================

function makeBotMove() {
  botTimer = null;

  if (game.isGameOver() || game.turn() === playerColor) {
    thinking = false;
    updateInformation();
    return;
  }

  const depth = [0, 1, 2, 2, 3, 4][botLevel];

  const result = findBestMove({
    maxDepth: depth,
    maxMs: botLevel >= 5 ? 750 : 500,
    maxNodes: botLevel >= 5 ? 45000 : 30000,
    randomTop: [0, 5, 4, 2, 1, 1][botLevel]
  });

  if (!result?.move) {
    thinking = false;
    finishGame();
    return;
  }

  const move = result.move;

  const played = game.move({
    from: move.from,
    to: move.to,
    promotion: move.promotion || "q"
  });

  devLog(
    `IA: ${played.san} | ${result.nodes} nós analisados`
  );

  thinking = false;
  selectedSquare = null;
  legalMoves = [];

  renderBoard({
    animateMoves: getAnimationMoves(played)
  });

  updateHistory();
  updateInformation();

  if (game.isGameOver()) {
    finishGame();
  } else {
    setLia(
      game.isCheck()
        ? "Xeque! Preciso proteger meu rei."
        : `Minha jogada foi ${played.san}. Sua vez!`
    );
  }
}


// ==========================================
// HISTORY
// ==========================================

function updateHistory() {
  const container = $("moves");

  container.innerHTML = "";

  const history = game.history();

  for (let i = 0; i < history.length; i += 2) {
    const row = document.createElement("div");

    row.className = "move-row";

    const number = document.createElement("span");
    number.textContent = `${Math.floor(i / 2) + 1}.`;

    const white = document.createElement("span");
    white.textContent = history[i] || "";

    const black = document.createElement("span");
    black.textContent = history[i + 1] || "";

    row.append(number, white, black);
    container.appendChild(row);
  }

  container.scrollTop = container.scrollHeight;
}


// ==========================================
// THEME SYSTEM
// ==========================================

function applyTheme(theme) {
  const selectedTheme =
    theme === "light" ? "light" : "dark";

  document.body.dataset.theme = selectedTheme;

  const button = $("theme-toggle");

  if (button) {
    button.textContent =
      selectedTheme === "dark"
        ? "Modo claro"
        : "Modo escuro";

    button.setAttribute(
      "aria-pressed",
      String(selectedTheme === "light")
    );
  }

  try {
    localStorage.setItem(
      "chess_academy_theme",
      selectedTheme
    );
  } catch {}
}

function toggleTheme() {
  const current =
    document.body.dataset.theme || "dark";

  applyTheme(current === "dark" ? "light" : "dark");
}


// ==========================================
// GAME INFORMATION
// ==========================================

// ==========================================
// LEGAL MOVE COUNTER
// ==========================================

function updateLegalMoveCount() {
    const counter = $("legal-move-count");

    if (!counter) return;

    const count = game.moves().length;

    counter.textContent = count;

    counter.setAttribute(
        "aria-label",
        `${count} movimentos legais`
    );
}

function updateInformation() {
  let status = "Sua vez de jogar.";

  if (thinking) {
    status = "O adversário está pensando...";
  } else if (game.isCheckmate()) {
    status = game.turn() === "w"
      ? "Xeque-mate! O adversário venceu."
      : "Xeque-mate! Você venceu!";
  } else if (game.isDraw()) {
    status = "Empate!";
  } else if (game.isCheck()) {
    status = "Xeque!";
  } else if (game.turn() !== playerColor) {
    status = "Vez do adversário.";
  }

  $("status").textContent = status;
  updateLegalMoveCount();
  devRefresh();
}


// ==========================================
// GAME RESULT
// ==========================================

let confettiFrame = null;
let confettiParticles = [];

function stopConfetti() {
  if (confettiFrame !== null) {
    cancelAnimationFrame(confettiFrame);
    confettiFrame = null;
  }

  confettiParticles = [];

  const canvas = $("confetti-canvas");
  const ctx = canvas?.getContext("2d");

  if (canvas && ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function startConfetti() {
  stopConfetti();

  if (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const canvas = $("confetti-canvas");
  const stage = $("board-stage");

  if (!canvas || !stage) return;

  const rect = stage.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  if (!width || !height) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  confettiParticles = Array.from({ length: 160 }, () => ({
    x: Math.random() * width,
    y: -Math.random() * height * 0.5,

    vx: (Math.random() - 0.5) * 5,
    vy: 2 + Math.random() * 4,

    width: 4 + Math.random() * 5,
    height: 7 + Math.random() * 9,

    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.16,

    hue: Math.floor(Math.random() * 360)
  }));

  function animate() {
    ctx.clearRect(0, 0, width, height);

    let remaining = 0;

    for (const particle of confettiParticles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.035;
      particle.rotation += particle.spin;
      particle.vx *= 0.998;

      if (particle.y > height + 30) continue;

      remaining++;

      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);

      ctx.fillStyle = `hsl(${particle.hue}, 90%, 60%)`;

      ctx.fillRect(
        -particle.width / 2,
        -particle.height / 2,
        particle.width,
        particle.height
      );

      ctx.restore();
    }

    if (remaining > 0) {
      confettiFrame = requestAnimationFrame(animate);
    } else {
      stopConfetti();
    }
  }

  confettiFrame = requestAnimationFrame(animate);
}

function showGameResult(message, won = false) {
  const overlay = $("game-result");
  const resultMessage = $("result-message");

  if (!overlay || !resultMessage) return;

  resultMessage.textContent = message;
  overlay.hidden = false;

  if (won) {
    startConfetti();
  } else {
    stopConfetti();
  }
}

function hideGameResult() {
  const overlay = $("game-result");

  if (overlay) {
    overlay.hidden = true;
  }

  stopConfetti();
}



function finishGame() {
  thinking = false;

  updateInformation();

  if (game.isCheckmate()) {
    const playerWon = game.turn() !== playerColor;

    if (playerWon) {
      setLia("Xeque-mate! Você venceu! Excelente partida!");

      showGameResult(
        "XEQUE-MATE! VOCÊ VENCEU!",
        true
      );
    } else {
      setLia("Xeque-mate. O adversário venceu esta partida.");

      showGameResult(
        "VOCÊ PERDEU!",
        false
      );
    }
  } else {
    setLia("A partida terminou empatada. Vamos tentar outra?");

    showGameResult(
      "EMPATE!",
      false
    );
  }

  devLog("Partida finalizada.", "SUCCESS");
}


// ==========================================
// GAME CONTROLS
// ==========================================

function clearBotTimer() {
  if (botTimer !== null) {
    window.clearTimeout(botTimer);
    botTimer = null;
  }
}

function newGame() {
  clearBotTimer();
hideGameResult();

  game.reset();

  selectedSquare = null;
  legalMoves = [];
  thinking = false;

  renderBoard();
  updateHistory();

  setLia("Nova partida iniciada! Vamos jogar?");

  devLog("Nova partida iniciada.");
}

function undoMove() {
  clearBotTimer();

  thinking = false;
hideGameResult()

  if (game.history().length === 0) return;

  game.undo();

  if (
    game.history().length > 0 &&
    game.turn() === "b"
  ) {
    game.undo();
  }

  selectedSquare = null;
  legalMoves = [];

  renderBoard();
  updateHistory();

  setLia("Voltamos uma jogada. Tente outra estratégia!");

  devLog("Jogada desfeita.");
}


function showHint() {
  if (thinking || game.turn() !== playerColor) {
    setLia("Espere sua vez para receber uma dica.");
    return;
  }

  const result = findBestMove({
    maxDepth: 3,
    maxMs: 500,
    maxNodes: 25000
  });

  if (!result?.move) {
    setLia("Não encontrei um movimento recomendado.");
    return;
  }

  const move = result.move;

  selectedSquare = move.from;

  legalMoves = game.moves({
    square: move.from,
    verbose: true
  });

  renderBoard();

  let explanation = `Minha sugestão é ${move.san}: ${move.from} para ${move.to}.`;

  if (move.captured) {
    explanation += " Esse movimento captura uma peça.";
  }

  if (move.promotion) {
    explanation += " Ele também permite promover seu peão.";
  }

  setLia(explanation);
}

function analyzePosition() {
  if (game.isCheckmate()) {
    setLia("A partida terminou em xeque-mate.");
    return;
  }

  if (game.isDraw()) {
    setLia("A posição terminou empatada.");
    return;
  }

  if (game.isCheck()) {
    setLia("Seu rei está em xeque. Procure uma defesa imediatamente!");
  }

  const result = findBestMove({
    maxDepth: 3,
    maxMs: 600,
    maxNodes: 30000
  });

  if (!result?.move) {
    setLia("Não foi possível analisar esta posição.");
    return;
  }

  const whiteScore =
    game.turn() === "w"
      ? result.score
      : -result.score;

  let advantage = "posição equilibrada";

  if (whiteScore > 150) {
    advantage = "vantagem das brancas";
  } else if (whiteScore < -150) {
    advantage = "vantagem das pretas";
  }

  setLia(
    `Análise: ${advantage}. ` +
    `Melhor movimento encontrado: ${result.move.san}. ` +
    `Foram analisados ${result.nodes} nós.`
  );

  devLog("Análise avançada solicitada.");
}


function flipBoard() {
  flipped = !flipped;

  renderBoard();

  devLog("Orientação do tabuleiro alterada.");
}

function changeLevel(value) {
  botLevel = Number(value);

  setLia(`Nível do adversário alterado para ${botLevel}.`);

  devLog(`Nível da IA alterado para ${botLevel}.`);
}

function showLesson() {
  const lessons = [
    "O centro do tabuleiro é importante. Tente controlar as casas centrais.",
    "Desenvolva cavalos e bispos antes de movimentar muitas vezes a mesma peça.",
    "Faça o roque para proteger o rei e conectar suas torres.",
    "Antes de jogar, observe se sua peça ficará ameaçada.",
    "Evite deixar peças importantes sem proteção."
  ];

  const lesson = lessons[
    Math.floor(Math.random() * lessons.length)
  ];

  $("lesson").textContent = lesson;
}

// ==========================================
// GLOBAL DIAGNOSTICS
// ==========================================

window.addEventListener("error", event => {
  devLog(`Erro JavaScript: ${event.message}`, "ERROR");
});

window.addEventListener("unhandledrejection", event => {
  devLog(`Promise rejeitada: ${String(event.reason)}`, "ERROR");
});

window.addEventListener("online", () => {
  devLog("Conexão restaurada.");
});

window.addEventListener("offline", () => {
  devLog("Aplicativo ficou offline.");
});

// ==========================================
// APPLICATION INITIALIZATION
// ==========================================

function initialize() {
  const required = [
    "board",
    "legal-move-count",
    "status",
    "moves",
    "lia-message",
    "lesson",
    "new-game",
    "undo",
    "hint",
    "analyze",
    "flip",
    "lesson-button",
    "level",
    "developer-panel",
    "dev-refresh",
    "dev-test-moves",
    "dev-test-animation",
    "dev-test-sound",
    "dev-export",
    "theme-toggle",
"board-stage",
"game-result",
"result-message",
"result-restart",
"confetti-canvas",
    "dev-clear-log",
    "dev-close",
    "app-version"
  ];

  const missing = required.filter(id => !$(id));

  if (missing.length) {
    console.error(
      "Chess Academy: elementos HTML ausentes:",
      missing
    );
    return;
  }

  $("theme-toggle").addEventListener("click", toggleTheme);

$("result-restart").addEventListener("click", newGame);

let savedTheme = "dark";

try {
  savedTheme =
    localStorage.getItem("chess_academy_theme") || "dark";
} catch {}

applyTheme(savedTheme);

  $("new-game").addEventListener("click", newGame);
  $("undo").addEventListener("click", undoMove);
  $("hint").addEventListener("click", showHint);
  $("analyze").addEventListener("click", analyzePosition);
  $("flip").addEventListener("click", flipBoard);
  $("lesson-button").addEventListener("click", showLesson);

  $("level").addEventListener("change", event => {
    changeLevel(event.target.value);
  });

  devInitialize();

  // INITIALIZE UPDATE SYSTEM
  initializeUpdater();

  renderBoard();
  updateHistory();

  setLia(
    "Olá! Eu sou a Lia, sua professora de xadrez. Vamos começar?"
  );

  devLog("Chess Academy inicializado.", "SUCCESS");
}

initialize();



// ==========================================
// END OF CHESS ACADEMY
// ==========================================
