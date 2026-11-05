// ======================================
// 1. CARROSSEL
// ======================================

const slides = document.querySelectorAll(".hero-slide");
const indicadores = document.querySelector("#indicadores");

const btnAnterior = document.querySelector("#anterior-slide");
const btnProximo = document.querySelector("#proximo-slide");

let slideAtual = 0;
let intervaloCarrossel;

function criarIndicadores() {

    slides.forEach((slide, index) => {

        const botao = document.createElement("button");

        botao.classList.add("hero-dot");

        botao.setAttribute("aria-label", `Ir para o slide ${index + 1}`);

        botao.addEventListener("click", () => {
            mostrarSlide(index);
            reiniciarCarrossel();
        });

        indicadores.appendChild(botao);

    });

}

function mostrarSlide(index) {

    slides.forEach(slide => {
        slide.classList.remove("active");
    });

    const botoes = document.querySelectorAll(".hero-dot");

    botoes.forEach(botao => {
        botao.classList.remove("active");
    });

    slideAtual = (index + slides.length) % slides.length;

    slides[slideAtual].classList.add("active");
    botoes[slideAtual].classList.add("active");

}

function proximoSlide() {
    mostrarSlide(slideAtual + 1);
}

function slideAnterior() {
    mostrarSlide(slideAtual - 1);
}

function iniciarCarrossel() {

    intervaloCarrossel = setInterval(() => {
        proximoSlide();
    }, 6000);

}

function reiniciarCarrossel() {

    clearInterval(intervaloCarrossel);
    iniciarCarrossel();

}

btnProximo.addEventListener("click", () => {
    proximoSlide();
    reiniciarCarrossel();
});

btnAnterior.addEventListener("click", () => {
    slideAnterior();
    reiniciarCarrossel();
});

criarIndicadores();
mostrarSlide(0);
iniciarCarrossel();


// ======================================
// 2. COMPARTILHAMENTO
// ======================================

document.querySelectorAll(".share-button").forEach(botao => {

    botao.addEventListener("click", () => {

        const card = botao.closest(".game-card");
        const menu = card.querySelector(".share-menu");

        const estavaAberto = menu.classList.contains("open");

        document.querySelectorAll(".share-menu").forEach(item => {
            item.classList.remove("open");
        });

        document.querySelectorAll(".share-button").forEach(item => {
            item.setAttribute("aria-expanded", "false");
        });

        if (!estavaAberto) {
            menu.classList.add("open");
            botao.setAttribute("aria-expanded", "true");
        }

    });

});


document.querySelectorAll(".share-menu").forEach(menu => {

    menu.addEventListener("click", async event => {

        const opcao = event.target.closest("[data-share]");

        if (!opcao) return;

        event.preventDefault();

        const card = menu.closest(".game-card");
        const nomeJogo = card.querySelector("h3").textContent;

        const linkJogo = new URL(
            card.querySelector(".play-button[href]")?.getAttribute("href") || window.location.pathname,
            window.location.href
        ).href;

        const texto = `Confira o jogo ${nomeJogo} no PartyHub!`;

        let destino = "";

        switch (opcao.dataset.share) {

            case "whatsapp":
                destino = `https://wa.me/?text=${encodeURIComponent(texto + " " + linkJogo)}`;
                break;

            case "facebook":
                destino = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkJogo)}`;
                break;

            case "x":
                destino = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(linkJogo)}`;
                break;

            case "copy":

                try {

                    await navigator.clipboard.writeText(linkJogo);

                    opcao.textContent = "Link copiado!";

                    setTimeout(() => {
                        opcao.textContent = "Copiar link";
                    }, 1800);

                } catch (erro) {

                    window.prompt("Copie o link do jogo:", linkJogo);

                }

                return;

        }

        if (destino) {
            window.open(destino, "_blank", "noopener,noreferrer");
        }

        menu.classList.remove("open");

        menu.closest(".game-card")
            .querySelector(".share-button")
            .setAttribute("aria-expanded", "false");

    });

});


// Fecha menus ao clicar fora

document.addEventListener("click", event => {

    if (!event.target.closest(".game-card")) {

        document.querySelectorAll(".share-menu").forEach(menu => {
            menu.classList.remove("open");
        });

        document.querySelectorAll(".share-button").forEach(botao => {
            botao.setAttribute("aria-expanded", "false");
        });

    }

});


// ======================================
// 3. PESQUISA DE JOGOS
// ======================================

const campoPesquisa = document.querySelector("#pesquisa-jogos");

campoPesquisa.addEventListener("input", () => {

    const pesquisa = campoPesquisa.value
        .trim()
        .toLowerCase();

    document.querySelectorAll(".game-card").forEach(card => {

        const nome = card.dataset.nome.toLowerCase();

        card.style.display = nome.includes(pesquisa)
            ? ""
            : "none";

    });

});