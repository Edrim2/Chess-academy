
import { Chess } from "chess.js";

const game = new Chess();

const $ = (id) => document.getElementById(id);

let selectedSquare = null;
let legalMoves = [];
let flipped = false;
let thinking = false;
let botLevel = 3;
let playerColor = "w";
let botTimer = null;

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

function setLia(message) {
  $("lia-message").textContent = message;
}

function getSquareName(file, rank) {
  return files[file] + rank;
}

function renderBoard() {
  const board = $("board");
  board.innerHTML = "";

  const position = game.board();

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

      if (piece) {
        square.textContent = symbols[piece.color + piece.type];
        square.classList.add(
          piece.color === "w" ? "white-piece" : "black-piece"
        );
      }

      if (selectedSquare === squareName) {
        square.classList.add("selected");
      }

      const possible = legalMoves.find(move => move.to === squareName);

      if (possible) {
        square.classList.add("possible");
        if (piece) square.classList.add("capture");
      }

      const history = game.history({ verbose: true });
      const lastMove = history[history.length - 1];

      if (lastMove && (lastMove.from === squareName || lastMove.to === squareName)) {
        square.classList.add("last-move");
      }

      square.addEventListener("click", () => {
        handleSquareClick(squareName);
      });

      board.appendChild(square);
    }
  }

  updateInformation();
}

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
      game.move({
        from: selectedSquare,
        to: square,
        promotion: "q"
      });

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

  const candidates = scoredMoves.slice(0, randomness[botLevel]);
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  game.move({
    from: chosen.move.from,
    to: chosen.move.to,
    promotion: "q"
  });

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
  } else if (game.turn() === "b") {
    status = "Vez do adversário.";
  }

  $("status").textContent = status;
}

function finishGame() {
  thinking = false;
  updateInformation();

  if (game.isCheckmate()) {
    setLia(game.turn() === "w"
      ? "Xeque-mate! O adversário venceu esta partida."
      : "Xeque-mate! Você venceu! Excelente partida!");
  } else {
    setLia("A partida terminou empatada. Vamos tentar outra?");
  }
}

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
}

function undoMove() {
  clearBotTimer();
  thinking = false;

  if (game.history().length === 0) return;

  game.undo();

  if (game.history().length > 0 && game.turn() === "b") {
    game.undo();
  }

  selectedSquare = null;
  legalMoves = [];

  renderBoard();
  updateHistory();

  setLia("Voltamos uma jogada. Tente outra estratégia!");
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
    `Dica: observe a peça em ${move.from}. Um movimento possível é ${move.from} para ${move.to}.`
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
      `Existem ${game.moves().length} movimentos legais disponíveis nesta posição. Observe o centro e a segurança do rei.`
    );
  }
}

function flipBoard() {
  flipped = !flipped;
  renderBoard();
}

function changeLevel(value) {
  botLevel = Number(value);
  setLia(`Nível do adversário alterado para ${botLevel}.`);
}

function showLesson() {
  const lessons = [
    "O centro do tabuleiro é importante. Tente controlar as casas centrais.",
    "Desenvolva cavalos e bispos antes de movimentar muitas vezes a mesma peça.",
    "Faça o roque para proteger o rei e conectar suas torres.",
    "Antes de jogar, observe se sua peça ficará ameaçada.",
    "Evite deixar peças importantes sem proteção."
  ];

  const lesson = lessons[Math.floor(Math.random() * lessons.length)];
  $("lesson").textContent = lesson;
}

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
    "level"
  ];

  const missing = required.filter(id => !$(id));

  if (missing.length) {
    console.error("Chess Academy: elementos HTML ausentes:", missing);
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

  renderBoard();
  updateHistory();
  setLia("Olá! Eu sou a Lia, sua professora de xadrez. Vamos começar?");
}

initialize();
