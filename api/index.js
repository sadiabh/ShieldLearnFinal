// ─────────────────────────────────────────────────────────────────────────────
//  api/index.js  —  Vercel serverless entry point
//
//  Vercel treats files in /api as individual Node.js serverless functions.
//  This one re-exports the Express app from server/server.js so every
//  /api/* request is handled by the same Express router we use locally.
//
//  Reference: https://vercel.com/docs/functions/runtimes/node-js
// ─────────────────────────────────────────────────────────────────────────────

module.exports = require('../server/server.js')
