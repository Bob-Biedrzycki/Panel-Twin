#!/usr/bin/env node
// Serve a guide folder over http so it can be opened in a browser pane (the model viewer and tools/audit.js need http).
//   node scripts/serve.mjs "<guide folder>" [port]        (default port 8780; stop it with Ctrl+C or by ending the task)
// Then open  http://127.0.0.1:8780/<the guide>.html   or   http://127.0.0.1:8780/tools/model_viewer.html?k=KEY
// In the page's console, window.guide has DEV, WIRES, G, flyTo, select({ kind: 'wire', i }), showComplete(true).
import { resolve } from 'node:path'
import { serve, pickHtml } from './lib/browser.mjs'

const dir = resolve(process.argv[2] ?? '.'), port = Number(process.argv[3] ?? 8780)
const html = await pickHtml(dir, null)
const { base } = await serve(dir, port)
console.log(`serving ${dir}\n  guide:        ${base}${encodeURIComponent(html)}\n  model viewer: ${base}tools/model_viewer.html?k=<KEY>&v=front,right,top,bottom,back,left`)
