
 // ==========================================
 // 1. CONFIGURAÇÕES DO JOGO
 // ==========================================

const elementoMensagem = document.querySelector("#mensagem");
const areaTabuleiros = document.querySelector("#game-board");
const teclado = document.querySelector("#teclado");
const botoesModo = document.querySelectorAll(".mode-button");
const modalResultado = document.querySelector("#modal-resultado");
const modalTitulo = document.querySelector("#modal-titulo");
const modalDescricao = document.querySelector("#modal-descricao");
const modalIcone = document.querySelector("#modal-icone");
const respostasJogo = document.querySelector("#respostas-jogo");

let TOTAL_LINHAS = 6;
const TOTAL_COLUNAS = 5;

const linhasPorModo = {
    solo: 6,
    dueto: 7,
    trio: 8,
    quarteto: 9
};

let modoAtual = "solo";
let linhaAtual = 0;
let jogoFinalizado = false;
let animacaoEmAndamento = false;

let tabuleiros = [];


// ==========================================
// 2. NORMALIZANDO PALAVRAS
// ==========================================

function normalizarPalavra(palavra) {

    return palavra
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();

}

const dicionarioNormalizado = dicionario.map(normalizarPalavra);


// ==========================================
// 3. CONFIGURAÇÃO DOS MODOS
// ==========================================

const quantidadeModos = {
    solo: 1,
    dueto: 2,
    trio: 3,
    quarteto: 4
};


// ==========================================
// 4. SORTEANDO AS PALAVRAS
// ==========================================

function sortearPalavras(quantidade) {
    const chaveHistorico = "termo_palavras_recentes";
    const limiteHistorico = 20;

    // Recupera as palavras utilizadas recentemente
    let historico = JSON.parse(
        localStorage.getItem(chaveHistorico) || "[]"
    );

    // Remove palavras repetidas da lista de respostas
    const listaUnica = [...new Set(
        palavras.map(palavra => normalizarPalavra(palavra))
    )];

    // Evita sortear palavras usadas recentemente
    let disponiveis = listaUnica.filter(
        palavra => !historico.includes(palavra)
    );

    // Se não houver palavras suficientes, libera o histórico
    if (disponiveis.length < quantidade) {
        disponiveis = listaUnica;
    }

    // Embaralhamento Fisher-Yates
    for (let i = disponiveis.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [disponiveis[i], disponiveis[j]] =
            [disponiveis[j], disponiveis[i]];
    }

    const sorteadas = disponiveis.slice(0, quantidade);

    // Atualiza o histórico para evitar repetições nas próximas partidas
    historico = [
        ...sorteadas,
        ...historico.filter(p => !sorteadas.includes(p))
    ].slice(0, limiteHistorico);

    localStorage.setItem(
        chaveHistorico,
        JSON.stringify(historico)
    );

    return sorteadas;
}

// ==========================================
// 5. CRIANDO OS TABULEIROS
// ==========================================

function criarTabuleiros() {

    areaTabuleiros.innerHTML = "";

    const quantidade = quantidadeModos[modoAtual];

    areaTabuleiros.dataset.quantidade = quantidade;

    const palavrasSorteadas = sortearPalavras(quantidade);

    tabuleiros = [];

    palavrasSorteadas.forEach((palavra, indice) => {

        const novoTabuleiro = document.createElement("div");

        novoTabuleiro.className = "tabuleiro-individual";

        novoTabuleiro.dataset.indice = indice;

        const titulo = document.createElement("div");

        titulo.className = "titulo-tabuleiro";

        const nomesModos = ["SOLO", "DUETO", "TRIO", "QUARTETO"];

        titulo.textContent = nomesModos[indice];

        novoTabuleiro.appendChild(titulo);

        const linhas = [];

        // Criando as cinco linhas
        for (let linha = 0; linha < TOTAL_LINHAS; linha++) {

            const novaLinha = document.createElement("div");

            novaLinha.className = `cards-${linha + 1}`;

            // Criando as cinco células
            for (let coluna = 0; coluna < TOTAL_COLUNAS; coluna++) {

                const celula = document.createElement("input");

                celula.type = "text";
                celula.maxLength = 1;
                celula.autocomplete = "off";
                celula.spellcheck = false;

                celula.dataset.linha = linha;
                celula.dataset.coluna = coluna;

                // Apenas o primeiro tabuleiro recebe a digitação
                celula.disabled = indice !== 0 || linha !== 0;

                if (indice === 0) {

                    adicionarEventosCelula(
                        celula,
                        novaLinha,
                        linha,
                        coluna
                    );

                }

                novaLinha.appendChild(celula);

            }

            linhas.push(novaLinha);

            novoTabuleiro.appendChild(novaLinha);

        }

        areaTabuleiros.appendChild(novoTabuleiro);

        tabuleiros.push({

            palavra: palavra,
            palavraNormalizada: normalizarPalavra(palavra),
            elemento: novoTabuleiro,
            linhas: linhas,
            resolvido: false

        });

    });

    console.log(
        "Palavras secretas:",
        tabuleiros.map(t => t.palavra)
    );

}


// ==========================================
// 6. EVENTOS DAS CÉLULAS
// ==========================================

function adicionarEventosCelula(
    celula,
    novaLinha,
    linha,
    coluna
) {

    // DIGITAÇÃO
    celula.addEventListener("input", function () {

        if (
            jogoFinalizado ||
            animacaoEmAndamento ||
            linha !== linhaAtual
        ) return;

        celula.value = celula.value
            .replace(/[^\p{L}]/gu, "")
            .toUpperCase()
            .slice(0, 1);

        // Espelha a letra nos outros tabuleiros
        espelharLetra(linha, coluna, celula.value);

        // Avança para a próxima célula
        if (
            celula.value !== "" &&
            coluna < TOTAL_COLUNAS - 1
        ) {

            novaLinha.children[coluna + 1].focus();

        }

    });


    // TECLADO FÍSICO
    celula.addEventListener("keydown", function (evento) {

        if (
            jogoFinalizado ||
            animacaoEmAndamento ||
            linha !== linhaAtual
        ) return;

        // ENTER
        if (evento.key === "Enter") {

            evento.preventDefault();

            validarTentativa();

        }

        // BACKSPACE
        if (evento.key === "Backspace" && celula.value === "") {

            if (coluna > 0) {

                evento.preventDefault();

                const anterior = novaLinha.children[coluna - 1];

                anterior.value = "";

                espelharLetra(linha, coluna - 1, "");

                anterior.focus();

            }

        }

        // SETA ESQUERDA
        if (evento.key === "ArrowLeft" && coluna > 0) {

            novaLinha.children[coluna - 1].focus();

        }

        // SETA DIREITA
        if (
            evento.key === "ArrowRight" &&
            coluna < TOTAL_COLUNAS - 1
        ) {

            novaLinha.children[coluna + 1].focus();

        }

    });

}


// ==========================================
// 7. ESPELHANDO A DIGITAÇÃO
// ==========================================

function espelharLetra(linha, coluna, valor) {

    tabuleiros.forEach((tabuleiro, indice) => {

        if (indice === 0 || tabuleiro.resolvido) return;

        const celula =
            tabuleiro.linhas[linha].children[coluna];

        celula.value = valor;

    });

}


// ==========================================
// 8. CRIANDO O TECLADO VIRTUAL
// ==========================================

function criarTeclado() {

    teclado.innerHTML = "";

    const linhasTeclado = [
        "QWERTYUIOP",
        "ASDFGHJKL",
        "ZXCVBNM"
    ];

    linhasTeclado.forEach(letras => {

        const linha = document.createElement("div");

        linha.className = "linha-teclado";

        letras.split("").forEach(letra => {

            const tecla = document.createElement("div");

            tecla.className = "tecla";
            tecla.textContent = letra;
            tecla.dataset.letra = letra;

            linha.appendChild(tecla);

        });

        teclado.appendChild(linha);

    });

}


// ==========================================
// 9. VALIDANDO A TENTATIVA
// ==========================================

function validarTentativa() {

    if (jogoFinalizado || animacaoEmAndamento) return;

    const primeiraLinha =
        tabuleiros[0].linhas[linhaAtual];

    const tentativa = Array.from(primeiraLinha.children)
        .map(celula => celula.value)
        .join("");

    // Verifica se está completa
    if (tentativa.length !== TOTAL_COLUNAS) {

        mostrarMensagem("Digite as cinco letras!", "aviso");

        return;

    }

    const tentativaNormalizada = normalizarPalavra(tentativa);

    // Verifica se existe no dicionário
    if (!dicionarioNormalizado.includes(tentativaNormalizada)) {

        mostrarMensagem(
            "Essa palavra não está no nosso banco!",
            "erro"
        );

        return;

    }

    mostrarMensagem("", "");

    animacaoEmAndamento = true;

    const resultadosPorTabuleiro = [];

    // Compara a tentativa com cada palavra secreta
    tabuleiros.forEach((tabuleiro, indice) => {

        const linha = tabuleiro.linhas[linhaAtual];

        // Mantém o tabuleiro já resolvido
        if (tabuleiro.resolvido) {

            resultadosPorTabuleiro.push(null);

            return;

        }

        const resultados = compararPalavras(
            tentativaNormalizada,
            tabuleiro.palavraNormalizada
        );

        resultadosPorTabuleiro.push(resultados);

        // Revela as cores
        resultados.forEach((resultado, coluna) => {

            const celula = linha.children[coluna];

            const letra = tentativaNormalizada[coluna];

            setTimeout(() => {

                celula.classList.add(resultado);
                celula.classList.add("revelar");

                atualizarTeclado(letra, resultado);

            }, coluna * 450);

        });

        // Verifica se acertou este tabuleiro
        if (
            tentativaNormalizada ===
            tabuleiro.palavraNormalizada
        ) {

            tabuleiro.resolvido = true;

        }

    });

    // Aguarda a animação antes de liberar outra tentativa
    setTimeout(() => {

        finalizarTentativa();

    }, (TOTAL_COLUNAS - 1) * 450 + 650);

}


// ==========================================
// 10. COMPARANDO AS PALAVRAS
// ==========================================

function compararPalavras(tentativa, secreta) {

    const letrasSecretas = secreta.split("");
    const letrasTentativa = tentativa.split("");

    const resultados = Array(TOTAL_COLUNAS).fill("absent");

    // PRIMEIRA PASSAGEM: letras corretas
    for (let i = 0; i < TOTAL_COLUNAS; i++) {

        if (letrasTentativa[i] === letrasSecretas[i]) {

            resultados[i] = "correct";

            letrasSecretas[i] = null;

        }

    }

    // SEGUNDA PASSAGEM: letras presentes
    for (let i = 0; i < TOTAL_COLUNAS; i++) {

        if (resultados[i] === "correct") continue;

        const posicao = letrasSecretas.indexOf(letrasTentativa[i]);

        if (posicao !== -1) {

            resultados[i] = "present";

            letrasSecretas[posicao] = null;

        }

    }

    return resultados;

}


// ==========================================
// 11. FINALIZANDO CADA TENTATIVA
// ==========================================


function finalizarTentativa() {

    const quantidadeResolvida =
        tabuleiros.filter(t => t.resolvido).length;

    const quantidadeTotal = tabuleiros.length;

    // Todas as palavras foram descobertas
    if (quantidadeResolvida === quantidadeTotal) {

        jogoFinalizado = true;
        animacaoEmAndamento = false;

        bloquearTodosTabuleiros();

        mostrarModalResultado(true);

        return;

    }

    // Acabaram as tentativas
    if (linhaAtual === TOTAL_LINHAS - 1) {

        jogoFinalizado = true;
        animacaoEmAndamento = false;

        bloquearTodosTabuleiros();

        mostrarModalResultado(false);

        return;

    }

    // Prepara a próxima tentativa
    tabuleiros.forEach(tabuleiro => {

        if (tabuleiro.resolvido) return;

        const proximaLinha =
            tabuleiro.linhas[linhaAtual + 1];

        Array.from(proximaLinha.children).forEach(celula => {
            celula.disabled = true;
        });

    });

    linhaAtual++;

    // Libera a próxima linha do primeiro tabuleiro
    const primeiraProximaLinha =
        tabuleiros[0].linhas[linhaAtual];

    Array.from(primeiraProximaLinha.children).forEach(celula => {
        celula.disabled = false;
    });

    animacaoEmAndamento = false;

    primeiraProximaLinha.children[0].focus();

}


// ==========================================
// MODAL DE RESULTADO
// ==========================================

function mostrarModalResultado(vitoria) {

    modalTitulo.textContent = vitoria
        ? "Parabéns!"
        : "Fim de jogo!";

    modalDescricao.textContent = vitoria
        ? "Você descobriu todas as palavras!"
        : "Confira as respostas desta partida:";

    modalIcone.textContent = vitoria ? "🏆" : "🎯";

    respostasJogo.innerHTML = "";
    respostasJogo.className = `respostas-jogo quantidade-${tabuleiros.length}`;

    tabuleiros.forEach((tabuleiro, indice) => {

        const item = document.createElement("div");

        item.className = "resposta-item";

        if (tabuleiro.resolvido) {
            item.classList.add("acertou");
        } else {
            item.classList.add("nao-acertou");
        }

        const numero = document.createElement("span");
        numero.className = "resposta-numero";
        
        const nomesModos = ["SOLO", "DUETO", "TRIO", "QUARTETO"];
        numero.textContent = nomesModos[indice];

        const palavra = document.createElement("span");
        palavra.className = "resposta-palavra";
        palavra.textContent = tabuleiro.palavra;

        const status = document.createElement("span");
        status.className = "resposta-status";
        status.textContent = tabuleiro.resolvido
            ? "✓ Descoberta"
            : "✕ Não descoberta";

        item.appendChild(numero);
        item.appendChild(palavra);
        item.appendChild(status);

        respostasJogo.appendChild(item);

    });

    modalResultado.classList.add("visivel");

}


// ==========================================
// FECHAR E REINICIAR
// ==========================================

function fecharModalResultado() {

    modalResultado.classList.remove("visivel");

}

document.querySelector("#fechar-modal")
    .addEventListener("click", fecharModalResultado);

document.querySelector("#btn-jogar-novamente")
    .addEventListener("click", function () {

        fecharModalResultado();

        alterarModo(modoAtual);

    });

// Fechar clicando fora da janela
modalResultado.addEventListener("click", function (evento) {

    if (evento.target === modalResultado) {
        fecharModalResultado();
    }

});

// ==========================================
// 12. BLOQUEANDO OS TABULEIROS
// ==========================================

function bloquearTodosTabuleiros() {

    tabuleiros.forEach(tabuleiro => {

        tabuleiro.linhas.forEach(linha => {

            Array.from(linha.children).forEach(celula => {

                celula.disabled = true;

            });

        });

    });

}


// ==========================================
// 13. ATUALIZANDO O TECLADO
// ==========================================

function atualizarTeclado(letra, resultado) {

    const tecla = teclado.querySelector(
        `[data-letra="${letra}"]`
    );

    if (!tecla) return;

    const prioridade = {
        absent: 1,
        present: 2,
        correct: 3
    };

    const classeAtual = [
        "correct",
        "present",
        "absent"
    ].find(classe => tecla.classList.contains(classe));

    if (
        classeAtual &&
        prioridade[classeAtual] >= prioridade[resultado]
    ) {

        return;

    }

    tecla.classList.remove(
        "correct",
        "present",
        "absent"
    );

    tecla.classList.add(resultado);

}


// ==========================================
// 14. MENSAGENS
// ==========================================

function mostrarMensagem(texto, tipo) {

    elementoMensagem.textContent = texto;

    elementoMensagem.className = "mensagem " + tipo;

}


// ==========================================
// 15. ALTERANDO O MODO
// ==========================================

function alterarModo(novoModo) {
    if (!quantidadeModos[novoModo]) return;

    modoAtual = novoModo;
    TOTAL_LINHAS = linhasPorModo[novoModo];
    linhaAtual = 0;
    jogoFinalizado = false;
    animacaoEmAndamento = false;

    elementoMensagem.textContent = "";

    botoesModo.forEach(botao => {
        botao.classList.toggle(
            "active",
            botao.dataset.mode === novoModo
        );
    });

    criarTabuleiros();
    criarTeclado();

    areaTabuleiros.dataset.quantidade =
        quantidadeModos[novoModo];

    areaTabuleiros.querySelector(
        ".tabuleiro-individual input"
    )?.focus();
}

// ==========================================
// 16. EVENTOS DOS BOTÕES DE MODO
// ==========================================

botoesModo.forEach(botao => {

    botao.addEventListener("click", function () {

        alterarModo(botao.dataset.mode);

    });

});


// ==========================================
// 17. INICIANDO O JOGO
// ==========================================

alterarModo("solo");
