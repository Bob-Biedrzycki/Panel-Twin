// Shared by audit_headless.mjs, shot.mjs and serve.mjs: find a browser, serve a guide folder, run headless once.
import { createServer } from 'node:http'
import { readFile, readdir, stat, mkdtemp, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { join, extname, resolve } from 'node:path'
import { tmpdir } from 'node:os'

export function findBrowser() {
  const exe = [process.env.PANEL_TWIN_BROWSER, 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean).find((p) => existsSync(p))
  if (!exe) { console.error('no Edge or Chrome found: set PANEL_TWIN_BROWSER to the browser executable'); process.exit(2) }
  return exe
}

// The guide's built page: --html if given, else the newest .html in the folder (a stale one from an earlier build or
// an earlier panel name must not be the one that gets checked).
export async function pickHtml(dir, named) {
  if (named) { if (!existsSync(join(dir, named))) { console.error(`${named} is not in ${dir}`); process.exit(2) } return named }
  const all = []
  for (const f of await readdir(dir)) if (f.toLowerCase().endsWith('.html')) all.push({ f, t: (await stat(join(dir, f))).mtimeMs })
  if (!all.length) { console.error(`no .html in ${dir}: build the guide first (node "${join(dir, 'build.mjs')}")`); process.exit(2) }
  all.sort((a, b) => b.t - a.t)
  if (all.length > 1) console.error(`note: ${all.length} .html files in the folder; using the newest, "${all[0].f}". Delete the others or pass --html "<name>".`)
  return all[0].f
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.css': 'text/css', '.bin': 'application/octet-stream' }
export async function serve(dir, port = 0) {
  const root = resolve(dir)
  const server = createServer(async (req, res) => {
    try {
      const p = resolve(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
      if (!p.startsWith(root)) { res.writeHead(403); res.end(); return }
      const body = await readFile(p)
      res.writeHead(200, { 'content-type': TYPES[extname(p).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store' }); res.end(body)
    } catch { res.writeHead(404); res.end('not found') }
  })
  await new Promise((r) => server.listen(port, '127.0.0.1', r))
  return { server, base: `http://127.0.0.1:${server.address().port}/` }
}

// One headless run with its own throwaway profile folder. A shared profile makes a second browser hand off to the
// first and exit with no output, which is what happens when two checks run close together or in two sessions.
export async function headless(exe, flags, url, timeoutMs) {
  const profile = await mkdtemp(join(tmpdir(), 'panel-twin-'))
  try {
    return await new Promise((done) => {
      const child = spawn(exe, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars', '--enable-unsafe-swiftshader', `--user-data-dir=${profile}`, ...flags, url], { stdio: ['ignore', 'pipe', 'pipe'] })
      let out = '', err = ''
      child.stdout.setEncoding('utf8'); child.stdout.on('data', (d) => { out += d })
      child.stderr.setEncoding('utf8'); child.stderr.on('data', (d) => { err += d })
      const t = setTimeout(() => child.kill(), timeoutMs)
      child.on('close', (code) => { clearTimeout(t); done({ out, err, code }) })
    })
  } finally { await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }).catch(() => {}) }
}

const unesc = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
// text of <pre id="..."> in a dumped page, or null
export const preText = (dom, id) => { const m = new RegExp(`<pre id="${id}"[^>]*>([\\s\\S]*?)</pre>`).exec(dom); return m ? unesc(m[1]) : null }
