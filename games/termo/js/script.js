
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
const botaoCompartilhar = document.querySelector("#btn-compartilhar");
const avisoPopup = document.querySelector("#aviso-popup");
const avisoTexto = document.querySelector("#aviso-texto");
const CHAVE_ESTATISTICAS = "termo_estatisticas";
const TOTAL_COLUNAS = 5;
const linhasPorModo = {
    solo: 6,
    dueto: 7,
    trio: 8,
    quarteto: 9
};

let estatisticasRegistradas = false;
let modoEstatisticaSelecionado = "solo";
let temporizadorAviso;
let TOTAL_LINHAS = 6;
let modoAtual = "solo";
let linhaAtual = 0;
let colunaAtual = 0;
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

    areaTabuleiros.style.setProperty(
        "--quantidade-tabuleiros",
        quantidade
    );

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

            if (linha === 0) {
                novaLinha.classList.add("linha-ativa");
            } else {
                novaLinha.classList.add("linha-bloqueada");
            }

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
            resolvido: false,
            linhaResolvida: null

        });

    });

    console.log(
        "Palavras secretas:",
        tabuleiros.map(t => t.palavra)
    );

}

// ==========================================
// ATUALIZANDO O ESTADO VISUAL DAS LINHAS
// ==========================================

function atualizarEstadoLinhas() {

    tabuleiros.forEach(tabuleiro => {

        tabuleiro.linhas.forEach((linha, indice) => {

            linha.classList.remove(
                "linha-ativa",
                "linha-bloqueada",
                "linha-finalizada"
            );

            if (tabuleiro.resolvido) {

                if (indice <= tabuleiro.linhaResolvida) {
                    linha.classList.add("linha-finalizada");
                } else {
                    linha.classList.add("linha-bloqueada");
                }

                return;
            }

            if (indice < linhaAtual) {
                linha.classList.add("linha-finalizada");
            } else if (indice === linhaAtual) {
                linha.classList.add("linha-ativa");
            } else {
                linha.classList.add("linha-bloqueada");
            }

        });

    });

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
        if (celula.value !== "") {

            if (coluna < TOTAL_COLUNAS - 1) {

                colunaAtual = coluna + 1;

                novaLinha.children[coluna + 1].focus();

            } else {

                colunaAtual = coluna;

            }

        } else {

            colunaAtual = coluna;

        }

    });

    celula.addEventListener("focus", function () {
        colunaAtual = coluna;
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

    linhasTeclado.forEach((letras, indice) => {

        const linha = document.createElement("div");
        linha.className = "linha-teclado";

        // Botão de apagar na terceira linha
        if (indice === 2) {
            const apagar = document.createElement("button");

            apagar.type = "button";
            apagar.className = "tecla tecla-especial";
            apagar.textContent = "⌫";
            apagar.title = "Apagar";

            apagar.addEventListener("click", apagarLetra);

            linha.appendChild(apagar);
        }

        letras.split("").forEach(letra => {

            const tecla = document.createElement("button");

            tecla.type = "button";
            tecla.className = "tecla";
            tecla.textContent = letra;
            tecla.dataset.letra = letra;

            tecla.addEventListener("click", function () {
                inserirLetra(letra);
            });

            linha.appendChild(tecla);

        });

        // Botão ENTER na terceira linha
        if (indice === 2) {
            const enter = document.createElement("button");

            enter.type = "button";
            enter.className = "tecla tecla-especial";
            enter.textContent = "ENTER";

            enter.addEventListener("click", validarTentativa);

            linha.appendChild(enter);
        }

        teclado.appendChild(linha);

    });

}

// ==========================================
// DIGITAÇÃO PELO TECLADO VIRTUAL
// ==========================================

function inserirLetra(letra) {

    if (jogoFinalizado || animacaoEmAndamento) return;

    const primeiraLinha = tabuleiros[0].linhas[linhaAtual];

    // Procura a próxima célula disponível
    let coluna = colunaAtual;

    while (
        coluna < TOTAL_COLUNAS &&
        primeiraLinha.children[coluna].value !== ""
    ) {
        coluna++;
    }

    if (coluna >= TOTAL_COLUNAS) return;

    const celula = primeiraLinha.children[coluna];

    celula.value = letra;

    colunaAtual = coluna;

    // Dispara o mesmo evento usado pelo teclado físico
    celula.dispatchEvent(new Event("input", {
        bubbles: true
    }));

}

function apagarLetra() {

    if (jogoFinalizado || animacaoEmAndamento) return;

    const primeiraLinha = tabuleiros[0].linhas[linhaAtual];

    let coluna = colunaAtual;

    // Se a célula atual estiver vazia, volta uma posição
    if (
        coluna >= TOTAL_COLUNAS ||
        primeiraLinha.children[coluna].value === ""
    ) {
        coluna--;
    }

    if (coluna < 0) return;

    const celula = primeiraLinha.children[coluna];

    celula.value = "";

    colunaAtual = coluna;

    espelharLetra(linhaAtual, coluna, "");

    celula.focus();

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

        mostrarAviso("Esta palavra não é aceita!");

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
            tabuleiro.linhaResolvida = linhaAtual;

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

        if (!estatisticasRegistradas) {
            registrarResultado(true, linhaAtual + 1);
            estatisticasRegistradas = true;
        }

        jogoFinalizado = true;
        animacaoEmAndamento = false;

        bloquearTodosTabuleiros();

        mostrarModalResultado(true);

        return;

    }

    // Acabaram as tentativas
    if (linhaAtual === TOTAL_LINHAS - 1) {

        if (!estatisticasRegistradas) {
            registrarResultado(false, linhaAtual + 1);
            estatisticasRegistradas = true;
        }

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
    colunaAtual = 0;
    atualizarEstadoLinhas();

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

    // ==========================================
    // COMPARTILHANDO O RESULTADO
    // ==========================================

    function gerarResultadoCompartilhamento() {

        const simbolos = {
            correct: "🟩",
            present: "🟨",
            absent: "⬛"
        };

        const nomesModos = {
            solo: "SOLO",
            dueto: "DUETO",
            trio: "TRIO",
            quarteto: "QUARTETO"
        };

        // Conta quantas tentativas foram realmente realizadas
        const tentativasRealizadas = tabuleiros[0].linhas.filter(linha => {

            return Array.from(linha.children).every(celula =>
                ["correct", "present", "absent"].some(classe =>
                    celula.classList.contains(classe)
                )
            );

        }).length;

        let resultado = `TERMO - PARTYHUB 🎮\n`;
        resultado += `Modo: ${nomesModos[modoAtual]}\n`;
        resultado += `Tentativas: ${tentativasRealizadas}/${TOTAL_LINHAS}\n\n`;

        // Percorre cada tabuleiro
        tabuleiros.forEach((tabuleiro, indice) => {

            const nomeTabuleiro = nomesModos[
                ["solo", "dueto", "trio", "quarteto"][indice]
            ];

            resultado += `${nomeTabuleiro}\n`;

            // Percorre as tentativas daquele tabuleiro
            tabuleiro.linhas.forEach(linha => {

                const celulas = Array.from(linha.children);

                // Ignora linhas que ainda não foram jogadas
                const linhaRespondida = celulas.every(celula =>
                    ["correct", "present", "absent"].some(classe =>
                        celula.classList.contains(classe)
                    )
                );

                if (!linhaRespondida) return;

                const linhaResultado = celulas.map(celula => {

                    return ["correct", "present", "absent"]
                        .find(classe => celula.classList.contains(classe));

                }).map(classe => simbolos[classe]).join("");

                resultado += `${linhaResultado}\n`;

            });

            resultado += "\n";

        });

        resultado += "Jogue também no PartyHub!";

        return resultado;

    }


    // ==========================================
    // AÇÃO DO BOTÃO COMPARTILHAR
    // ==========================================

    async function compartilharResultado() {

        const textoResultado = gerarResultadoCompartilhamento();

        // Compartilhamento nativo (celular e navegadores compatíveis)
        if (navigator.share) {

            try {

                await navigator.share({
                    title: "Meu resultado no TERMO",
                    text: textoResultado
                });

                return;

            } catch (erro) {

                // Se o usuário cancelar, não tenta copiar
                if (erro.name === "AbortError") return;

                console.error("Erro ao compartilhar:", erro);

            }

        }

        // Alternativa: copiar para a área de transferência
        try {

            await navigator.clipboard.writeText(textoResultado);

            mostrarAviso("Resultado copiado! É só compartilhar.");

        } catch (erro) {

            console.error("Erro ao copiar:", erro);

            mostrarAviso("Não foi possível compartilhar o resultado.");

        }

    }


    // Evento do botão
    botaoCompartilhar.addEventListener("click", compartilharResultado);

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
    estatisticasRegistradas = false;
    colunaAtual = 0;
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

function mostrarAviso(texto) {
    clearTimeout(temporizadorAviso);

    avisoTexto.textContent = texto;
    avisoPopup.classList.add("visivel");

    temporizadorAviso = setTimeout(() => {
        avisoPopup.classList.remove("visivel");
    }, 2200);
}



// ==========================================
// 17. INICIANDO O JOGO
// ==========================================

alterarModo("solo");


// ==========================================
// ESTATÍSTICAS
// ==========================================

function criarEstatisticasVazias() {
    return {
        solo: criarRegistroVazio(),
        dueto: criarRegistroVazio(),
        trio: criarRegistroVazio(),
        quarteto: criarRegistroVazio()
    };
}

function criarRegistroVazio() {
    return {
        partidas: 0,
        vitorias: 0,
        derrotas: 0,
        sequenciaAtual: 0,
        melhorSequencia: 0,
        distribuicao: Array(9).fill(0)
    };
}

function carregarEstatisticas() {
    try {
        const dadosSalvos = localStorage.getItem(CHAVE_ESTATISTICAS);

        if (!dadosSalvos) {
            return criarEstatisticasVazias();
        }

        const dados = JSON.parse(dadosSalvos);
        const padrao = criarEstatisticasVazias();

        // Garante que todos os modos e campos existam
        Object.keys(padrao).forEach(modo => {
            dados[modo] = {
                ...padrao[modo],
                ...(dados[modo] || {})
            };

            if (!Array.isArray(dados[modo].distribuicao)) {
                dados[modo].distribuicao = Array(9).fill(0);
            }
        });

        return dados;

    } catch (erro) {
        console.error("Erro ao carregar estatísticas:", erro);
        return criarEstatisticasVazias();
    }
}

let dadosEstatisticas = carregarEstatisticas();

function salvarEstatisticas() {
    localStorage.setItem(
        CHAVE_ESTATISTICAS,
        JSON.stringify(dadosEstatisticas)
    );
}

function registrarResultado(vitoria, tentativas) {
    const registro = dadosEstatisticas[modoAtual];

    registro.partidas++;

    if (vitoria) {
        registro.vitorias++;
        registro.sequenciaAtual++;

        registro.melhorSequencia = Math.max(
            registro.melhorSequencia,
            registro.sequenciaAtual
        );

        const indice = tentativas - 1;

        if (indice >= 0 && indice < registro.distribuicao.length) {
            registro.distribuicao[indice]++;
        }

    } else {
        registro.derrotas++;
        registro.sequenciaAtual = 0;
    }

    salvarEstatisticas();
}

function mostrarEstatisticas(modo) {
    modoEstatisticaSelecionado = modo;

    const registro = dadosEstatisticas[modo];
    const conteudo = document.querySelector("#conteudo-estatisticas");

    document.querySelectorAll(".estatistica-modo").forEach(botao => {
        botao.classList.toggle(
            "ativo",
            botao.dataset.modo === modo
        );
    });

    const aproveitamento = registro.partidas > 0
        ? Math.round((registro.vitorias / registro.partidas) * 100)
        : 0;

    const maiorDistribuicao = Math.max(
        ...registro.distribuicao,
        1
    );

    const quantidadeTentativas = linhasPorModo[modo];

    let distribuicaoHTML = "";

    for (let i = 0; i < quantidadeTentativas; i++) {
        const quantidade = registro.distribuicao[i] || 0;

        const largura = quantidade > 0
            ? Math.max((quantidade / maiorDistribuicao) * 100, 5)
            : 0;

        distribuicaoHTML += `
            <div class="distribuicao-linha">
                <span>${i + 1}</span>

                <div class="distribuicao-barra">
                    <div
                        class="distribuicao-preenchimento"
                        style="width: ${largura}%"
                    >
                        ${quantidade > 0 ? quantidade : ""}
                    </div>
                </div>
            </div>
        `;
    }

    conteudo.innerHTML = `
        <div class="estatisticas-resumo">

            <div class="estatistica-card">
                <span class="estatistica-valor">
                    ${registro.partidas}
                </span>
                <span class="estatistica-legenda">
                    PARTIDAS
                </span>
            </div>

            <div class="estatistica-card">
                <span class="estatistica-valor">
                    ${registro.derrotas}
                </span>
                <span class="estatistica-legenda">
                    DERROTAS
                </span>
            </div>

            <div class="estatistica-card">
                <span class="estatistica-valor">
                    ${aproveitamento}%
                </span>
                <span class="estatistica-legenda">
                    VITÓRIAS
                </span>
            </div>

            <div class="estatistica-card">
                <span class="estatistica-valor">
                    ${registro.vitorias}
                </span>
                <span class="estatistica-legenda">
                    VENCIDAS
                </span>
            </div>

        </div>

        <div class="estatisticas-sequencias">

            <div class="estatistica-card">
                <span class="estatistica-valor">
                    ${registro.sequenciaAtual}
                </span>
                <span class="estatistica-legenda">
                    SEQUÊNCIA ATUAL
                </span>
            </div>

            <div class="estatistica-card">
                <span class="estatistica-valor">
                    ${registro.melhorSequencia}
                </span>
                <span class="estatistica-legenda">
                    MELHOR SEQUÊNCIA
                </span>
            </div>

        </div>

        <div class="estatisticas-distribuicao">
            <h3>Distribuição das tentativas</h3>
            ${distribuicaoHTML}
        </div>

        ${registro.partidas === 0 ? `
            <div class="estatisticas-vazio">
                Suas estatísticas aparecerão aqui após a primeira partida.
            </div>
        ` : ""}
    `;
}

// ==========================================
// CONTROLE DOS MODAIS DE INFORMAÇÃO
// ==========================================

function abrirModalInfo(id) {
    document.querySelector(`#${id}`).classList.add("aberto");
}

function fecharModalInfo(id) {
    document.querySelector(`#${id}`).classList.remove("aberto");
}

// Abrir estatísticas
document.querySelector("#btn-estatisticas").addEventListener("click", () => {
    mostrarEstatisticas(modoAtual);
    abrirModalInfo("modal-estatisticas");
});

// Abrir como jogar
document.querySelector("#btn-como-jogar").addEventListener("click", () => {
    abrirModalInfo("modal-como-jogar");
});

// Trocar modalidade dentro das estatísticas
document.querySelectorAll(".estatistica-modo").forEach(botao => {
    botao.addEventListener("click", () => {
        mostrarEstatisticas(botao.dataset.modo);
    });
});

// Fechar pelos botões X
document.querySelectorAll("[data-fechar-modal]").forEach(botao => {
    botao.addEventListener("click", () => {
        fecharModalInfo(botao.dataset.fecharModal);
    });
});

// Fechar clicando fora do conteúdo
document.querySelectorAll(".modal-info-overlay").forEach(modal => {
    modal.addEventListener("click", evento => {
        if (evento.target === modal) {
            modal.classList.remove("aberto");
        }
    });
});

// Fechar com ESC
document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") {
        document.querySelectorAll(".modal-info-overlay").forEach(modal => {
            modal.classList.remove("aberto");
        });
    }
});