require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

/* ===========================================================
   CONFIG - GROQ
   =========================================================== */
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const PORT = process.env.PORT || 3000;

/* ===========================================================
   FUNÇÕES DE PARSE / CPC
   =========================================================== */

function normalizeSymbols(input) {
  return input
    .replace(/<->/g, "↔")
    .replace(/->/g, "→")
    .replace(/~/g, "¬")
    .replace(/\\land|&/g, "∧")
    .replace(/\\lor|\|/g, "∨");
}

function tokenize(input) {
  input = normalizeSymbols(input);
  const tokens = [];
  const re = /\s*([()¬∧∨→↔]|[A-Za-z][A-Za-z0-9_]*)\s*/g;
  let m;
  while ((m = re.exec(input)) !== null) tokens.push(m[1]);
  return tokens;
}

function parseFormula(tokens) {
  let i = 0;
  const peek = () => tokens[i];
  const consume = tok => (tokens[i] === tok ? (i++, true) : false);

  function parsePrimary() {
    if (consume("(")) {
      const node = parseEquiv();
      if (!consume(")")) throw new Error("Parênteses não fechados");
      return node;
    }
    if (peek() === "¬") { i++; return { type: "not", child: parsePrimary() }; }
    const t = peek();
    if (!t) throw new Error("Token inesperado");
    i++;
    return { type: "atom", name: t };
  }

  function parseAnd() {
    let node = parsePrimary();
    while (peek() === "∧") { i++; node = { type: "and", left: node, right: parsePrimary() }; }
    return node;
  }

  function parseOr() {
    let node = parseAnd();
    while (peek() === "∨") { i++; node = { type: "or", left: node, right: parseAnd() }; }
    return node;
  }

  function parseImplies() {
    let node = parseOr();
    while (peek() === "→") { i++; node = { type: "implies", left: node, right: parseOr() }; }
    return node;
  }

  function parseEquiv() {
    let node = parseImplies();
    while (peek() === "↔") { i++; node = { type: "iff", left: node, right: parseImplies() }; }
    return node;
  }

  const res = parseEquiv();
  if (i < tokens.length) throw new Error("Tokens extras após o parse");
  return res;
}

function toPortuguese(node) {
  switch (node.type) {
    case "atom": return node.name;
    case "not": return `não ${toPortuguese(node.child)}`;
    case "and": return `${toPortuguese(node.left)} e ${toPortuguese(node.right)}`;
    case "or": return `${toPortuguese(node.left)} ou ${toPortuguese(node.right)}`;
    case "implies":
      return `Se ${toPortuguese(node.left)} for verdadeiro, então ${toPortuguese(node.right)}.`;
    case "iff":
      return `${toPortuguese(node.left)} se e somente se ${toPortuguese(node.right)}`;
    default: return JSON.stringify(node);
  }
}

function detectSymbolicFormula(text) {
  return /[¬∧∨→↔]/.test(text) || /->/.test(text) || /<->/.test(text);
}

/* Detecta quando o usuário quer explicação */
function wantsExplanation(text) {
  return /(explique|o que é|como funciona|defina|me diga|fale sobre)/i.test(text);
}

/* ===========================================================
   CHAMADA GROQ
   =========================================================== */
async function callGroq(systemPrompt, userMessage) {
  const resp = await axios.post(GROQ_API_URL, {
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ]
  }, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    timeout: 20000
  });

  return resp.data.choices[0].message.content;
}

/* ===========================================================
   ENDPOINT PRINCIPAL
   =========================================================== */
app.post("/api/chat", async (req, res) => {
  const raw = (req.body.message || "").trim();

  if (!raw) return res.json({ reply: "Envie uma fórmula ou frase." });

  // 1) Se mandou fórmula → traduz para português
  if (detectSymbolicFormula(raw)) {
    try {
      return res.json({ reply: toPortuguese(parseFormula(tokenize(raw))) });
    } catch (e) {
      return res.json({ reply: "Erro na fórmula: " + e.message });
    }
  }

  // 2) Se pediu explicação → IA explica normalmente
  if (wantsExplanation(raw)) {
    try {
      return res.json({
        reply: await callGroq(
          "Você é um professor de lógica proposicional. Responda explicando de forma clara e didática.",
          raw
        )
      });
    } catch (e) {
      console.log("ERRO GROQ:", e?.response?.data || e.message);
      return res.json({ reply: "Erro ao acessar IA (Groq). Tente novamente." });
    }
  }

  // 3) Caso contrário → IA converte texto → fórmula
  try {
    return res.json({
      reply: await callGroq(
        "Converta o texto em português para uma fórmula lógica do cálculo proposicional (¬ ∧ ∨ → ↔). Responda somente com a fórmula.",
        raw
      )
    });
  } catch (e) {
    console.log("ERRO GROQ:", e?.response?.data || e.message);
    return res.json({ reply: "Erro ao acessar IA (Groq). Tente novamente." });
  }
});

/* ===========================================================
   START SERVER
   =========================================================== */
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
