let database = { planets: [], bounties: [] };
let currentTab = 'planets'; // 'planets' | 'bounties'
let selectedItem = null;

const elements = {
  navPlanets: document.getElementById('nav-planets'),
  navBounties: document.getElementById('nav-bounties'),
  itemList: document.getElementById('item-list'),
  searchInput: document.getElementById('search-input'),
  
  editorTitle: document.getElementById('editor-title'),
  editorForm: document.getElementById('editor-form'),
  
  editId: document.getElementById('edit-id'),
  editType: document.getElementById('edit-type'),
  editName: document.getElementById('edit-name'),
  editDesc: document.getElementById('edit-desc'),
  editPower: document.getElementById('edit-power'),
  editAparencia: document.getElementById('edit-aparencia'),
  editPersonalidade: document.getElementById('edit-personalidade'),
  editLastSeen: document.getElementById('edit-lastseen'),
  editWanted: document.getElementById('edit-wanted'),
  editImageUrl: document.getElementById('edit-image-url'),
  
  groupPower: document.getElementById('group-power'),
  groupAparencia: document.getElementById('group-aparencia'),
  groupPersonalidade: document.getElementById('group-personalidade'),
  groupLastSeen: document.getElementById('group-lastseen'),
  groupWanted: document.getElementById('group-wanted'),
  btnRandomPlanet: document.getElementById('btn-random-planet'),
  
  imageInput: document.getElementById('image-input'),
  imagePreview: document.getElementById('image-preview'),
  uploadText: document.getElementById('upload-text')
};

async function loadData() {
  try {
    const res = await fetch('/database.json');
    database = await res.json();
    populatePlanetsDropdown();
    renderList();
  } catch (err) {
    console.error("Erro ao carregar dados:", err);
    alert("Falha ao carregar dados do servidor.");
  }
}

function populatePlanetsDropdown() {
  elements.editLastSeen.innerHTML = '';
  database.planets.forEach(p => {
    const option = document.createElement('option');
    option.value = p.id;
    option.textContent = `${p.name} [Setor ${p.galaxyId}]`;
    elements.editLastSeen.appendChild(option);
  });
}

function renderList() {
  const query = elements.searchInput.value.toLowerCase();
  elements.itemList.innerHTML = '';
  
  const items = currentTab === 'planets' ? database.planets : database.bounties;
  
  items.forEach(item => {
    const name = item.name || item.alias;
    const subtitle = currentTab === 'planets' ? `${item.galaxyId} · ${item.type}` : item.power;
    
    if (!name.toLowerCase().includes(query) && !subtitle.toLowerCase().includes(query)) {
      return;
    }
    
    const div = document.createElement('div');
    div.className = `list-item ${selectedItem && selectedItem.id === item.id ? 'selected' : ''}`;
    div.innerHTML = `
      <div>
        <div class="title">${name}</div>
        <div class="subtitle">${subtitle}</div>
      </div>
    `;
    
    div.onclick = () => selectItem(item);
    elements.itemList.appendChild(div);
  });
}

function selectItem(item) {
  selectedItem = item;
  renderList();
  
  elements.editorForm.style.display = 'block';
  elements.editorTitle.textContent = `Editando: ${item.name || item.alias}`;
  
  elements.editId.value = item.id;
  elements.editType.value = currentTab;
  elements.editName.value = item.name || item.alias;
  elements.editDesc.value = item.desc || '';
  
  if (item.image) {
    elements.imagePreview.src = item.image;
    elements.imagePreview.style.display = 'block';
    elements.uploadText.style.display = 'none';
    elements.editImageUrl.value = item.image;
  } else {
    elements.imagePreview.src = '';
    elements.imagePreview.style.display = 'none';
    elements.uploadText.style.display = 'block';
    elements.editImageUrl.value = '';
  }
  
  if (currentTab === 'planets') {
    elements.groupPower.style.display = 'none';
    elements.groupAparencia.style.display = 'none';
    elements.groupPersonalidade.style.display = 'none';
    elements.groupLastSeen.style.display = 'none';
    elements.groupWanted.style.display = 'none';
  } else {
    elements.groupPower.style.display = 'block';
    elements.groupAparencia.style.display = 'block';
    elements.groupPersonalidade.style.display = 'block';
    elements.groupLastSeen.style.display = 'block';
    elements.groupWanted.style.display = 'block';
    elements.editPower.value = item.power || '';
    elements.editAparencia.value = item.aparencia || '';
    elements.editPersonalidade.value = item.personalidade || '';
    elements.editLastSeen.value = item.lastSeenPlanetId || ((item.id % 72) + 1);
    elements.editWanted.checked = item.isWanted !== false;
    elements.editName.value = item.alias || item.name;
  }
}

// Event Listeners
elements.navPlanets.onclick = () => {
  currentTab = 'planets';
  elements.navPlanets.classList.add('active');
  elements.navBounties.classList.remove('active');
  selectedItem = null;
  elements.editorForm.style.display = 'none';
  elements.editorTitle.textContent = "Selecione um item para editar";
  renderList();
};

elements.navBounties.onclick = () => {
  currentTab = 'bounties';
  elements.navBounties.classList.add('active');
  elements.navPlanets.classList.remove('active');
  selectedItem = null;
  elements.editorForm.style.display = 'none';
  elements.editorTitle.textContent = "Selecione um item para editar";
  renderList();
};

elements.searchInput.addEventListener('input', renderList);

elements.btnRandomPlanet.addEventListener('click', () => {
  const options = elements.editLastSeen.options;
  if (options.length > 0) {
    const randomIndex = Math.floor(Math.random() * options.length);
    elements.editLastSeen.selectedIndex = randomIndex;
  }
});

// Image Upload Handling
elements.imageInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('image', file);
  
  elements.uploadText.textContent = "Enviando...";
  
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    
    if (data.success) {
      elements.imagePreview.src = data.url;
      elements.imagePreview.style.display = 'block';
      elements.uploadText.style.display = 'none';
      elements.editImageUrl.value = data.url;
    }
  } catch (err) {
    console.error(err);
    alert('Erro no upload da imagem.');
    elements.uploadText.textContent = "Erro. Tente de novo.";
  }
});

// Form Submission
elements.editorForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const id = elements.editId.value;
  const type = elements.editType.value;
  
  const payload = {
    desc: elements.editDesc.value,
    image: elements.editImageUrl.value
  };
  
  if (type === 'planets') {
    payload.name = elements.editName.value;
  } else {
    payload.alias = elements.editName.value;
    payload.power = elements.editPower.value;
    payload.aparencia = elements.editAparencia.value;
    payload.personalidade = elements.editPersonalidade.value;
    payload.lastSeenPlanetId = parseInt(elements.editLastSeen.value);
    payload.isWanted = elements.editWanted.checked;
  }
  
  try {
    const res = await fetch(`/api/${type}/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      alert("Salvo com sucesso!");
      loadData(); // recarrega a lista
    } else {
      alert("Erro ao salvar.");
    }
  } catch (err) {
    console.error(err);
    alert("Erro na comunicação com o servidor.");
  }
});

// Init
loadData();
