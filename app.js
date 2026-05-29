let pedido = [];
let audioContext;

const API_URL = "https://script.google.com/macros/s/AKfycbzCZOi3sBG78iZP8VYbUUQ54edtH0dfx18vOEmU2mYHsm8rNgZXp1rsFvzyYKnfQNtU9A/exec";

const categoriasConfig = {
  "Kit Pegue e Monte": {
    container: "produtos-pegue",
    proxima: "mesa",
    texto: "Item adicionado. Indo para Montagem de Mesa.",
    rolagemAutomatica: true
  },
  "Montagem de Mesa": {
    container: "produtos-mesa",
    proxima: "festa",
    texto: "Item adicionado. Indo para Kit Festa na Mesa.",
    rolagemAutomatica: true
  },
  "Kit Festa na Mesa": {
    container: "produtos-festa",
    proxima: "doces",
    texto: "Item adicionado. Indo para Doces e Sobremesas.",
    rolagemAutomatica: true
  },
  "Doces": {
    container: "produtos-doces",
    proxima: "bolos",
    texto: "Item adicionado. Você pode escolher mais doces ou seguir manualmente.",
    rolagemAutomatica: false
  },
  "Bolos": {
    container: "produtos-bolos",
    proxima: "adicionais",
    texto: "Item adicionado. Você pode escolher mais itens ou seguir manualmente.",
    rolagemAutomatica: false
  },
  "Adicionais": {
    container: "produtos-adicionais",
    proxima: "finalizar",
    texto: "Item adicionado. Você pode escolher mais adicionais ou finalizar manualmente.",
    rolagemAutomatica: false
  }
};

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

window.addEventListener("load", function() {
  if (window.location.hash) {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto"
  });
});

function limparTextoParaHTML(texto) {
  return String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizarTextoBusca(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizarCategoria(categoria) {
  const texto = String(categoria ?? "").trim();
  const textoBusca = normalizarTextoBusca(texto);

  if (textoBusca.includes("adicion") || textoBusca.includes("adicon")) return "Adicionais";
  if (textoBusca.includes("pegue")) return "Kit Pegue e Monte";
  if (textoBusca.includes("montagem")) return "Montagem de Mesa";
  if (textoBusca.includes("festa")) return "Kit Festa na Mesa";
  if (textoBusca.includes("doce")) return "Doces";
  if (textoBusca.includes("bolo")) return "Bolos";

  return texto;
}

function formatarSubcategoria(subcategoria) {
  const texto = String(subcategoria ?? "")
    .trim()
    .replace(/\s+/g, " ");

  if (!texto) return "";

  return texto
    .split(" ")
    .map((palavra, index) => {
      const minusculas = ["a", "as", "o", "os", "de", "da", "das", "do", "dos", "e", "ou"];
      const palavraLower = palavra.toLowerCase();

      if (index > 0 && minusculas.includes(palavraLower)) {
        return palavraLower;
      }

      return palavraLower.charAt(0).toUpperCase() + palavraLower.slice(1);
    })
    .join(" ");
}

function separarCategoriaESubcategoria(categoriaOriginal) {
  const texto = String(categoriaOriginal ?? "").trim();
  const partes = texto.split(/\s*[-–—]\s*/).filter(Boolean);

  const categoriaBase = partes.length > 0 ? partes[0] : texto;
  const subcategoria = partes.length > 1 ? partes.slice(1).join(" - ") : "";

  return {
    categoria: normalizarCategoria(categoriaBase),
    subcategoria: formatarSubcategoria(subcategoria)
  };
}

function criarChaveSubcategoria(subcategoria) {
  return normalizarTextoBusca(subcategoria).replace(/[^a-z0-9]+/g, "-");
}

function obterContainerSubcategoria(container, subcategoria) {
  const nomeSubcategoria = String(subcategoria ?? "").trim();

  if (!nomeSubcategoria) {
    return container;
  }

  container.classList.add("com-subcategorias");

  const chave = criarChaveSubcategoria(nomeSubcategoria);
  let bloco = container.querySelector(`[data-subcategoria-chave="${chave}"]`);

  if (!bloco) {
    bloco = document.createElement("div");
    bloco.className = "subcategoria-bloco";
    bloco.dataset.subcategoriaChave = chave;
    bloco.innerHTML = `
      <h3 class="subcategoria-titulo">${limparTextoParaHTML(nomeSubcategoria)}</h3>
      <div class="cards subcategoria-cards"></div>
    `;

    container.appendChild(bloco);
  }

  return bloco.querySelector(".subcategoria-cards");
}

async function carregarProdutos() {
  try {
    Object.values(categoriasConfig).forEach(config => {
      const container = document.getElementById(config.container);

      if (container) {
        container.innerHTML = "";
        container.classList.remove("com-subcategorias");
      }
    });

    const resposta = await fetch(API_URL);
    const produtos = await resposta.json();

    const produtosNormalizados = produtos
      .map(produto => {
        const dadosCategoria = separarCategoriaESubcategoria(produto.categoria);
        const config = categoriasConfig[dadosCategoria.categoria];

        return {
          ...produto,
          categoriaNormalizada: dadosCategoria.categoria,
          subcategoria: dadosCategoria.subcategoria,
          config
        };
      })
      .filter(produto => produto.config);

    const categoriasComSubcategorias = new Set(
      produtosNormalizados
        .filter(produto => produto.subcategoria)
        .map(produto => produto.categoriaNormalizada)
    );

    produtosNormalizados.forEach(produto => {
      const categoria = produto.categoriaNormalizada;
      const config = produto.config;
      const container = document.getElementById(config.container);

      if (!container) return;

      const usaSubcategoria = categoriasComSubcategorias.has(categoria);
      const subcategoriaExibida = usaSubcategoria ? (produto.subcategoria || "Outros") : "";
      const containerProdutos = obterContainerSubcategoria(container, subcategoriaExibida);

      const nomeProduto = limparTextoParaHTML(produto.produto);
      const categoriaProduto = limparTextoParaHTML(categoria);
      const descricaoBruta = String(produto.descricao ?? "");
      const valor = Number(produto.valor) || 0;
      const nomePedido = `${categoria}${subcategoriaExibida ? " - " + subcategoriaExibida : ""} - ${produto.produto}`;

      const descricaoFormatada = descricaoBruta
        .split(/\r?\n/)
        .map(item => item.trim())
        .filter(item => item.length > 0)
        .map(item => `<li>${limparTextoParaHTML(item)}</li>`)
        .join("");

      containerProdutos.insertAdjacentHTML("beforeend", `
        <div class="card">
          <h3>${nomeProduto}</h3>
          <div class="price">${formatarPreco(valor)}</div>
          <ul>${descricaoFormatada}</ul>
          <button
            class="select-btn"
            data-nome="${limparTextoParaHTML(nomePedido)}"
            data-categoria="${categoriaProduto}"
            data-valor="${valor}">
            Selecionar
          </button>
        </div>
      `);
    });

    document.querySelectorAll(".select-btn").forEach(botao => {
      botao.dataset.originalText = botao.textContent.trim();

      botao.addEventListener("click", function() {
        toggleItem(
          this,
          this.dataset.nome,
          Number(this.dataset.valor),
          this.dataset.categoria
        );
      });
    });

  } catch (erro) {
    mostrarToast("Não foi possível carregar os produtos da planilha.");
    console.error(erro);
  }
}

function irParaOrcamento(event) {
  event.preventDefault();

  const destino = document.getElementById("pegue");

  if (destino) {
    destino.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}

function tocarSomClique() {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const oscilador = audioContext.createOscillator();
    const ganho = audioContext.createGain();

    oscilador.type = "sine";
    oscilador.frequency.setValueAtTime(620, audioContext.currentTime);

    ganho.gain.setValueAtTime(0.06, audioContext.currentTime);
    ganho.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);

    oscilador.connect(ganho);
    ganho.connect(audioContext.destination);

    oscilador.start();
    oscilador.stop(audioContext.currentTime + 0.08);
  } catch (erro) {}
}

function formatarPreco(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarData(data) {
  if (!data) return "";

  const partes = data.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function toggleItem(botao, nome, preco, categoria) {
  const index = pedido.findIndex(item => item.nome === nome);
  const estaSelecionando = index === -1;

  if (estaSelecionando) {
    pedido.push({ nome, preco });
    botao.textContent = "Selecionado";
    botao.classList.add("selected-btn");

    const card = botao.closest(".card");
    if (card) {
      card.classList.add("selected");
    }
  } else {
    pedido.splice(index, 1);
    botao.textContent = botao.dataset.originalText || "Selecionar";
    botao.classList.remove("selected-btn");

    const card = botao.closest(".card");
    if (card) {
      const botoesSelecionados = card.querySelectorAll(".selected-btn");
      if (botoesSelecionados.length === 0) {
        card.classList.remove("selected");
      }
    }
  }

  atualizarResumo();

  if (estaSelecionando) {
    guiarParaProximaCategoria(categoria);
  }
}

function guiarParaProximaCategoria(categoriaAtual) {
  const categoria = normalizarCategoria(categoriaAtual);
  const dados = categoriasConfig[categoria];

  if (!dados) {
    mostrarToast("Item adicionado ao carrinho.");
    return;
  }

  mostrarToast(dados.texto);

  if (!dados.rolagemAutomatica) {
    return;
  }

  setTimeout(() => {
    const destino = document.getElementById(dados.proxima);

    if (destino) {
      destino.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, 850);
}

function mostrarToast(texto) {
  const toast = document.getElementById("toastGuia");

  toast.textContent = texto;
  toast.classList.add("mostrar");

  setTimeout(() => {
    toast.classList.remove("mostrar");
  }, 1800);
}

function atualizarResumo() {
  const lista = document.getElementById("pedidoLista");
  const totalElemento = document.getElementById("pedidoTotal");
  const contador = document.getElementById("contadorCarrinho");

  contador.textContent = pedido.length;

  if (pedido.length === 0) {
    lista.innerHTML = "Nenhum item selecionado ainda.";
    totalElemento.innerHTML = "Total: R$0,00";
    return;
  }

  let total = pedido.reduce((soma, item) => soma + item.preco, 0);

  lista.innerHTML = pedido.map(item => `
    <div class="pedido-item">
      <span>${limparTextoParaHTML(item.nome)} — ${formatarPreco(item.preco)}</span>
      <button type="button" data-remover-item data-nome="${limparTextoParaHTML(item.nome)}">Remover</button>
    </div>
  `).join("");

  totalElemento.innerHTML = `Total: ${formatarPreco(total)}`;
}

function removerItem(nome) {
  pedido = pedido.filter(item => item.nome !== nome);

  document.querySelectorAll("button[data-nome]").forEach(botao => {
    if (botao.dataset.nome === nome) {
      botao.classList.remove("selected-btn");
      botao.textContent = botao.dataset.originalText || "Selecionar";

      const card = botao.closest(".card");
      if (card) {
        const botoesSelecionados = card.querySelectorAll(".selected-btn");
        if (botoesSelecionados.length === 0) {
          card.classList.remove("selected");
        }
      }
    }
  });

  atualizarResumo();
}

function limparPedido() {
  pedido = [];

  document.querySelectorAll(".selected-btn").forEach(botao => {
    botao.classList.remove("selected-btn");
    botao.textContent = botao.dataset.originalText || "Selecionar";
  });

  document.querySelectorAll(".card.selected").forEach(card => {
    card.classList.remove("selected");
  });

  atualizarResumo();
}

function abrirPedido() {
  document.getElementById("fundoPedido").classList.add("aberto");
}

function fecharPedido() {
  document.getElementById("fundoPedido").classList.remove("aberto");
}

function fecharAoClicarFora(event) {
  if (event.target.id === "fundoPedido") {
    fecharPedido();
  }
}

async function salvarPedidoNaPlanilha(dadosPedido) {
  try {
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(dadosPedido)
    });
  } catch (erro) {
    console.error("Não foi possível salvar o pedido na planilha.", erro);
  }
}

async function enviarWhatsApp() {
  if (pedido.length === 0) {
    alert("Selecione pelo menos um item antes de enviar o orçamento.");
    return;
  }

  const total = pedido.reduce((soma, item) => soma + item.preco, 0);

  const dataFesta = document.getElementById("dataFesta").value;
  const horarioFesta = document.getElementById("horarioFesta").value;
  const temaFesta = document.getElementById("temaFesta").value.trim();
  const observacoesFesta = document.getElementById("observacoesFesta").value.trim();

  const dataTexto = dataFesta ? formatarData(dataFesta) : "Não informado";
  const horarioTexto = horarioFesta ? horarioFesta : "Não informado";
  const temaTexto = temaFesta ? temaFesta : "Não informado";
  const observacoesTexto = observacoesFesta ? observacoesFesta : "Nenhuma observação informada";

  const itensTexto = pedido
    .map(item => `- ${item.nome}: ${formatarPreco(item.preco)}`)
    .join("\n");

  await salvarPedidoNaPlanilha({
    nome: "",
    telefone: "",
    itens: itensTexto,
    total: total,
    dataFesta: dataTexto,
    horarioFesta: horarioTexto,
    tema: temaTexto,
    observacoes: observacoesTexto
  });

  const mensagem =
    `Olá! Gostaria de fazer um orçamento com os seguintes itens:\n\n` +
    `${itensTexto}\n\n` +
    `Total aproximado: ${formatarPreco(total)}\n\n` +
    `Data da festa: ${dataTexto}\n` +
    `Horário da festa: ${horarioTexto}\n` +
    `Tema da festa: ${temaTexto}\n` +
    `Observações: ${observacoesTexto}\n\n` +
    `Meu nome:\n` +
    `Endereço/bairro:\n`;

  const telefone = "5511974230782";
  const link = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;

  window.open(link, "_blank");
}

function configurarEventosEstaticos() {
  document.addEventListener("click", function(event) {
    const elemento = event.target.closest("button, a");

    if (elemento) {
      tocarSomClique();
    }
  });

  const botaoComecar = document.getElementById("comecarOrcamento");
  if (botaoComecar) {
    botaoComecar.addEventListener("click", irParaOrcamento);
  }

  document.querySelectorAll("[data-abrir-pedido]").forEach(botao => {
    botao.addEventListener("click", abrirPedido);
  });

  const fundoPedido = document.getElementById("fundoPedido");
  if (fundoPedido) {
    fundoPedido.addEventListener("click", fecharAoClicarFora);
  }

  const botaoFecharPedido = document.getElementById("fecharPedido");
  if (botaoFecharPedido) {
    botaoFecharPedido.addEventListener("click", fecharPedido);
  }

  const botaoLimparPedido = document.getElementById("limparPedido");
  if (botaoLimparPedido) {
    botaoLimparPedido.addEventListener("click", limparPedido);
  }

  const botaoEnviarWhatsApp = document.getElementById("enviarWhatsApp");
  if (botaoEnviarWhatsApp) {
    botaoEnviarWhatsApp.addEventListener("click", enviarWhatsApp);
  }

  const listaPedido = document.getElementById("pedidoLista");
  if (listaPedido) {
    listaPedido.addEventListener("click", function(event) {
      const botaoRemover = event.target.closest("[data-remover-item]");

      if (botaoRemover) {
        removerItem(botaoRemover.dataset.nome);
      }
    });
  }
}

configurarEventosEstaticos();
carregarProdutos();
