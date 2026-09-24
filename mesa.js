document.addEventListener('DOMContentLoaded', () => {
    const playersRing = document.getElementById('players-ring');
    const modal = document.getElementById('player-modal');
    const closeBtn = document.querySelector('.close-btn');
    
    let fichas = [];

    // Load fichas that are marked as player
    async function loadPlayers() {
        try {
            const response = await fetch('/api/data');
            const data = await response.json();
            if (data && data.fichas) {
                fichas = data.fichas.filter(f => f.isPlayer === true).slice(0, 8); // Max 8 players
            }
        } catch (error) {
            console.error('Erro ao carregar jogadores do servidor:', error);
        }
        renderPlayers();
    }

    // Position players in an oval/circle around the table
    function renderPlayers() {
        playersRing.innerHTML = '';
        const count = fichas.length;
        if (count === 0) {
            document.querySelector('.mesa-status').textContent = 'Nenhum jogador encontrado.';
            return;
        } else {
            document.querySelector('.mesa-status').textContent = 'Sessão Ativa';
        }

        fichas.forEach((ficha, index) => {
            const angle = (index / count) * (2 * Math.PI) - (Math.PI / 2); // Start at top
            
            // X and Y in percentages (0 to 100)
            const rx = 45; // horizontal radius in % (a bit smaller than container)
            const ry = 45; // vertical radius in %
            
            const x = 50 + rx * Math.cos(angle);
            const y = 50 + ry * Math.sin(angle);

            const slot = document.createElement('div');
            slot.className = 'player-slot';
            slot.style.left = `${x}%`;
            slot.style.top = `${y}%`;

            // If there's no photo, use a placeholder with initials
            const nomeStr = ficha.nome || '?';
            const inicial = nomeStr.charAt(0).toUpperCase();
            const fotoUrl = ficha.foto || `https://ui-avatars.com/api/?name=${inicial}&background=151520&color=00d2ff&size=128&font-size=0.5&bold=true`;

            slot.innerHTML = `
                <img src="${fotoUrl}" alt="${ficha.nome}" class="player-foto">
                <div class="player-nome">${ficha.nome || 'Sem Nome'}</div>
            `;

            slot.addEventListener('click', () => openModal(ficha, fotoUrl));

            playersRing.appendChild(slot);
        });
    }

    function openModal(ficha, fotoUrl) {
        document.getElementById('modal-foto').src = fotoUrl;
        document.getElementById('modal-nome').textContent = ficha.nome || 'Sem Nome';
        document.getElementById('modal-historia').textContent = ficha.historia || 'Nenhuma história definida.';
        document.getElementById('modal-inventario').textContent = ficha.inventario || 'Inventário vazio.';
        
        const attrsList = document.getElementById('modal-atributos');
        attrsList.innerHTML = '';
        
        const attrs = ficha.atributos || {};
        const attrNames = ['forca', 'destreza', 'mira', 'resistencia', 'agilidade', 'carisma', 'intuicao', 'estamina'];
        
        attrNames.forEach(attr => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="attr-name">${attr}</span> <span class="attr-val">${attrs[attr] || 0}</span>`;
            attrsList.appendChild(li);
        });

        modal.classList.remove('hidden');
    }

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
    
    // Auto refresh every 5 seconds to get updates if someone edited their ficha
    setInterval(loadPlayers, 5000);

    // Start
    loadPlayers();
});
