# Tudo de Helena — Projeto organizado

Este projeto foi separado em arquivos próprios para facilitar manutenção:

- `index.html`: estrutura HTML da página.
- `style.css`: estilos visuais do site.
- `app.js`: lógica JavaScript, carregamento dos produtos, carrinho, resumo do pedido e envio pelo WhatsApp.

## Como abrir

1. Coloque todos os arquivos na mesma pasta.
2. Mantenha também a imagem `logo.png` na mesma pasta, pois o HTML usa o caminho `logo.png`.
3. Abra o arquivo `index.html` no navegador.

## Arquivos externos utilizados

O projeto consulta uma API externa do Google Apps Script para carregar produtos e salvar pedidos:

`https://script.google.com/macros/s/AKfycbzCZOi3sBG78iZP8VYbUUQ54edtH0dfx18vOEmU2mYHsm8rNgZXp1rsFvzyYKnfQNtU9A/exec`

Também há links externos para:

- WhatsApp, usado para enviar o orçamento.
- Instagram: `https://www.instagram.com/tudo.dehelena/`

## Observação importante

Para o visual ficar completo, coloque o arquivo `logo.png` dentro da pasta do projeto, no mesmo nível de `index.html`, `style.css` e `app.js`.


## Subcategorias na planilha

O site agora entende subcategorias quando a coluna `Categoria` usar hífen.

Exemplo:

```text
Adicionais - Doces
Adicionais - Salgados
Adicionais - Unidade
```

Na tela, esses produtos continuam dentro da seção **Adicionais**, mas são exibidos separados por subtítulos, como **Doces**, **Salgados** e **Unidade**.

A estrutura da planilha continua a mesma:

```text
Categoria | Produto | Descrição | Valor
```

Não é necessário criar uma nova coluna.


## Ajuste visual

Os títulos de subcategoria, como "Doces", "Salgados" e "Unidade", estão centralizados na seção Adicionais.

## Ajuste de navegação automática

A rolagem automática continua ativa apenas nas primeiras etapas do orçamento:

- Kit Pegue e Monte → Montagem de Mesa
- Montagem de Mesa → Kit Festa na Mesa
- Kit Festa na Mesa → Doces e Sobremesas

A partir de **Doces e Sobremesas**, o site não rola mais automaticamente após selecionar um item. Assim, o cliente fica livre para escolher vários doces, bolos ou adicionais antes de seguir manualmente.
