# Atividade Guiada - Aula 05 (Frameworks I)

GeoBusca CEP: aplicação em React + Vite que busca um endereço pelo CEP, mostra a
localização em um mapa e permite salvar endereços favoritos.

Deploy: https://atividade-guiada-aula-05-frameworks.vercel.app

## Como funciona

1. O usuário digita um CEP e o `CepForm` chama a API do ViaCEP para buscar o endereço.
2. Com o endereço em mãos, a API do OpenCage converte o logradouro em coordenadas.
3. O `MapView` renderiza o mapa (Leaflet + OpenStreetMap) com um marcador no ponto encontrado.
4. O endereço pode ser salvo na lista de favoritos, onde dá para renomear, apagar e reabrir
   cada um. A lista fica no `localStorage`, então continua lá depois de recarregar a página.

## Como rodar

```bash
npm install
cp .env.example .env
npm run dev
```

No arquivo `.env` coloque a sua chave do [OpenCage](https://opencagedata.com) em
`VITE_OPENCAGE_API_KEY`. Sem a chave a busca do CEP continua funcionando, mas o mapa
não é exibido e a aplicação avisa que a chave não foi configurada.

O Vite sobe o projeto em http://localhost:5173.

## Estrutura

```
src/
  api/
    viaCep.js           busca o endereço pelo CEP
    opencage.js         converte o endereço em latitude/longitude
  components/
    CepForm.jsx         campo de CEP e botão de busca
    AddressDisplay.jsx  card com os dados do endereço (busca ou favorito)
    MapView.jsx         mapa com o marcador (react-leaflet)
    FavoritesList.jsx   lista de favoritos com edição e exclusão
  theme.js              tema do Material-UI compartilhado com o styled-components
  App.jsx               estado da aplicação e orquestração das chamadas
  main.jsx
```

## Observações

- O `Grid` do Material-UI na versão instalada (v9) usa a prop `size` no lugar de
  `item xs={..} sm={..}`, então o `AddressDisplay` foi ajustado para essa sintaxe.
- O ícone padrão do marcador do Leaflet não carrega com o Vite, por isso o `MapView`
  importa as imagens do pacote e as registra em `L.Icon.Default`.
- O `react-transition-group` foi adicionado como dependência direta porque o
  `FavoritesList` importa o `TransitionGroup` dele.

## Dependências principais

- react e react-dom
- @mui/material, @mui/icons-material, @emotion/react e @emotion/styled
- styled-components
- axios
- react-leaflet e leaflet
- react-transition-group
