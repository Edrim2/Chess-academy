
import { Chess } from "chess.js";

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

  $("dev-test-animation").addEventListener(
    "click",
    devTestAnimation
  );

  $("dev-test-sound").addEventListener(
    "click",
    devTestSound
  );

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

function renderBoard() {
  const board = $("board");

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

      if (piece) {
        square.textContent = symbols[piece.color + piece.type];

        square.classList.add(
          piece.color === "w" ? "white-piece" : "black-piece"
        );
      }

      if (selectedSquare === squareName) {
        square.classList.add("selected");
      }

      const possible = legalMoves.find(
        move => move.to === squareName
      );

      if (possible) {
        square.classList.add("possible");

        if (piece) square.classList.add("capture");
      }

      if (
        lastMove &&
        (lastMove.from === squareName ||
         lastMove.to === squareName)
      ) {
        square.classList.add("last-move");
      }

      square.addEventListener("click", () => {
        handleSquareClick(squareName);
      });

      board.appendChild(square);
    }
  }

  updateInformation();
  devRefresh();
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

      renderBoard();
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
// AI ENGINE
// ==========================================

function evaluatePosition() {
  if (game.isCheckmate()) {
    return game.turn() === "b" ? -100000 : 100000;
  }

  let score = 0;

  for (const row of game.board()) {
    for (const piece of row) {
      if (!piece) continue;

      const value = pieceValues[piece.type] || 0;

      score += piece.color === "b" ? value : -value;
    }
  }

  return score;
}

function makeBotMove() {
  botTimer = null;

  if (game.isGameOver() || game.turn() === playerColor) {
    thinking = false;
    updateInformation();
    return;
  }

  const moves = game.moves({ verbose: true });

  if (!moves.length) {
    thinking = false;
    finishGame();
    return;
  }

  const scoredMoves = [];

  for (const move of moves) {
    game.move({
      from: move.from,
      to: move.to,
      promotion: "q"
    });

    const score = evaluatePosition();

    game.undo();

    scoredMoves.push({ move, score });
  }

  scoredMoves.sort((a, b) => b.score - a.score);

  const randomness = {
    1: 8,
    2: 6,
    3: 4,
    4: 2,
    5: 1
  };

  const candidates = scoredMoves.slice(
    0,
    randomness[botLevel]
  );

  const chosen =
    candidates[Math.floor(Math.random() * candidates.length)];

  const result = game.move({
    from: chosen.move.from,
    to: chosen.move.to,
    promotion: "q"
  });

  devLog(`Jogada da IA: ${result.san}`);

  thinking = false;
  selectedSquare = null;
  legalMoves = [];

  renderBoard();
  updateHistory();
  updateInformation();

  if (game.isGameOver()) {
    finishGame();
  } else {
    setLia(
      game.isCheck()
        ? "Xeque! Cuidado com o rei."
        : "Minha jogada foi feita. Sua vez!"
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
// GAME INFORMATION
// ==========================================

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

  devRefresh();
}

function finishGame() {
  thinking = false;

  updateInformation();

  if (game.isCheckmate()) {
    setLia(
      game.turn() === "w"
        ? "Xeque-mate! O adversário venceu esta partida."
        : "Xeque-mate! Você venceu! Excelente partida!"
    );
  } else {
    setLia("A partida terminou empatada. Vamos tentar outra?");
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

  const moves = game.moves({ verbose: true });

  if (!moves.length) {
    setLia("Não há movimentos disponíveis.");
    return;
  }

  const move = moves[Math.floor(Math.random() * moves.length)];

  selectedSquare = move.from;

  legalMoves = game.moves({
    square: move.from,
    verbose: true
  });

  renderBoard();

  setLia(
    `Dica: observe a peça em ${move.from}. ` +
    `Um movimento possível é ${move.from} para ${move.to}.`
  );
}

function analyzePosition() {
  if (game.isCheckmate()) {
    setLia("A partida terminou em xeque-mate.");
  } else if (game.isDraw()) {
    setLia("A posição terminou empatada.");
  } else if (game.isCheck()) {
    setLia("Seu rei está em xeque. Procure uma defesa!");
  } else {
    setLia(
      `Existem ${game.moves().length} movimentos legais. ` +
      "Observe o centro e a segurança do rei."
    );
  }

  devLog("Análise básica da posição solicitada.");
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
  devLog(
    `Erro JavaScript: ${event.message}`,
    "ERROR"
  );
});

window.addEventListener("unhandledrejection", event => {
  devLog(
    `Promise rejeitada: ${String(event.reason)}`,
    "ERROR"
  );
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
