require('dotenv').config();
const { default: prisma } = require('./.next/server/pages/api/dashboard.js'); // Not going to work easily without transpilation.
// Let's use ts-node
