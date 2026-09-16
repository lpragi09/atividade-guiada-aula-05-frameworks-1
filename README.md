# Atividade Guiada - Aula 05 (Frameworks I)

GeoBusca CEP: aplicação em React + Vite que busca um endereço pelo CEP, mostra a
localização em um mapa e permite salvar endereços favoritos.

Deploy: https://atividade-guiada-aula-05-frameworks.vercel.app

## Como funciona

1. O usuário digita um CEP e o `CepForm` chama a API do ViaCEP para buscar o endereço.
2. Com o endereço em mãos, a API do OpenCage converte o logradouro em coordenadas.
3. O `MapView` voa até o ponto encontrado (Leaflet + OpenStreetMap) com um marcador animado.
4. O endereço pode ser salvo em "Meus lugares", onde dá para renomear, filtrar, apagar
   (com desfazer) e reabrir cada um. A lista fica no `localStorage`, então continua lá
   depois de recarregar a página, e todos os lugares salvos aparecem juntos no mapa.

## Além do roteiro

Depois de terminar o passo a passo da aula, fui além em alguns pontos:

- **Tema claro/escuro** com um só `theme.js` (`getTheme(mode)`) compartilhado pelo
  Material-UI e pelo styled-components. A escolha fica salva e o padrão segue o sistema.
- **Layout em duas colunas**: painel de busca à esquerda e mapa fixo (`position: sticky`)
  à direita; no celular vira uma coluna e a página rola até o mapa automaticamente.
- **Mapa com todos os favoritos** plotados, cada um com a cor da sua UF. O ponto ativo
  ganha um marcador pulsante feito em CSS (`L.divIcon`) e o mapa anima com `flyTo`
  em vez de recriar o componente. No modo escuro os tiles do OSM recebem um filtro
  CSS, sem precisar de outro provedor de mapas.
- **Máscara de CEP** (`00000-000`), histórico das últimas buscas, atalhos de teclado
  (`/` foca a busca, `Esc` fecha o endereço, `Enter`/`Esc` na edição do apelido).
- **Ações no endereço**: copiar, abrir no Google Maps e **"Rota até aqui"**: pede a
  localização do navegador, coloca o usuário no mapa (ponto verde com raio de precisão)
  e desenha o trajeto até o endereço usando o **OSRM** (servidores públicos da FOSSGIS,
  sem chave), com distância, tempo estimado e troca entre **carro, bike e a pé**.
  Se a permissão de localização já foi dada, o usuário aparece no mapa ao abrir a página.
  Enquanto não há rota, mostra a distância em linha reta (Haversine em `utils/geo.js`).
- **Feedback**: skeleton durante o carregamento, toasts (`Snackbar`) para salvar/copiar
  e **desfazer exclusão**.
- Hook próprio `useLocalStorage` para tirar a repetição de `getItem`/`setItem` do `App`.

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
    osrm.js             calcula a rota (carro, bike, a pé) até o endereço
  components/
    Header.jsx          logo, contadores e botão de tema
    CepForm.jsx         campo de CEP com máscara, histórico e atalho
    AddressDisplay.jsx  card do endereço com copiar, Google Maps e distância
    MapView.jsx         mapa com favoritos, ponto ativo, usuário e rota
    FavoritesList.jsx   lista de lugares com filtro, edição e exclusão
  hooks/
    useLocalStorage.js  useState que persiste no localStorage
    useGeolocation.js   posição do usuário (automática se a permissão já existe)
  utils/
    geo.js              máscara de CEP, Haversine, cores por UF, links
  GlobalStyles.js       fundo animado, marcador do mapa e estilos do Leaflet
  theme.js              tema do Material-UI (claro e escuro)
  App.jsx               estado da aplicação e orquestração das chamadas
  main.jsx
```

## Observações

- O `Grid` do Material-UI na versão instalada (v9) usa a prop `size` no lugar de
  `item xs={..} sm={..}`; o mesmo vale para `slotProps` no lugar de `InputProps`.
- O ícone padrão do marcador do Leaflet não carrega com o Vite, por isso o marcador é
  um `divIcon` em HTML/CSS estilizado no `GlobalStyles`.
- O `react-transition-group` foi adicionado como dependência direta porque o
  `FavoritesList` importa o `TransitionGroup` dele.

## Dependências principais

- react e react-dom
- @mui/material, @mui/icons-material, @emotion/react e @emotion/styled
- styled-components
- axios
- react-leaflet e leaflet
- react-transition-group
