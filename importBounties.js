import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const txtPath = path.join(__dirname, 'Shinsei.txt');
const dbPath = path.join(__dirname, 'database.json');

const txtContent = fs.readFileSync(txtPath, 'utf8');
const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const blocks = txtContent.split('\n\n').map(b => b.trim()).filter(b => b.length > 0);

if (blocks.length !== 72) {
    console.error(`Aviso: Esperados 72 blocos no txt, encontrados ${blocks.length}`);
}

blocks.forEach((block, index) => {
    const lines = block.split('\n');
    const nameLine = lines[0]; // ex: Bael
    const poderMatch = lines.find(l => l.startsWith('- Poder:'));
    const aparenciaMatch = lines.find(l => l.startsWith('- Aparencia:'));
    const personalidadeMatch = lines.find(l => l.startsWith('- Personalidade:'));

    const poder = poderMatch ? poderMatch.replace('- Poder:', '').trim() : '';
    const aparencia = aparenciaMatch ? aparenciaMatch.replace('- Aparencia:', '').trim() : '';
    const personalidade = personalidadeMatch ? personalidadeMatch.replace('- Personalidade:', '').trim() : '';

    if (dbContent.bounties && index < dbContent.bounties.length) {
        dbContent.bounties[index].shinseiName = nameLine.trim();
        // Update power if it was empty or keep the one from txt if we want to overwrite
        // The user wants to import from Shinsei.txt
        dbContent.bounties[index].power = poder;
        dbContent.bounties[index].aparencia = aparencia;
        dbContent.bounties[index].personalidade = personalidade;
    }
});

fs.writeFileSync(dbPath, JSON.stringify(dbContent, null, 2));
console.log('Migração concluída com sucesso!');
