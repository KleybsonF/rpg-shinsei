import { db, collection, query, where, onSnapshot, addDoc, orderBy, limit, doc, updateDoc } from './firebase.js';

// Verificação de Autenticação
const loggedPlayerId = sessionStorage.getItem('loggedPlayerId');
if (!loggedPlayerId) {
    window.location.href = 'login.html';
}

const playersRing = document.getElementById('players-ring');
const modal = document.getElementById('player-modal');
    const closeBtn = document.querySelector('.close-btn');
    
    let fichas = [];

    // Load fichas that are marked as player using real-time Firebase listener
    function loadPlayers() {
        const q = query(collection(db, "fichas"), where("isPlayer", "==", true));
        
        onSnapshot(q, (querySnapshot) => {
            fichas = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const nomeFicha = data.nome || '';
                const loginFicha = data.login || '';
                const isMasterData = (loginFicha.toLowerCase() === 'mestre' || nomeFicha.toLowerCase() === 'mestre' || data.isMaster === true);
                
                fichas.push({ id: doc.id, isMasterData: isMasterData, ...data });
            });
            fichas = fichas.slice(0, 8); // Max 8 players
            renderPlayers();
            updatePlayerPanel();
        }, (error) => {
            console.error('Erro ao carregar jogadores do Firebase:', error);
        });
    }

    // Position players in an oval/circle around the table
    function renderPlayers() {
        playersRing.innerHTML = '';
        const visiblePlayers = fichas.filter(f => !f.isMasterData);
        
        const count = visiblePlayers.length;
        if (count === 0) {
            playersRing.innerHTML = '<div style="color:var(--text-muted); font-family:var(--font-heading);">Nenhum jogador ativo.</div>';
            return;
        }

        visiblePlayers.forEach((ficha, index) => {
            const slot = document.createElement('div');
            slot.className = 'player-slot';
            // Posição será gerenciada puramente pelo Flexbox no CSS

            // If there's no photo, use a placeholder with initials
            const nomeStr = ficha.nome || '?';
            const inicial = nomeStr.charAt(0).toUpperCase();
            const fotoUrl = ficha.foto || `https://ui-avatars.com/api/?name=${inicial}&background=151520&color=00d2ff&size=128&font-size=0.5&bold=true`;

            const stats = ficha.status || {};
            const attrs = ficha.atributos || {};
            const computedHpMax = 50 + ((attrs.resistencia || 0) * 10) + ((attrs.forca || 0) * 2);
            const computedEstMax = (attrs.estamina || 0) * 2;

            const hpAtual = stats.vidaAtual !== undefined ? stats.vidaAtual : computedHpMax;
            const hpMax = stats.vidaMax || computedHpMax;
            
            const estAtual = stats.estaminaAtual !== undefined ? stats.estaminaAtual : computedEstMax;
            const estMax = stats.estaminaMax || computedEstMax;

            // Se a imagem falhar em carregar (ex: URL inválida), usa o placeholder gerado
            slot.innerHTML = `
                <img src="${fotoUrl}" alt="${ficha.nome}" class="player-foto" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${inicial}&background=151520&color=00d2ff&size=128&font-size=0.5&bold=true';">
                <div class="player-nome">${ficha.nome || 'Sem Nome'}</div>
                <div class="player-mini-status">
                    <span style="color: #ff3366; font-size: 0.8rem; font-weight: bold;">HP: ${hpAtual}/${hpMax}</span>
                    <span style="color: #00d2ff; font-size: 0.8rem; font-weight: bold;">EST: ${estAtual}/${estMax}</span>
                </div>
            `;

            slot.addEventListener('click', () => openModal(ficha, fotoUrl));

            playersRing.appendChild(slot);
        });
    }

    function openModal(ficha, fotoUrl) {
        const isMaster = sessionStorage.getItem('isMaster') === 'true';
        if (!isMaster && ficha.id !== loggedPlayerId) {
            alert("Você só tem permissão para visualizar sua própria Ficha e Lore.");
            return;
        }

        document.getElementById('modal-foto').src = fotoUrl;
        document.getElementById('modal-nome').textContent = ficha.nome || 'Sem Nome';
        document.getElementById('modal-historia').textContent = ficha.historia || 'Nenhuma história definida.';
        document.getElementById('modal-inventario').textContent = ficha.inventario || 'Inventário vazio.';
        
        const statusList = document.getElementById('modal-status');
        statusList.innerHTML = '';
        const stats = ficha.status || {};
        const attrs = ficha.atributos || {};
        const computedHpMax = 50 + ((attrs.resistencia || 0) * 10) + ((attrs.forca || 0) * 2);
        const computedEstMax = (attrs.estamina || 0) * 2;

        const hpAtual = stats.vidaAtual !== undefined ? stats.vidaAtual : computedHpMax;
        const hpMax = stats.vidaMax || computedHpMax;

        const estAtual = stats.estaminaAtual !== undefined ? stats.estaminaAtual : computedEstMax;
        const estMax = stats.estaminaMax || computedEstMax;
        
        const statNames = [
            { label: 'Vida', current: hpAtual, max: hpMax },
            { label: 'Estamina', current: estAtual, max: estMax }
        ];
        
        statNames.forEach(s => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="attr-name">${s.label}</span> <span class="attr-val" style="color: var(--accent-blue);">${s.current || 0} / ${s.max || 0}</span>`;
            statusList.appendChild(li);
        });
        
        const attrsList = document.getElementById('modal-atributos');
        attrsList.innerHTML = '';
        
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
    
    // Dice Logic
    const btnRollD2 = document.getElementById('btn-roll-d2');
    const diceLogs = document.getElementById('dice-logs');

    if (btnRollD2) {
        btnRollD2.addEventListener('click', async () => {
            const loggedPlayerName = sessionStorage.getItem('loggedPlayerName') || 'Jogador Desconhecido';
            const result = Math.floor(Math.random() * 2) + 1; // 1 ou 2
            
            try {
                await addDoc(collection(db, "rolagens"), {
                    playerId: loggedPlayerId,
                    playerName: loggedPlayerName,
                    result: result,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error("Erro ao rolar dado:", error);
            }
        });
    }

    // Listen to Dice Rolls
    function loadDiceLogs() {
        const qLogs = query(collection(db, "rolagens"), orderBy("timestamp", "desc"), limit(10));
        
        onSnapshot(qLogs, (snapshot) => {
            diceLogs.innerHTML = '';
            
            if (snapshot.empty) {
                diceLogs.innerHTML = '<p class="mesa-status">Nenhuma rolagem ainda...</p>';
                return;
            }

            // We get them descending (newest first), but we want to display newest at the top
            snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                const div = document.createElement('div');
                div.className = 'dice-log-item';
                if (data.tipo === 'atributo') {
                    // Compatibilidade com rolagens antigas (sem data.desc)
                    if (!data.desc) {
                        div.innerHTML = `
                            <span class="log-player">${data.playerName}</span> rolou 1D20 para <b>${data.atributo.toUpperCase()}</b>:
                            (Dado: ${data.dadoResult} + Atributo: ${data.attrValue}) = <span class="log-result">${data.result}</span>
                        `;
                    } else {
                        div.innerHTML = `
                            <span class="log-player">${data.playerName}</span> fez um teste de <b>${data.atributo.toUpperCase()}</b> (Nv. ${data.attrValue}):
                            <br><small style="color:var(--text-muted)">Rolagem: ${data.desc} (Máx ${data.max})</small>
                            <br>Resultado: ${data.expression} = <span class="log-result">${data.result}</span>
                        `;
                    }
                } else if (data.tipo === 'dano_fisico') {
                    let acertoHtml = '';
                    if (data.acertoType === 'crit') {
                        acertoHtml = `<span style="color: #ff3366; font-weight: bold; text-shadow: 0 0 5px #ff3366;">CRÍTICO! (Dado = ${data.acerto})</span><br>`;
                    } else if (data.acertoType === 'half') {
                        acertoHtml = `<span style="color: #ffaa00;">De Raspão... (Dado = ${data.acerto})</span><br>`;
                    } else {
                        acertoHtml = `<span style="color: #a8b2c1;">Acerto Normal (Dado = ${data.acerto})</span><br>`;
                    }
                    div.innerHTML = `
                        <span class="log-player">${data.playerName}</span> causou <b>Dano Físico</b> (Nível ${data.tier}):<br>
                        ${acertoHtml}
                        Rolagem: ${data.expression}<br>
                        Resultado do Dano: <span class="log-result" style="color: #ff3366; font-size: 1.5rem;">${data.result}</span>
                    `;
                } else if (data.tipo === 'dano_mira') {
                    let acertoHtml = '';
                    if (data.acertoType === 'crit') {
                        acertoHtml = `<span style="color: #ff3366; font-weight: bold; text-shadow: 0 0 5px #ff3366;">CRÍTICO! (Dado = ${data.acerto})</span><br>`;
                    } else if (data.acertoType === 'half') {
                        acertoHtml = `<span style="color: #ffaa00;">De Raspão... (Dado = ${data.acerto})</span><br>`;
                    } else {
                        acertoHtml = `<span style="color: #a8b2c1;">Acerto Normal (Dado = ${data.acerto})</span><br>`;
                    }
                    div.innerHTML = `
                        <span class="log-player">${data.playerName}</span> causou <b>Dano de Arma (Mira)</b> (Ranking ${data.tier}):<br>
                        ${acertoHtml}
                        Rolagem: ${data.expression}<br>
                        Resultado do Dano: <span class="log-result" style="color: #ff3366; font-size: 1.5rem;">${data.result}</span>
                    `;
                } else {
                    div.innerHTML = `
                        <span class="log-player">${data.playerName}</span> rolou a moeda e tirou: 
                        <span class="log-result">${data.result}</span>
                    `;
                }
                diceLogs.appendChild(div);
            });
        });
    }

// Start
loadPlayers();
loadDiceLogs();

// Player Panel Logic
function updatePlayerPanel() {
    const playerPanel = document.getElementById('player-panel');
    const myFicha = fichas.find(f => f.id === loggedPlayerId);
    
    if (!myFicha) {
        playerPanel.classList.add('hidden');
        return;
    }
    
    playerPanel.classList.remove('hidden');
    document.getElementById('current-player-name').textContent = myFicha.nome || 'Meu Personagem';
    
    const stats = myFicha.status || {};
    const attrs = myFicha.atributos || {};
    const computedHpMax = 50 + ((attrs.resistencia || 0) * 10) + ((attrs.forca || 0) * 2);
    const computedEstMax = (attrs.estamina || 0) * 2;
    
    const hpAtual = stats.vidaAtual !== undefined ? stats.vidaAtual : computedHpMax;
    const hpMax = stats.vidaMax || computedHpMax;
    
    const estAtual = stats.estaminaAtual !== undefined ? stats.estaminaAtual : computedEstMax;
    const estMax = stats.estaminaMax || computedEstMax;

    document.getElementById('hp-value').textContent = `${hpAtual}/${hpMax}`;
    document.getElementById('est-value').textContent = `${estAtual}/${estMax}`;
}

// Update Status Buttons
document.querySelectorAll('.btn-add, .btn-sub').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const myFicha = fichas.find(f => f.id === loggedPlayerId);
        if (!myFicha) return;
        
        const statName = e.target.getAttribute('data-stat');
        const isAdd = e.target.classList.contains('btn-add');
        
        const currentStats = myFicha.status || {};
        let atual = currentStats[`${statName}Atual`] || 0;
        const max = currentStats[`${statName}Max`] || 0;
        
        if (isAdd) {
            atual = Math.min(max, atual + 1);
        } else {
            atual = Math.max(0, atual - 1);
        }
        
        try {
            const fichaRef = doc(db, "fichas", loggedPlayerId);
            await updateDoc(fichaRef, {
                [`status.${statName}Atual`]: atual
            });
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
        }
    });
});

// Helpers para rolagens de atributo
function calculateAttributeRoll(attrValue) {
    let d1 = 20, d2 = 0, type = 0; // 0 = 1d20, 1 = 1d20+1d20, 2 = 1dX * (1+1dY)
    let max = 20;

    if (attrValue < 5) { type = 0; d1 = 20; max = 20; }
    else if (attrValue < 10) { type = 1; d1 = 20; d2 = 20; max = 40; }
    else if (attrValue < 15) { type = 2; d1 = 20; d2 = 2; max = 60; }
    else if (attrValue < 20) { type = 2; d1 = 20; d2 = 3; max = 80; }
    else if (attrValue < 25) { type = 2; d1 = 20; d2 = 4; max = 100; }
    else if (attrValue < 30) { type = 2; d1 = 20; d2 = 5; max = 120; }
    else if (attrValue < 35) { type = 2; d1 = 20; d2 = 6; max = 140; }
    else if (attrValue < 40) { type = 2; d1 = 20; d2 = 8; max = 180; }
    else if (attrValue < 45) { type = 2; d1 = 20; d2 = 10; max = 220; }
    else if (attrValue < 50) { type = 2; d1 = 23; d2 = 10; max = 253; }
    else if (attrValue < 55) { type = 2; d1 = 23; d2 = 11; max = 276; }
    else if (attrValue < 60) { type = 2; d1 = 25; d2 = 11; max = 300; }
    else if (attrValue < 65) { type = 2; d1 = 25; d2 = 12; max = 325; }
    else if (attrValue < 70) { type = 2; d1 = 27; d2 = 12; max = 351; }
    else if (attrValue < 75) { type = 2; d1 = 27; d2 = 13; max = 378; }
    else if (attrValue < 80) { type = 2; d1 = 30; d2 = 13; max = 420; }
    else if (attrValue < 85) { type = 2; d1 = 30; d2 = 14; max = 450; }
    else if (attrValue < 90) { type = 2; d1 = 33; d2 = 14; max = 495; }
    else if (attrValue < 95) { type = 2; d1 = 33; d2 = 15; max = 528; }
    else if (attrValue < 100) { type = 2; d1 = 35; d2 = 15; max = 560; }
    else { type = 2; d1 = 35; d2 = 16; max = 595; }

    let roll1 = Math.floor(Math.random() * d1) + 1;
    let roll2 = d2 > 0 ? Math.floor(Math.random() * d2) + 1 : 0;
    
    let result = 0;
    let expression = "";
    let desc = "";

    if (type === 0) {
        result = roll1;
        expression = `[${roll1}]`;
        desc = `1D${d1}`;
    } else if (type === 1) {
        result = roll1 + roll2;
        expression = `[${roll1} + ${roll2}]`;
        desc = `1D${d1} + 1D${d2}`;
    } else {
        result = roll1 * (1 + roll2);
        expression = `[${roll1} × (1 + ${roll2})]`;
        desc = `1D${d1} × (1 + 1D${d2})`;
    }

    // Se quiser somar o valor base do atributo ao final:
    // O usuário disse apenas: "A cada 5 niveis eles devem ter um upgrade nos seus dados seguindo essa tabela"
    // Vou assumir que o resultado final é apenas a rolagem estipulada pela tabela.

    return { result, expression, desc, max };
}

// Roll Attribute Buttons
document.querySelectorAll('.btn-roll-attr').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const myFicha = fichas.find(f => f.id === loggedPlayerId);
        if (!myFicha) return;
        
        const attrName = e.target.getAttribute('data-attr');
        const attrValue = (myFicha.atributos && myFicha.atributos[attrName]) ? myFicha.atributos[attrName] : 0;
        const loggedPlayerName = sessionStorage.getItem('loggedPlayerName') || myFicha.nome || 'Jogador';
        
        // Apenas Força, Destreza, Mira, Agilidade, Carisma e Intuição usam a nova tabela de escalonamento.
        let rollData;
        const validAttributes = ['forca', 'destreza', 'mira', 'agilidade', 'carisma', 'intuicao'];
        
        if (validAttributes.includes(attrName)) {
            rollData = calculateAttributeRoll(attrValue);
        } else {
            // Resistência, Intuição e outros usam o padrão 1D20 + Atributo
            const dadoResult = Math.floor(Math.random() * 20) + 1;
            rollData = {
                result: dadoResult + attrValue,
                expression: `[${dadoResult}] + ${attrValue}`,
                desc: `1D20 + Atributo`,
                max: 20 + attrValue
            };
        }
        
        try {
            await addDoc(collection(db, "rolagens"), {
                playerId: loggedPlayerId,
                playerName: loggedPlayerName,
                tipo: 'atributo',
                atributo: attrName,
                attrValue: attrValue,
                result: rollData.result,
                expression: rollData.expression,
                desc: rollData.desc,
                max: rollData.max,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error("Erro ao rolar atributo:", error);
        }
});
});

// Lógica de Dano
const weaponDamageTable = {
    1: 20,
    2: 35,
    3: 50,
    4: 70,
    5: 90,
    6: 115,
    7: 140,
    8: 170,
    9: 205,
    10: 245
};

const btnDanoFisico = document.getElementById('btn-dano-fisico');
if (btnDanoFisico) {
    btnDanoFisico.addEventListener('click', async () => {
        const myFicha = fichas.find(f => f.id === loggedPlayerId);
        if (!myFicha) return;
        
        const attrs = myFicha.atributos || {};
        const forca = attrs.forca || 0;
        const destreza = attrs.destreza || 0;
        
        let nivel = Math.floor((forca * 2) + (destreza / 3));
        if (nivel < 0) nivel = 0;
        
        let acerto = Math.floor(Math.random() * 20) + 1;
        let multiplicador = 1;
        let acertoType = 'normal';
        
        if (acerto < 10) {
            multiplicador = 0.5;
            acertoType = 'half';
        } else if (acerto >= 19) {
            multiplicador = 2;
            acertoType = 'crit';
        }

        let rollData = calculateAttributeRoll(nivel);
        rollData.result = Math.floor(rollData.result * multiplicador);
        if (multiplicador !== 1) {
            rollData.expression = `(${rollData.expression}) × ${multiplicador}`;
        }
        
        const loggedPlayerName = sessionStorage.getItem('loggedPlayerName') || myFicha.nome || 'Desconhecido';
        
        try {
            await addDoc(collection(db, "rolagens"), {
                playerId: loggedPlayerId,
                playerName: loggedPlayerName,
                tipo: 'dano_fisico',
                tier: nivel,
                acerto: acerto,
                acertoType: acertoType,
                expression: rollData.expression,
                result: rollData.result,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error("Erro ao rolar dano fisico:", error);
        }
    });
}

const btnDanoMira = document.getElementById('btn-dano-mira');
if (btnDanoMira) {
    btnDanoMira.addEventListener('click', async () => {
        const myFicha = fichas.find(f => f.id === loggedPlayerId);
        if (!myFicha) return;
        
        const attrs = myFicha.atributos || {};

        let tier = parseInt(attrs.armaNivel);
        if (isNaN(tier) || tier < 1) {
            alert("Você está desarmado! Vá na aba de Fichas e selecione um Ranking de arma para poder atirar.");
            return;
        }
        
        let acerto = Math.floor(Math.random() * 20) + 1;
        let multiplicador = 1;
        let acertoType = 'normal';
        
        if (acerto < 10) {
            multiplicador = 0.5;
            acertoType = 'half';
        } else if (acerto >= 19) {
            multiplicador = 2;
            acertoType = 'crit';
        }

        let baseDmg = weaponDamageTable[tier] || 0;
        let result = Math.floor(baseDmg * multiplicador);
        let expression = `${baseDmg} (Base)`;
        if (multiplicador !== 1) {
            expression = `${baseDmg} × ${multiplicador}`;
        }
        
        const loggedPlayerName = sessionStorage.getItem('loggedPlayerName') || myFicha.nome || 'Desconhecido';
        
        try {
            await addDoc(collection(db, "rolagens"), {
                playerId: loggedPlayerId,
                playerName: loggedPlayerName,
                tipo: 'dano_mira',
                tier: tier,
                acerto: acerto,
                acertoType: acertoType,
                expression: expression,
                result: result,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error("Erro ao rolar dano mira:", error);
        }
    });
}

// Spotify Jam Sync
const btnSyncSpotify = document.getElementById('btn-sync-spotify');
const inputSpotifyLink = document.getElementById('spotify-link-input');
const spotifyEmbedContainer = document.getElementById('spotify-embed-container');

if (btnSyncSpotify && inputSpotifyLink) {
    btnSyncSpotify.addEventListener('click', async () => {
        const url = inputSpotifyLink.value.trim();
        if (!url) return;
        
        let embedUrl = url;
        let isJamLink = false;

        // Se for um link de convite para Jam (spotify.link ou spotify.app.link)
        if (url.includes('spotify.link') || url.includes('spotify.app.link')) {
            isJamLink = true;
        } 
        // Se for um link comum do spotify (playlist/musica) converte para embed
        else if (url.includes('open.spotify.com') && !url.includes('/embed/')) {
            embedUrl = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
            // Remove queries se existirem
            embedUrl = embedUrl.split('?')[0];
        }

        try {
            const radioRef = doc(db, "system", "spotify-jam");
            await updateDoc(radioRef, {
                url: embedUrl,
                isJamLink: isJamLink,
                updatedAt: Date.now()
            });
            inputSpotifyLink.value = '';
        } catch (error) {
            console.error("Erro ao sincronizar spotify:", error);
            // Se o doc não existir, tenta criar
            try {
                const { setDoc } = await import('./firebase.js');
                await setDoc(doc(db, "system", "spotify-jam"), {
                    url: embedUrl,
                    isJamLink: isJamLink,
                    updatedAt: Date.now()
                });
                inputSpotifyLink.value = '';
            } catch (err) {
                console.error("Erro final ao criar spotify jam doc", err);
            }
        }
    });
}

// Escuta atualizações do Spotify Jam
function listenSpotifyJam() {
    const radioRef = doc(db, "system", "spotify-jam");
    onSnapshot(radioRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.url && spotifyEmbedContainer) {
                if (data.isJamLink) {
                    spotifyEmbedContainer.innerHTML = `
                        <div style="padding: 15px; background: rgba(30,215,96,0.1); border: 1px solid #1ed760; border-radius: 8px; text-align: center; margin-top: 10px;">
                            <p style="margin-bottom: 10px; color: #1ed760; font-weight: bold; font-family: var(--font-heading);">Uma Jam foi iniciada!</p>
                            <a href="${data.url}" target="_blank" class="btn-success" style="text-decoration: none; display: inline-block;">🎧 Entrar na Jam</a>
                        </div>
                    `;
                } else {
                    spotifyEmbedContainer.innerHTML = `<iframe style="border-radius:12px; margin-top: 10px;" src="${data.url}?utm_source=generator&theme=0" width="100%" height="152" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
                }
            }
        }
    });
}
listenSpotifyJam();
