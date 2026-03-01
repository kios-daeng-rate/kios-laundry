import fs from 'fs';
import path from 'path';

const dummyFile = fs.readFileSync(path.join(process.cwd(), 'src/data/dummyData.js'), 'utf-8');

// A very naive eval setup just to see if the mapping throws
// (we'll just use Regex or eval to extract orders and revenueData7Days)
// Actually, since it's ES modules, let's just write a test wrapper.
