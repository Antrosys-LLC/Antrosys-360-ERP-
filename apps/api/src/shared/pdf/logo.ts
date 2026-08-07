import fs from 'fs';
import path from 'path';

const LOGO_CANDIDATES = [
  path.join(__dirname, '../assets/Antrosys-Logo.png'),
  path.join(__dirname, '../../../../src/shared/assets/Antrosys-Logo.png'),
];

export const LOGO_PATH = LOGO_CANDIDATES.find((p) => fs.existsSync(p)) ?? LOGO_CANDIDATES[0];

export const LOGO_WIDTH = 48;
