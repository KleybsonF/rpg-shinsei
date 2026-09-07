let galaxies, planets, routes, bounties;
try {
  const response = await fetch('/database.json');
  const data = await response.json();
  galaxies = data.galaxies;
  planets = data.planets;
  routes = data.routes;
  bounties = data.bounties;
} catch (e) {
  console.error("Failed to load data. Is database.json accessible?");
}
const NS = "http://www.w3.org/2000/svg";
const svg = document.getElementById("map");
const viewport = document.getElementById("viewport");
const world = document.getElementById("world");

// Setup gradients
const defs = document.createElementNS(NS, "defs");
svg.appendChild(defs);

function createGradient(id, color) {
  const grad = document.createElementNS(NS, "radialGradient");
  grad.id = id;
  
  const stop1 = document.createElementNS(NS, "stop");
  stop1.setAttribute("offset", "0%");
  stop1.setAttribute("stop-color", "#ffffff");
  stop1.setAttribute("stop-opacity", "0.95");
  
  const stop2 = document.createElementNS(NS, "stop");
  stop2.setAttribute("offset", "35%");
  stop2.setAttribute("stop-color", color);
  
  const stop3 = document.createElementNS(NS, "stop");
  stop3.setAttribute("offset", "100%");
  stop3.setAttribute("stop-color", "#05070d");
  
  grad.appendChild(stop1);
  grad.appendChild(stop2);
  grad.appendChild(stop3);
  defs.appendChild(grad);
}

galaxies.forEach(g => createGradient(`grad-${g.code}`, g.color));

// Layers
const clusterLayer = document.createElementNS(NS, "g");
const routeLayer = document.createElementNS(NS, "g");
const planetLayer = document.createElementNS(NS, "g");

svg.appendChild(clusterLayer);
svg.appendChild(routeLayer);
svg.appendChild(planetLayer);

// Helper function to create SVG elements
function el(tag, attrs = {}, parent) {
  const element = document.createElementNS(NS, tag);
  for (const k in attrs) element.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(element);
  return element;
}

function createLine(a, b, curve = 0) {
  return `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 + curve} ${b.x} ${b.y}`;
}

// Draw Clusters (Galaxies)
galaxies.forEach(g => {
  const r = 210;
  const c = el("circle", { cx: g.x, cy: g.y, r, fill: g.color, stroke: g.color, "fill-opacity": "0.08", "stroke-opacity": "0.3", "stroke-width": 2 }, clusterLayer);
  c.classList.add("cluster");

  const sun = el("circle", { cx: g.x, cy: g.y, r: 16, fill: "#fff", stroke: g.color, "stroke-width": 4 }, clusterLayer);
  sun.style.filter = `drop-shadow(0 0 15px ${g.color})`;
  
  c.onpointerdown = (e) => {
    e.stopPropagation();
    focusMap(g.x, g.y, 0.9);
    updateGalaxyHUD(g);
  };

  el("text", { x: g.x, y: g.y - r + 30, "text-anchor": "middle", class: "cluster-name" }, clusterLayer).textContent = g.name;
  el("text", { x: g.x, y: g.y - r + 50, "text-anchor": "middle", class: "cluster-count" }, clusterLayer).textContent = "12 MUNDOS";
});

// Add Black Hole at the center
const blackHole = el("g", { class: "blackhole" }, clusterLayer);
const bhAura = el("circle", { cx: 1300, cy: 800, r: 80, fill: "#030408", stroke: "#2a1b42", "stroke-width": 8 }, blackHole);
bhAura.style.filter = "drop-shadow(0 0 50px #6a2cc9)";

const accretion1 = el("ellipse", { cx: 1300, cy: 800, rx: 160, ry: 40, fill: "none", stroke: "#8745d6", "stroke-width": 4, class: "accretion-slow" }, blackHole);
accretion1.style.filter = "drop-shadow(0 0 15px #a673e8)";

const accretion2 = el("ellipse", { cx: 1300, cy: 800, rx: 150, ry: 35, fill: "none", stroke: "#a370e0", "stroke-width": 2, class: "accretion-fast" }, blackHole);

el("text", { x: 1300, y: 800 - 110, "text-anchor": "middle", fill: "#cda5ff", class: "cluster-name", style: "font-size:22px;letter-spacing:5px;filter:drop-shadow(0 0 10px #6a2cc9)" }, blackHole).textContent = "VÓRTEX CENTRAL";

// Draw Routes
routes.forEach(route => {
  const p1 = planets.find(p => p.id === route.a);
  const p2 = planets.find(p => p.id === route.b);
  if (!p1 || !p2) return;

  const pathClass = route.type === 'major' ? 'route major' : (route.type === 'local-faint' ? 'route faint' : 'route');
  const curve = route.curve || 0;
  
  route.svgPath = el("path", { d: createLine(p1, p2, curve), class: pathClass }, routeLayer);
});

// Draw Planets
planets.forEach(p => {
  const gal = galaxies.find(gal => gal.code === p.galaxyId);
  
  // Draw the orbital track (linha)
  el("circle", { cx: gal.x, cy: gal.y, r: p.distance, fill: "none", stroke: gal.color, "stroke-width": 1.5, "stroke-opacity": 0.15, class: "orbit-track" }, routeLayer);

  const g = el("g", { class: "planet" }, planetLayer);
  
  // Outer Orbit for visual flair
  if (p.size > 15) {
    p.svgOrbit = el("ellipse", { 
      cx: p.x, cy: p.y, rx: p.size + 5, ry: p.size * 0.35, 
      transform: `rotate(-25 ${p.x} ${p.y})`, 
      fill: "none", stroke: "rgba(255,255,255,0.25)", "stroke-width": 1 
    }, g);
  }

  // Planet body
  p.svgCircle = el("circle", { cx: p.x, cy: p.y, r: p.size, fill: `url(#grad-${p.galaxyId})`, class: "body" }, g);
  
  // Planet Text
  p.svgText = el("text", { x: p.x + p.size + 8, y: p.y + 4, class: "ptext" }, g);
  p.svgText.textContent = p.name;
  
  p.el = g;
  
  g.onpointerdown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    showPlanetInfo(p);
  };
});

// Interactions & Info Panel
const infoPanel = document.getElementById("infoPanel");
const closePanelBtn = document.getElementById("closePanel");

function showPlanetInfo(p) {
  document.querySelectorAll(".planet.selected").forEach(e => e.classList.remove("selected"));
  p.el.classList.add("selected");
  
  const galaxy = galaxies.find(g => g.code === p.galaxyId);
  
  document.getElementById("pCode").textContent = `REGISTRO ${p.code} · MUNDO ${String(p.id).padStart(2, "0")}/72`;
  document.getElementById("pName").textContent = p.name;
  
  const imgEl = document.getElementById("pImage");
  const imgContainer = document.getElementById("pImageContainer");
  if (p.image) {
    imgEl.src = p.image;
    imgContainer.style.display = "block";
  } else {
    imgContainer.style.display = "none";
  }

  document.getElementById("pGalaxy").textContent = galaxy.name;
  
  document.getElementById("pStats").innerHTML = `
    <div class="stat-row"><span>Coordenadas</span><b>${Math.round(p.x)} : ${Math.round(p.y)}</b></div>
  `;
  
  document.getElementById("pDesc").textContent = p.desc;
  document.getElementById("pTags").innerHTML = `
    <span class="tag">${galaxy.name}</span>
    <span class="tag">ARQUIVO ${String(p.id).padStart(2, "0")}</span>
  `;
  
  infoPanel.classList.add("show");
  updateGalaxyHUD(galaxy);
  focusMap(p.x, p.y, 1.25);
}

function updateGalaxyHUD(g) {
  document.getElementById("giTitle").textContent = g.name;
  document.getElementById("giText").textContent = g.desc;
}

closePanelBtn.onclick = () => {
  infoPanel.classList.remove("show");
  document.querySelectorAll(".planet.selected").forEach(e => e.classList.remove("selected"));
};

// Pan & Zoom Engine
let scale = 0.85, tx = 0, ty = 0;
let isDragging = false, startX, startY, originX, originY;

function applyTransform() {
  world.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}

function centerMap() {
  scale = 0.45;
  tx = (window.innerWidth - 2600 * scale) / 2;
  ty = (window.innerHeight - 1600 * scale) / 2;
  applyTransform();
  infoPanel.classList.remove("show");
  document.querySelectorAll(".planet.selected").forEach(e => e.classList.remove("selected"));
}

function focusMap(x, y, targetScale) {
  scale = targetScale;
  tx = window.innerWidth / 2 - x * scale;
  ty = window.innerHeight / 2 - y * scale;
  applyTransform();
}

document.getElementById("home").onclick = centerMap;
document.getElementById("zoomIn").onclick = () => { scale = Math.min(2.5, scale * 1.2); applyTransform(); };
document.getElementById("zoomOut").onclick = () => { scale = Math.max(0.3, scale / 1.2); applyTransform(); };

viewport.addEventListener("wheel", e => {
  e.preventDefault();
  const rect = viewport.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  
  const oldScale = scale;
  const factor = e.deltaY < 0 ? 1.15 : 0.85;
  scale = Math.max(0.3, Math.min(2.5, oldScale * factor));
  
  tx = mx - (mx - tx) * (scale / oldScale);
  ty = my - (my - ty) * (scale / oldScale);
  applyTransform();
}, { passive: false });

viewport.addEventListener("pointerdown", e => {
  if (e.button !== 0) return; // Only left click
  isDragging = true;
  viewport.classList.add("dragging");
  startX = e.clientX; startY = e.clientY;
  originX = tx; originY = ty;
  viewport.setPointerCapture(e.pointerId);
});

viewport.addEventListener("pointermove", e => {
  if (!isDragging) return;
  tx = originX + e.clientX - startX;
  ty = originY + e.clientY - startY;
  applyTransform();
});

viewport.addEventListener("pointerup", () => {
  isDragging = false;
  viewport.classList.remove("dragging");
});

window.addEventListener("resize", () => {
  if (!infoPanel.classList.contains("show")) centerMap();
});

// Search functionality
document.getElementById("search").addEventListener("input", e => {
  const query = e.target.value.toLowerCase().trim();
  
  planets.forEach(p => {
    const match = !query || `${p.name} ${p.type} ${p.galaxyId}`.toLowerCase().includes(query);
    p.el.style.opacity = match ? "1" : "0.1";
  });
  
  if (query) {
    const firstMatch = planets.find(p => `${p.name} ${p.type} ${p.galaxyId}`.toLowerCase().includes(query));
    if (firstMatch) {
      showPlanetInfo(firstMatch);
    }
  }
});

// Initialize
centerMap();

function animate() {
  planets.forEach(p => {
    p.baseAngle += p.speed;
    const gal = galaxies.find(g => g.code === p.galaxyId);
    
    p.x = gal.x + Math.cos(p.baseAngle) * p.distance;
    p.y = gal.y + Math.sin(p.baseAngle) * p.distance;

    p.svgCircle.setAttribute("cx", p.x);
    p.svgCircle.setAttribute("cy", p.y);
    
    p.svgText.setAttribute("x", p.x + p.size + 8);
    p.svgText.setAttribute("y", p.y + 4);

    if (p.svgOrbit) {
      p.svgOrbit.setAttribute("cx", p.x);
      p.svgOrbit.setAttribute("cy", p.y);
      p.svgOrbit.setAttribute("transform", `rotate(-25 ${p.x} ${p.y})`);
    }
  });

  routes.forEach(route => {
    const p1 = planets.find(p => p.id === route.a);
    const p2 = planets.find(p => p.id === route.b);
    if (!p1 || !p2 || !route.svgPath) return;
    route.svgPath.setAttribute("d", createLine(p1, p2, route.curve || 0));
  });

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

// --- BOUNTY BOARD LOGIC ---
const bountyModal = document.getElementById("bounty-modal");
const btnAlvos = document.getElementById("btn-alvos");
const closeBountyBtn = document.getElementById("close-bounty");
const bountyGrid = document.getElementById("bounty-grid");

const bountyDetailModal = document.getElementById("bounty-detail-modal");
const closeBountyDetailBtn = document.getElementById("close-bounty-detail");
const closeBountyDetailOverlay = document.getElementById("close-bounty-detail-overlay");

function openBountyDetail(b, planet) {
  document.getElementById("bd-name").textContent = b.alias.toUpperCase();
  document.getElementById("bd-image").src = b.image || `https://robohash.org/${b.id}?set=set3&bgset=bg1&size=200x200`;
  document.getElementById("bd-lastseen").textContent = `${planet.name} [Setor ${planet.galaxyId}]`;
  document.getElementById("bd-power").textContent = b.power || 'Desconhecido';
  document.getElementById("bd-appearance").textContent = b.aparencia || 'Não documentada';
  document.getElementById("bd-personality").textContent = b.personalidade || 'Não documentada';
  document.getElementById("bd-desc").textContent = b.desc || 'Sem registros adicionais.';
  bountyDetailModal.classList.remove("hidden");
}

closeBountyDetailBtn.onclick = () => bountyDetailModal.classList.add("hidden");
closeBountyDetailOverlay.onclick = () => bountyDetailModal.classList.add("hidden");


function renderBounties() {
  bountyGrid.innerHTML = '';
  bounties.forEach(b => {
    const card = document.createElement('div');
    const isWanted = b.isWanted !== false; // default true
    card.className = `bounty-card ${!isWanted ? 'eliminated' : ''}`;
    
    // Gerar um planeta de avistamento, podendo ser customizado no banco
    const planetId = b.lastSeenPlanetId || ((b.id % 72) + 1);
    const planet = planets.find(p => p.id === parseInt(planetId)) || { name: 'Desconhecido', galaxyId: '??' };
    
    // Placeholder cyberpunk
    const avatarUrl = b.image || `https://robohash.org/${b.id}?set=set3&bgset=bg1&size=200x200`;
    
    card.innerHTML = `
      ${isWanted ? '<div class="wanted-ribbon">WANTED</div>' : ''}
      <div style="flex: 1; position: relative; display: flex; flex-direction: column;">
        <div class="card-image" style="background-image: url('${avatarUrl}'); ${!isWanted ? 'filter: grayscale(1) brightness(0.6) !important;' : ''}"></div>
        ${!isWanted ? '<div class="eliminated-x">X</div>' : ''}
      </div>
      <div class="card-footer">
        <h3>${b.alias.toUpperCase()}</h3>
      </div>
      
      <div class="card-hover">
        <div class="hover-content">
          <h4>VISTO POR ÚLTIMO</h4>
          <p class="last-seen">${planet.name} [Setor ${planet.galaxyId}]</p>
          <div class="divider"></div>
          <h4>PODER REGISTRADO</h4>
          <p class="power">${b.power}</p>
        </div>
      </div>
    `;
    card.onclick = () => openBountyDetail(b, planet);
    bountyGrid.appendChild(card);

  });
}

btnAlvos.onclick = () => {
  bountyModal.classList.remove('hidden');
  if (bountyGrid.children.length === 0) {
    renderBounties();
  }
};

closeBountyBtn.onclick = () => {
  bountyModal.classList.add('hidden');
};
