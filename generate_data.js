const fs = require('fs');

const CX = 1300;
const CY = 800;
const R = 620;

const baseGalaxies = [
  { code: "AU", name: "AURELIA", color: "#58cfff", desc: "A região mais estável do Unity Space: mundos férteis, antigas civilizações e grandes rotas comerciais." },
  { code: "VH", name: "VHAROS", color: "#ff706a", desc: "Uma galáxia moldada por impérios, conflitos e planetas onde sobreviver já é uma forma de poder." },
  { code: "NI", name: "NIHILUS", color: "#c4a36b", desc: "A Galáxia Morta. Ruínas, mundos abandonados e vestígios de uma civilização que ninguém consegue explicar." },
  { code: "DR", name: "DRAKARYS", color: "#ff9b59", desc: "A fronteira selvagem: monstros colossais, climas extremos e ecossistemas imprevisíveis." },
  { code: "NY", name: "NYMÉRIA", color: "#a783ff", desc: "Fenômenos arcanos e anomalias tornam as leis da realidade pouco confiáveis." },
  { code: "EL", name: "ELYSIUM", color: "#55e7a0", desc: "Megacidades, inteligências artificiais e tecnologias que ultrapassam os limites da vida orgânica." }
];

const galaxies = baseGalaxies.map((g, i) => {
  const angle = i * (Math.PI / 3);
  return {
    ...g,
    x: CX + Math.cos(angle) * R * 1.15,
    y: CY + Math.sin(angle) * R
  };
});

const names = {
  AU: ["Aureon", "Verdantis", "Maréa", "Solara", "Eldoria", "Lunaris", "Caelum", "Arboris", "Nivara", "Pelagos", "Terranis", "Genesis"],
  VH: ["Kragor", "Valthera", "Mordrakk", "Aresia", "Ragnar", "Dread", "Ferrum", "Sangria", "Valkyr", "Obsidia", "Kharon", "Imperion"],
  NY: ["Arcana", "Mirage", "Astralis", "Etherea", "Somnia", "Chronos", "Abyssia", "Mystara", "Noctis", "Seraphis", "Paradoxia", "Origin"],
  DR: ["Drakon", "Titania", "Venom", "Inferna", "Glacius", "Feral", "Leviathan", "Gorgona", "Ashen", "Ravager", "Colossus", "Behemoth"],
  EL: ["Elysium Prime", "Neon", "Cyberia", "Mechanus", "Synapse", "Vega", "Quantum", "Nexus", "Chrome", "Datara", "Omega", "Singularity"],
  NI: ["Mortis", "Ruina", "Nox", "Hades", "Void", "Sepulchra", "Erebus", "Lost", "Cenotaph", "Null", "End", "Nihilus"]
};

const types = { AU: "Habitável", VH: "Hostil", NY: "Arcano", DR: "Hostil", EL: "Tecnológico", NI: "Ruína" };
const descriptions = {
  "Aureon": "Capital de Aurelia e um dos maiores centros diplomáticos do universo. Suas cidades foram construídas sobre antigas ruínas pré-humanas.",
  "Verdantis": "Um mundo-floresta onde as copas das árvores alcançam dezenas de quilômetros de altura. Pequenas civilizações vivem entre suas raízes.",
  "Maréa": "Mais de 90% da superfície é oceano. Arquipélagos artificiais servem como portos para navegadores e comerciantes.",
  "Solara": "Desertos dourados e cidades movidas por gigantescos coletores solares. A noite revela duas luas habitáveis.",
  "Eldoria": "Reinos antigos, cavaleiros e tecnologia perdida coexistem em uma sociedade que ainda chama suas naves de 'dragões de ferro'.",
  "Lunaris": "Um planeta marcado por crateras e uma rotação extremamente lenta. A fronteira entre dia e noite é um dos maiores espetáculos do setor.",
  "Caelum": "Continentes flutuam em uma atmosfera densa. As cidades são conectadas por pontes aéreas e portais de transporte.",
  "Arboris": "Uma biosfera quase completamente vertical. Viajar pelo planeta significa subir, descer e atravessar florestas suspensas.",
  "Nivara": "Mundo congelado, porém habitável sob sua crosta. Oceanos subterrâneos abrigam uma fauna bioluminescente.",
  "Pelagos": "Arquipélagos, tempestades tropicais e uma cultura de piratas espaciais fazem deste mundo uma rota difícil de controlar.",
  "Terranis": "Um planeta industrial cuja população vive em cidades-fábrica. A economia depende das minas profundas.",
  "Genesis": "Um dos mundos mais antigos catalogados. Muitos pesquisadores acreditam que sua superfície guarda a origem de uma civilização desaparecida.",
  "Imperion": "Sede do maior império conhecido. Sua capital orbital é visível a olho nu de quase todo o planeta.",
  "Origin": "As anomalias arcanas de Nyméria parecem convergir para este mundo. Nenhuma expedição conseguiu mapear completamente sua superfície.",
  "Chronos": "O tempo não flui na mesma velocidade em toda a superfície. Algumas regiões envelhecem anos enquanto outras permanecem praticamente intactas.",
  "Paradoxia": "As leis físicas mudam de acordo com a localização. Equipamentos de navegação convencionais são inúteis aqui.",
  "Behemoth": "Uma criatura colossal atravessa lentamente o interior do planeta. Durante séculos, seus movimentos foram confundidos com atividade tectônica.",
  "Singularity": "Uma inteligência artificial alcançou um estado de consciência que transcende sua infraestrutura original. Ninguém sabe se ela ainda considera os orgânicos aliados.",
  "Nihilus": "O centro do maior mistério do Unity Space. Ruínas sugerem que este planeta foi construído, não formado naturalmente."
};

function planetDesc(g, i, name) {
  return descriptions[name] || `${name} é um mundo de ${types[g.code].toLowerCase()} localizado no setor ${g.name}. Seu registro ainda contém regiões inexploradas e fenômenos que desafiam os mapas oficiais.`;
}

function hash(i) { return Math.abs(Math.sin(i * 91.73) * 43758.5453) % 1; }

const planets = [];
let globalId = 0;

galaxies.forEach((g, gi) => {
  for (let i = 0; i < 12; i++) {
    const angle = hash(gi * 10 + i) * Math.PI * 2;
    const distance = 45 + i * 20; 
    const speed = (0.0035 - (i * 0.0002)) * (i % 2 === 0 ? 1 : -1);
    
    const px = g.x + Math.cos(angle) * distance;
    const py = g.y + Math.sin(angle) * distance;
    
    const size = 6 + hash(globalId) * 8;

    planets.push({
      id: ++globalId,
      code: `${g.code}-${String(i + 1).padStart(2, "0")}`,
      name: names[g.code][i],
      galaxyId: g.code,
      type: types[g.code],
      x: px,
      y: py,
      baseAngle: angle,
      distance: distance,
      speed: speed,
      size: size,
      desc: planetDesc(g, i, names[g.code][i]),
      population: ["Baixa", "Média", "Alta", "Muito alta"][i % 4],
      climate: ["Temperado", "Árido", "Oceânico", "Gélido", "Instável"][i % 5]
    });
  }
});

const routes = [];
// Local routes removed as requested

const majorLinks = [
  ["AU", "VH", -60],
  ["AU", "DR", 40],
  ["AU", "NY", 20],
  ["VH", "NY", -30],
  ["VH", "NI", 40],
  ["NY", "EL", -50],
  ["DR", "EL", 30],
  ["DR", "NY", -20]
];

majorLinks.forEach(link => {
  const g1 = galaxies.find(g => g.code === link[0]);
  const g2 = galaxies.find(g => g.code === link[1]);
  
  const p1 = planets.filter(p => p.galaxyId === g1.code).sort((a, b) => {
    const da = Math.pow(a.x - g2.x, 2) + Math.pow(a.y - g2.y, 2);
    const db = Math.pow(b.x - g2.x, 2) + Math.pow(b.y - g2.y, 2);
    return da - db;
  })[0];

  const p2 = planets.filter(p => p.galaxyId === g2.code).sort((a, b) => {
    const da = Math.pow(a.x - g1.x, 2) + Math.pow(a.y - g1.y, 2);
    const db = Math.pow(b.x - g1.x, 2) + Math.pow(b.y - g1.y, 2);
    return da - db;
  })[0];

  routes.push({ a: p1.id, b: p2.id, type: 'major', curve: link[2] });
});

const dataJsContent = "export const galaxies = " + JSON.stringify(galaxies, null, 2) + ";\n" +
"export const planets = " + JSON.stringify(planets, null, 2) + ";\n" +
"export const routes = " + JSON.stringify(routes, null, 2) + ";\n";

fs.writeFileSync('data.js', dataJsContent.trim());
console.log('data.js generated successfully.');
