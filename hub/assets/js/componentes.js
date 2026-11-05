
async function carregarComponente(elemento, arquivo) {

    const container = document.querySelector(elemento);

    if (!container) {
        console.error(`Elemento ${elemento} não encontrado.`);
        return;
    }

    try {

        const resposta = await fetch(arquivo);

        if (!resposta.ok) {
            throw new Error(`Erro ao carregar ${arquivo}`);
        }

        const conteudo = await resposta.text();

        container.innerHTML = conteudo;

    } catch (erro) {

        console.error("Erro ao carregar componente:", erro);

        container.innerHTML = `
            <p>Não foi possível carregar este componente.</p>
        `;

    }
}


// Carregar cabeçalho e rodapé
document.addEventListener("DOMContentLoaded", async () => {

    await Promise.all([
        carregarComponente("#header", "header.html"),
        carregarComponente("#footer", "footer.html")
    ]);

});
