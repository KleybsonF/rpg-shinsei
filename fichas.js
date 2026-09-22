document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const listaFichas = document.getElementById('lista-fichas');
    const btnNovaFicha = document.getElementById('btn-nova-ficha');
    const fichaEditor = document.getElementById('ficha-editor');
    const emptyState = document.getElementById('empty-state');
    
    const btnSalvar = document.getElementById('btn-salvar');
    const btnExcluir = document.getElementById('btn-excluir');
    
    // Inputs
    const inputNome = document.getElementById('ficha-nome');
    const inputHistoria = document.getElementById('ficha-historia');
    const inputInventario = document.getElementById('ficha-inventario');
    
    const attrInputs = {
        forca: document.getElementById('attr-forca'),
        destreza: document.getElementById('attr-destreza'),
        mira: document.getElementById('attr-mira'),
        resistencia: document.getElementById('attr-resistencia'),
        agilidade: document.getElementById('attr-agilidade'),
        carisma: document.getElementById('attr-carisma'),
        intuicao: document.getElementById('attr-intuicao'),
        estamina: document.getElementById('attr-estamina')
    };

    let fichas = [];
    let fichaAtualId = null;

    // Load Fichas
    async function loadFichas() {
        try {
            const response = await fetch('/api/data');
            const data = await response.json();
            fichas = data.fichas || [];
            renderFichasList();
        } catch (error) {
            console.error('Erro ao carregar fichas:', error);
            alert('Não foi possível carregar as fichas. Verifique a conexão com o servidor.');
        }
    }

    // Render Sidebar List
    function renderFichasList() {
        listaFichas.innerHTML = '';
        fichas.forEach(ficha => {
            const li = document.createElement('li');
            li.className = 'ficha-item';
            if (fichaAtualId === ficha.id) {
                li.classList.add('active');
            }
            
            const nameDiv = document.createElement('div');
            nameDiv.className = 'ficha-item-name';
            nameDiv.textContent = ficha.nome || 'Ficha Sem Nome';
            
            li.appendChild(nameDiv);
            li.addEventListener('click', () => selectFicha(ficha));
            
            listaFichas.appendChild(li);
        });
    }

    // Select Ficha
    function selectFicha(ficha) {
        fichaAtualId = ficha.id;
        
        // Fill form
        inputNome.value = ficha.nome || '';
        inputHistoria.value = ficha.historia || '';
        inputInventario.value = ficha.inventario || '';
        
        // Fill attributes
        const attrs = ficha.atributos || {};
        for (const key in attrInputs) {
            attrInputs[key].value = attrs[key] || 0;
        }

        // Show editor
        fichaEditor.classList.remove('hidden');
        emptyState.classList.add('hidden');
        
        // Update list active state
        renderFichasList();
    }

    // Create New Ficha
    function createNovaFicha() {
        fichaAtualId = null; // null means new
        
        // Clear form
        inputNome.value = '';
        inputHistoria.value = '';
        inputInventario.value = '';
        
        for (const key in attrInputs) {
            attrInputs[key].value = 0;
        }

        fichaEditor.classList.remove('hidden');
        emptyState.classList.add('hidden');
        
        // Remove active class from list
        document.querySelectorAll('.ficha-item').forEach(item => item.classList.remove('active'));
    }

    // Save Ficha
    async function saveFicha() {
        const fichaData = {
            nome: inputNome.value.trim(),
            historia: inputHistoria.value.trim(),
            inventario: inputInventario.value.trim(),
            atributos: {}
        };

        for (const key in attrInputs) {
            fichaData.atributos[key] = parseInt(attrInputs[key].value) || 0;
        }

        try {
            let url = '/api/fichas';
            if (fichaAtualId) {
                url = `/api/fichas/${fichaAtualId}`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fichaData)
            });

            const result = await response.json();
            if (result.success) {
                alert('Ficha salva com sucesso!');
                if (!fichaAtualId) {
                    fichaAtualId = result.ficha.id;
                }
                await loadFichas();
                
                // Re-select to show active state
                const savedFicha = fichas.find(f => f.id === fichaAtualId);
                if(savedFicha) selectFicha(savedFicha);

            } else {
                alert('Erro ao salvar ficha: ' + result.error);
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar ficha.');
        }
    }

    // Delete Ficha
    async function deleteFicha() {
        if (!fichaAtualId) {
            // Se for uma ficha nova que ainda não foi salva
            fichaEditor.classList.add('hidden');
            emptyState.classList.remove('hidden');
            return;
        }

        if (confirm('Tem certeza que deseja excluir esta ficha? Essa ação não pode ser desfeita.')) {
            try {
                const response = await fetch(`/api/fichas/${fichaAtualId}`, {
                    method: 'DELETE'
                });

                const result = await response.json();
                if (result.success) {
                    alert('Ficha excluída com sucesso!');
                    fichaAtualId = null;
                    fichaEditor.classList.add('hidden');
                    emptyState.classList.remove('hidden');
                    await loadFichas();
                } else {
                    alert('Erro ao excluir: ' + result.error);
                }
            } catch (error) {
                console.error('Erro ao excluir:', error);
                alert('Erro ao excluir ficha.');
            }
        }
    }

    // Event Listeners
    btnNovaFicha.addEventListener('click', createNovaFicha);
    btnSalvar.addEventListener('click', saveFicha);
    btnExcluir.addEventListener('click', deleteFicha);

    // Initial Load
    loadFichas();
});
