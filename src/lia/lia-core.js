JavaScript

/**
 * LIA CORE v1.0
 * Chess Academy
 * Offline Conversational Core
 */

(function (global) {
  "use strict";

  const LiaCore = {
    version: "1.0.0",

    personality: {
      name: "Lia",
      language: "pt-BR",
      style: "didatic, friendly and strategic"
    },

    memory: [],
    maxMemory: 30,

    knowledge: {
      chess: {
        rei: "O rei é a peça mais importante. Proteja-o durante toda a partida.",
        dama: "A dama combina os movimentos da torre e do bispo.",
        torre: "A torre movimenta-se horizontal e verticalmente.",
        bispo: "O bispo movimenta-se pelas diagonais.",
        cavalo: "O cavalo movimenta-se em formato de L e pode saltar peças.",
        peao: "O peão avança para frente e captura na diagonal.",
        roque: "O roque é uma jogada especial que ajuda a proteger o rei.",
        xeque: "Xeque acontece quando o rei está sob ataque.",
        xequemate: "Xeque-mate acontece quando o rei está em xeque e não existe defesa legal.",
        empate: "Uma partida pode terminar empatada por diferentes condições, como afogamento ou repetição."
      }
    },

    normalize(text) {
      return String(text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    },

    remember(role, content) {
      this.memory.push({
        role,
        content,
        timestamp: Date.now()
      });

      if (this.memory.length > this.maxMemory) {
        this.memory.shift();
      }

      this.saveMemory();
    },

    saveMemory() {
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(
            "chess_academy_lia_memory",
            JSON.stringify(this.memory)
          );
        }
      } catch (error) {
        console.warn("Lia: memória local indisponível.", error);
      }
    },

    loadMemory() {
      try {
        if (typeof localStorage !== "undefined") {
          const saved = localStorage.getItem(
            "chess_academy_lia_memory"
          );

          if (saved) {
            const parsed = JSON.parse(saved);

            if (Array.isArray(parsed)) {
              this.memory = parsed.slice(-this.maxMemory);
            }
          }
        }
      } catch (error) {
        this.memory = [];
      }
    },

    getContext() {
      return this.memory.slice(-8);
    },

    detectIntent(message) {
      const text = this.normalize(message);

      if (/^(oi|ola|bom dia|boa tarde|boa noite)\b/.test(text)) {
        return "greeting";
      }

      if (text.includes("como voce esta") || text.includes("tudo bem")) {
        return "wellbeing";
      }

      if (text.includes("quem e voce") || text.includes("seu nome")) {
        return "identity";
      }

      if (text.includes("ajuda") || text.includes("me ensina")) {
        return "help";
      }

      if (text.includes("estrategia") || text.includes("estrategias")) {
        return "strategy";
      }

      if (text.includes("melhor jogada") || text.includes("qual jogada")) {
        return "best_move";
      }

      if (text.includes("xeque-mate") || text.includes("xequemate")) {
        return "checkmate";
      }

      if (text.includes("analise") || text.includes("analisar")) {
        return "analysis";
      }

      for (const piece of Object.keys(this.knowledge.chess)) {
        if (text.includes(piece)) {
          return "chess_" + piece;
        }
      }

      if (text.includes("obrigado") || text.includes("obrigada")) {
        return "thanks";
      }

      return "unknown";
    },

    respond(message, context = {}) {
      const intent = this.detectIntent(message);
      let answer;

      switch (intent) {
        case "greeting":
          answer = "Olá! Sou a Lia. Vamos aprender e jogar xadrez juntos? ♟️";
          break;

        case "wellbeing":
          answer = "Estou pronta para analisar posições e ajudar na sua partida!";
          break;

        case "identity":
          answer = "Sou a Lia, assistente de xadrez do Chess Academy. Meu núcleo funciona localmente.";
          break;

        case "help":
          answer = "Posso explicar peças, regras, estratégias e conceitos de xadrez. Também posso utilizar os dados da partida quando conectada ao motor.";
          break;

        case "strategy":
          answer = "Uma boa estratégia começa pelo controle do centro, desenvolvimento das peças e segurança do rei.";
          break;

        case "best_move":
          answer = context.bestMove
            ? "A melhor jogada calculada pelo motor é " + context.bestMove + "."
            : "Preciso receber a posição e consultar o motor de xadrez para indicar uma jogada.";
          break;

        case "checkmate":
          answer = "O xeque-mate encerra a partida. O objetivo é atacar o rei sem permitir nenhuma defesa legal.";
          break;

        case "analysis":
          answer = context.analysis
            ? "Resultado da análise: " + context.analysis
            : "Envie a posição atual para que eu possa utilizar o motor de análise.";
          break;

        case "thanks":
          answer = "Disponha! Vamos continuar evoluindo no xadrez. ♟️";
          break;

        default:
          if (intent.startsWith("chess_")) {
            const piece = intent.replace("chess_", "");
            answer = this.knowledge.chess[piece];
          } else {
            answer = "Ainda não tenho uma resposta específica para isso. Posso ajudar com regras, peças, estratégias e análise de xadrez.";
          }
      }

      this.remember("user", message);
      this.remember("assistant", answer);

      return {
        text: answer,
        intent,
        context: this.getContext(),
        version: this.version
      };
    },

    clearMemory() {
      this.memory = [];

      try {
        if (typeof localStorage !== "undefined") {
          localStorage.removeItem("chess_academy_lia_memory");
        }
      } catch (error) {
        console.warn("Lia: não foi possível limpar a memória.", error);
      }
    },

    init() {
      this.loadMemory();

      return {
        success: true,
        name: "Lia",
        version: this.version,
        offline: true
      };
    }
  };

  global.LiaCore = LiaCore;

  LiaCore.init();

})(typeof globalThis !== "undefined" ? globalThis : window);
