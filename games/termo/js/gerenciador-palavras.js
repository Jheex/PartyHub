
// ==========================================
// 1. CONFIGURAÇÕES
// ==========================================

const CHAVE_PALAVRAS = "partyhub_termo_palavras";

const palavrasOriginais = [...palavras];

// ==========================================
// 2. NORMALIZAÇÃO
// ==========================================

function normalizarPalavra(palavra) {
    return palavra
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
}

// ==========================================
// 3. CARREGAR ARMAZENAMENTO
// ==========================================

function carregarPalavrasSalvas() {
    const dadosSalvos = localStorage.getItem(CHAVE_PALAVRAS);

    if (!dadosSalvos) {
        return {
            adicionadas: [],
            removidas: [],
            editadas: {}
        };
    }

    try {
        const dados = JSON.parse(dadosSalvos);

        return {
            adicionadas: Array.isArray(dados.adicionadas)
                ? dados.adicionadas
                : [],

            removidas: Array.isArray(dados.removidas)
                ? dados.removidas
                : [],

            editadas: dados.editadas &&
                typeof dados.editadas === "object"
                ? dados.editadas
                : {}
        };

    } catch (erro) {
        console.error("Erro ao carregar palavras:", erro);

        return {
            adicionadas: [],
            removidas: [],
            editadas: {}
        };
    }
}

// ==========================================
// 4. VARIÁVEIS PRINCIPAIS
// ==========================================

const armazenamentoPalavras = carregarPalavrasSalvas();

let palavrasDoJogo = [];

// ==========================================
// 5. SALVAR ALTERAÇÕES
// ==========================================

function salvarPalavras() {
    localStorage.setItem(
        CHAVE_PALAVRAS,
        JSON.stringify(armazenamentoPalavras)
    );
}

// ==========================================
// 6. ATUALIZAR LISTA DO JOGO
// ==========================================

function atualizarPalavrasDoJogo() {

    const listaOriginal = palavrasOriginais
        .filter(palavra =>
            !armazenamentoPalavras.removidas.includes(palavra)
        )
        .map(palavra =>
            armazenamentoPalavras.editadas[palavra] || palavra
        );

    const listaCompleta = [
        ...listaOriginal,
        ...armazenamentoPalavras.adicionadas
    ];

    palavrasDoJogo = [
        ...new Set(
            listaCompleta.map(normalizarPalavra)
        )
    ];

    return palavrasDoJogo;
}

// ==========================================
// 7. ADICIONAR PALAVRA
// ==========================================

function adicionarPalavra(palavra) {

    const novaPalavra = normalizarPalavra(palavra);

    if (!/^[A-Z]{5}$/.test(novaPalavra)) {
        return {
            sucesso: false,
            mensagem: "Digite uma palavra válida com 5 letras."
        };
    }

    atualizarPalavrasDoJogo();

    if (palavrasDoJogo.includes(novaPalavra)) {
        return {
            sucesso: false,
            mensagem: "Essa palavra já existe no banco de palavras."
        };
    }

    armazenamentoPalavras.adicionadas.push(novaPalavra);

    salvarPalavras();
    atualizarPalavrasDoJogo();

    return {
        sucesso: true,
        mensagem: `${novaPalavra} adicionada com sucesso!`
    };
}

// ==========================================
// 8. REMOVER PALAVRA
// ==========================================

function removerPalavra(palavra) {

    const palavraRemover = normalizarPalavra(palavra);

    // Verifica se é uma palavra adicionada pelo administrador

    const indiceAdicionada =
        armazenamentoPalavras.adicionadas.findIndex(
            item => normalizarPalavra(item) === palavraRemover
        );

    if (indiceAdicionada !== -1) {

        armazenamentoPalavras.adicionadas.splice(
            indiceAdicionada,
            1
        );

        salvarPalavras();
        atualizarPalavrasDoJogo();

        return {
            sucesso: true,
            mensagem: "Palavra adicionada removida."
        };
    }

    // Verifica se é original ou uma palavra editada

    const palavraOriginal = palavrasOriginais.find(original => {

        const palavraAtual =
            armazenamentoPalavras.editadas[original] || original;

        return normalizarPalavra(palavraAtual) === palavraRemover;
    });

    if (!palavraOriginal) {
        return {
            sucesso: false,
            mensagem: "Palavra não encontrada."
        };
    }

    if (!armazenamentoPalavras.removidas.includes(palavraOriginal)) {
        armazenamentoPalavras.removidas.push(palavraOriginal);
    }

    delete armazenamentoPalavras.editadas[palavraOriginal];

    salvarPalavras();
    atualizarPalavrasDoJogo();

    return {
        sucesso: true,
        mensagem: "Palavra removida do banco de palavras."
    };
}

// ==========================================
// 9. INICIALIZAÇÃO
// ==========================================

atualizarPalavrasDoJogo();

console.log(
    "Palavras disponíveis:",
    palavrasDoJogo.length
);
