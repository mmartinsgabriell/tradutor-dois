const chatEl = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");

function appendMessage(who, text, meta){
  const div = document.createElement("div");
  div.className = "msg " + who;
  const safe = escapeHtml(text).replace(/\n/g, "<br/>");
  div.innerHTML = `<div class="text">${safe}</div>${meta ? `<div class="meta">${escapeHtml(meta)}</div>` : ""}`;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function escapeHtml(s){
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

async function sendMessage(message){
  appendMessage("user", message);
  input.value = "";
  try {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ message })
    });
    const data = await resp.json();
    let meta = "";
    if (data.meta?.direction) {
      meta = data.meta.direction === "pt->formula" ? "Português → Fórmula" :
             data.meta.direction === "formula->pt" ? "Fórmula → Português" :
             data.meta.direction === "ai" ? "IA" : "";
    }
    appendMessage("bot", data.reply, meta);
  } catch (e) {
    appendMessage("bot", "Erro de conexão com o servidor.");
    console.error(e);
  }
}

form.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const txt = input.value.trim();
  if (!txt) return;
  sendMessage(txt);
});

// mensagem inicial
appendMessage("bot", "Olá! Sou um agente focado em Cálculo Proposicional (¬ ∧ ∨ → ↔). Envie fórmulas ou frases controladas (ex.: 'Se p e q forem verdadeiros, então r.').", "Sistema");
