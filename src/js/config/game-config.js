export const PENALTY_CORNERS = [
  'top-left', 'top-center', 'top-right',
  'bottom-left', 'bottom-center', 'bottom-right'
];

export const REAL_HALF_SECONDS = 30;
export const HALF_TIME_PAUSE_MS = 3000;

export const formations = {
  '4-3-3': [[50], [18, 39, 61, 82], [28, 50, 72], [20, 50, 80]],
  '4-4-2': [[50], [18, 39, 61, 82], [15, 38, 62, 85], [33, 67]],
  '3-5-2': [[50], [25, 50, 75], [12, 32, 50, 68, 88], [33, 67]],
  '4-2-3-1': [[50], [18, 39, 61, 82], [35, 65], [20, 50, 80], [50]],
  '5-3-2': [[50], [12, 30, 50, 70, 88], [25, 50, 75], [33, 67]]
};

export const playingStyles = {
  defensive: { attack: -0.09, defense: 0.14, possession: -2, shots: 0.78, passes: 4, pressure: 0.55 },
  attack: { attack: 0.13, defense: -0.06, possession: 2, shots: 1.25, passes: -2, pressure: 1.08 },
  pressing: { attack: 0.08, defense: 0.03, possession: 4, shots: 1.12, passes: -1, pressure: 1.2 },
  balanced: { attack: 0, defense: 0, possession: 0, shots: 1, passes: 0, pressure: 0.9 }
};

export const formationImpact = {
  '4-3-3': { attack: 0.07, defense: -0.02, shots: 1.12 },
  '4-4-2': { attack: 0.02, defense: 0.03, shots: 1.02 },
  '3-5-2': { attack: 0.04, defense: -0.01, shots: 1.08 },
  '4-2-3-1': { attack: 0.03, defense: 0.06, shots: 1.03 },
  '5-3-2': { attack: -0.05, defense: 0.11, shots: 0.9 }
};

const positions = ['GOL', 'LD', 'ZAG', 'ZAG', 'LE', 'VOL', 'MC', 'MEI', 'PD', 'ATA', 'PE', 'GOL', 'DEF', 'MEI', 'ATA', 'ATA', 'DEF', 'VOL', 'MEI', 'ATA', 'DEF', 'MEI', 'ATA'];
const createSquad = names => names.map((name, index) => ({ name, pos: positions[index] }));

export const squads = {
  home: createSquad(['Rafael Costa', 'Lucas Mendes', 'André Silva', 'Bruno Reis', 'Caio Lima', 'João Pedro', 'Matheus Alves', 'Gabriel Souza', 'Diego Rocha', 'Henrique Dias', 'Vitor Hugo', 'Pedro Nunes', 'Igor Martins', 'Ruan Oliveira', 'Felipe Santos', 'Marcos Vinícius', 'Arthur Lima', 'Daniel Alves', 'Guilherme Rocha', 'Luan Ribeiro', 'Murilo Santos', 'Renato Dias', 'César Augusto']),
  away: createSquad(['Thiago Ramos', 'Renan Souza', 'Arthur Melo', 'Davi Ferreira', 'Leandro Gomes', 'Rafael Nóbrega', 'Eduardo Lima', 'Nicolas Dias', 'Wesley Castro', 'Gustavo Reis', 'Alex Santana', 'Murilo Lopes', 'Danilo Reis', 'Henrique Lima', 'João Vitor', 'Samuel Costa', 'Paulo Mendes', 'Fábio Costa', 'Diego Martins', 'Caio Rocha', 'Vitor Reis', 'Léo Santos', 'Breno Alves'])
};

export const builderState = {
  home: { formation: '4-3-3', slots: [...Array(11).keys()], bench: [11, 12, 13, 14, 15, 16, 17, 18, 19], nonrelated: [20, 21, 22] },
  away: { formation: '4-4-2', slots: [...Array(11).keys()], bench: [11, 12, 13, 14, 15, 16, 17, 18, 19], nonrelated: [20, 21, 22] }
};
