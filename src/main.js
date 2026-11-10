JavaScript
// ==========================================
// LIA OFFLINE ENGINE v1.0
// NEGAMAX + ALPHA-BETA PRUNING
// ==========================================

const LIA_ENGINE = {
  levels: {
    1: { depth: 1, nodes: 1200 },
    2: { depth: 2, nodes: 3500 },
    3: { depth: 3, nodes: 7000 },
    4: { depth: 3, nodes: 12000 },
    5: { depth: 4, nodes: 18000 }
  },

  nodes: 0,
  nodeLimit: 7000,

  evaluate() {
    if (game.isCheckmate()) return -100000;
    if (game.isDraw()) return 0;

    const board = game.board();
    let score = 0;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (!piece) continue;

        const value = pieceValues[piece.type] || 0;
        const sign = piece.color === "w" ? 1 : -1;

        let positional = 0;

        const centerDistance =
          Math.abs(3.5 - col) +
          Math.abs(3.5 - row);

        if (piece.type === "p") {
          const advancement =
            piece.color === "w" ? 6 - row : row - 1;

          positional += advancement * 8;
          positional += (3.5 - Math.abs(3.5 - col)) * 3;
        }

        if (piece.type === "n") {
          positional += (7 - centerDistance) * 9;
        }

        if (piece.type === "b") {
          positional += (7 - centerDistance) * 5;
        }

        if (piece.type === "q") {
          positional += (7 - centerDistance) * 2;
        }

        score += sign * (value + positional);
      }
    }

    return game.turn() === "w" ? score : -score;
  },

  orderMoves(moves) {
    return moves.sort((a, b) => {
      const score = move => {
        let value = 0;

        if (move.captured) {
          value +=
            (pieceValues[move.captured] || 0) -
            (pieceValues[move.piece] || 0) / 10;
        }

        if (move.promotion) {
          value += pieceValues[move.promotion] || 0;
        }

        if (move.san?.includes("+")) value += 40;
        if (move.san?.includes("#")) value += 10000;

        return value;
      };

      return score(b) - score(a);
    });
  },

  search(depth, alpha, beta, ply = 0) {
    this.nodes++;

    if (
      this.nodes >= this.nodeLimit ||
      depth <= 0 ||
      game.isGameOver()
    ) {
      const evaluation = this.evaluate();

      if (game.isCheckmate()) {
        return -100000 + ply;
      }

      return evaluation;
    }

    const moves = this.orderMoves(
      game.moves({ verbose: true })
    );

    let bestScore = -Infinity;

    for (const move of moves) {
      game.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || "q"
      });

      const score = -this.search(
        depth - 1,
        -beta,
        -alpha,
        ply + 1
      );

      game.undo();

      if (score > bestScore) {
        bestScore = score;
      }

      alpha = Math.max(alpha, score);

      if (alpha >= beta || this.nodes >= this.nodeLimit) {
        break;
      }
    }

    return bestScore;
  },

  findBestMove() {
    const settings =
      this.levels[botLevel] || this.levels[3];

    this.nodes = 0;
    this.nodeLimit = settings.nodes;

    const moves = this.orderMoves(
      game.moves({ verbose: true })
    );

    if (!moves.length) return null;

    let bestMove = moves[0];
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;

    for (const move of moves) {
      if (this.nodes >= this.nodeLimit) break;

      game.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || "q"
      });

      const score = -this.search(
        settings.depth - 1,
        -beta,
        -alpha,
        1
      );

      game.undo();

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }

      alpha = Math.max(alpha, score);
    }

    return {
      move: bestMove,
      score: bestScore,
      nodes: this.nodes,
      depth: settings.depth
    };
  }
};

// ==========================================
// BOT MOVE
// ==========================================

function makeBotMove() {
  botTimer = null;

  if (game.isGameOver() || game.turn() === playerColor) {
    thinking = false;
    updateInformation();
    return;
  }

  const result = LIA_ENGINE.findBestMove();

  if (!result || !result.move) {
    thinking = false;
    finishGame();
    return;
  }

  const chosen = result.move;

  const played = game.move({
    from: chosen.from,
    to: chosen.to,
    promotion: chosen.promotion || "q"
  });

  devLog(
    `Lia: ${played.san} | Profundidade: ${result.depth} | Nós: ${result.nodes}`
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
        ? "Xeque! Agora preciso proteger meu rei."
        : "Minha jogada foi feita. Sua vez!"
    );
  }
}

// ==========================================
// LIA HINT SYSTEM
// ==========================================

function showHint() {
  if (thinking || game.turn() !== playerColor) {
    setLia("Espere sua vez para receber uma dica.");
    return;
  }

  const result = LIA_ENGINE.findBestMove();

  if (!result || !result.move) {
    setLia("Não encontrei uma jogada disponível.");
    return;
  }

  const move = result.move;

  selectedSquare = move.from;

  legalMoves = game.moves({
    square: move.from,
    verbose: true
  });

  renderBoard();

  setLia(
    `Minha sugestão é ${move.from} para ${move.to}. ` +
    `Analise essa jogada antes de decidir!`
  );

  devLog(
    `Dica da Lia: ${move.san} | Nós analisados: ${result.nodes}`
  );
}

// ==========================================
// LIA POSITION ANALYSIS
// ==========================================

function analyzePosition() {
  if (game.isCheckmate()) {
    setLia("A partida terminou em xeque-mate.");
    return;
  }

  if (game.isDraw()) {
    setLia("A posição terminou empatada.");
    return;
  }

  const result = LIA_ENGINE.findBestMove();

  if (!result || !result.move) {
    setLia("Não consegui analisar esta posição.");
    return;
  }

  const score = result.score / 100;

  let evaluation;

  if (score > 3) {
    evaluation = "Você tem uma vantagem considerável.";
  } else if (score > 0.8) {
    evaluation = "Sua posição está um pouco melhor.";
  } else if (score < -3) {
    evaluation = "Seu adversário tem uma vantagem considerável.";
  } else if (score < -0.8) {
    evaluation = "Seu adversário está um pouco melhor.";
  } else {
    evaluation = "A posição está relativamente equilibrada.";
  }

  const suggested = result.move;

  setLia(
    `${evaluation} Minha candidata principal é ` +
    `${suggested.from} para ${suggested.to}.`
  );

  devLog(
    `Análise: ${score.toFixed(2)} | ` +
    `Melhor lance: ${suggested.san} | ` +
    `Nós: ${result.nodes} | Profundidade: ${result.depth}`
  );
}
