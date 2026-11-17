# SimuladorFut

## Organização do projeto

```text
SimuladorFut/
├── index.html              # Estrutura da aplicação
├── styles.css              # Estilos globais e componentes visuais
├── script.js               # Orquestração do simulador no navegador
├── src/js/config/          # Formações, estilos, elencos e regras fixas
├── src/js/core/            # Acesso ao DOM e referências compartilhadas
├── src/js/utils/           # Funções utilitárias reutilizáveis
├── netlify/functions/      # API serverless para lobbies no Netlify
├── server.js               # API local para desenvolvimento
├── netlify.toml            # Deploy, funções e redirects do Netlify
└── package.json            # Scripts do projeto
```

O frontend utiliza módulos JavaScript nativos e o `script.js` funciona como ponto de entrada/orquestrador. Configurações de jogo, referências do DOM e utilitários foram retirados do arquivo principal para reduzir acoplamento e facilitar manutenção.

## Deploy no Netlify

O projeto já contém `netlify.toml` e a função `netlify/functions/api.js`. No Netlify, selecione esta pasta como diretório do projeto e publique sem comando de build. A pasta de publicação é `.` e as rotas `/api/*` são encaminhadas automaticamente para a função.

O frontend usa a API local apenas quando aberto como arquivo (`file://`). Em um domínio Netlify, ele usa automaticamente a API do mesmo domínio.

Para testar localmente com o ambiente do Netlify, instale a Netlify CLI e execute `netlify dev`. O servidor Node original continua disponível com `npm start`.

Importante: a função usa memória do processo para os lobbies. Isso é suficiente para teste e demonstração, mas para uma versão online definitiva será necessário conectar um banco ou armazenamento persistente, porque funções serverless podem reiniciar.

## Rodar o modo online

Na pasta `SimuladorFut`, execute:

```bash
npm start
```

Depois abra `http://localhost:3010`. O servidor mantém a lista de lobbies em memória e atualiza as salas entre os clientes conectados.

O limite de cada lobby é configurável entre 2 e 20 jogadores. Salas privadas exigem senha para entrada.
