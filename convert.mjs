import fs from 'fs';
import { galaxies, planets, routes } from './data.js';
import bounties from './bounties.js';

const database = {
  galaxies,
  planets,
  routes: routes || [],
  bounties
};

fs.writeFileSync('./database.json', JSON.stringify(database, null, 2));
console.log('Conversion successful');
