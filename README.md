#  CPC Agente — Conversão de Frases para Lógica Proposicional

Este é um projeto que recebe frases em português e converte para **Lógica Proposicional (CPC)** usando uma API inteligente (modelo de linguagem).  
O usuário digita frases no front-end e o servidor Node.js processa e retorna a fórmula lógica correspondente.

##  Estrutura do Projeto

cpc_agente/
│
├── public/ # Arquivos do front-end
│ ├── index.html
│ ├── script.js
│ └── styles.css
│
├── server.js # Servidor Node.js (Express + API)
├── package.json
├── package-lock.json
│
├── .env # Chaves de API (NÃO ENVIAR PARA O GITHUB)
└── .gitignore # Ignora node_modules e .env

##  Arquitetura do Sistema

O sistema foi projetado em três camadas:

Usuário → Front-end (HTML/CSS/JS) → Servidor Node.js → API LLM → Retorna fórmula lógica

###  **Front-end**
- Formulário para inserir a frase
- Envia via `fetch()` para o servidor
- Exibe a fórmula convertida

###  **Back-end (Node.js + Express)**
- Recebe o texto do usuário
- Envia ao modelo LLM
- Processa a resposta
- Retorna ao front-end

###  **API Externa (LLM)**
- Interpreta a frase
- Converte para lógica proposicional (CPC)
- Retorna com a fórmula final

##  Diagrama Arquitetural (ASCII)

                 ┌───────────────────────┐
                 │        Usuário         │
                 │  (navegador web)       │
                 └──────────┬────────────┘
                            │
                            ▼
                 ┌────────────────────────┐
                 │        Front-end        │
                 │  HTML • CSS • JS        │
                 └──────────┬─────────────┘
                            │  fetch()
                            ▼
                 ┌────────────────────────┐
                 │       Servidor          │
                 │      Node.js/Express    │
                 └──────────┬─────────────┘
                            │  Chamada LLM
                            ▼
                 ┌────────────────────────┐
                 │         API LLM         │
                 │  Converte frase → CPC   │
                 └──────────┬─────────────┘
                            │  Retorna JSON
                            ▼
                 ┌────────────────────────┐
                 │        Front-end        │
                 │ Exibe fórmula lógica    │
                 └────────────────────────┘

##  Como rodar localmente

### 1 Instalar dependências
npm install
### 2 Criar seu arquivo `.env`
API_KEY=sua_chave_aqui

### 3 Iniciar o servidor
node server.js

Servidor rodará em:
http://localhost:3000

##  Deploy no Render

1. Crie um novo repositório no GitHub  
2. Suba **todos os arquivos exceto**:  
   - `node_modules/`  
   - `.env`  
3. Vá no Render → *New Web Service*  
4. Conecte ao repo  
5. Configure:
   - Build Command: `npm install`
   - Start Command: `node server.js`
6. Em *Environment Variables* adicione:
   - `API_KEY` = sua chave  
7. Deploy!

##  Exemplos de Uso

Entrada:
Se chover então levo guarda-chuva.
Saída:
(ch → g)

Entrada:
Maria viaja se e somente se João for também e tiver dinheiro.
Saída:
M ↔ (J ∧ D)

## Autor Eric Dejair Silva Meleti, Gabriel Martins Rodrigues e Wellington Rodrigues da Silva

Projeto desenvolvido para estudos de lógica proposicional e integração com modelos de linguagem.
