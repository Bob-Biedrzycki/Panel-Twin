#!/usr/bin/env node
// SCADA simulator for panel VFD 200 (ABARTA Coca-Cola CIP Double Skid, CPME 1082-01). No dependencies: Node 18+ only.
//
//   node scada-sim.mjs [--port 8091] [--modbus-port 5021] [--host 127.0.0.1] [--no-modbus]
//
// It runs the panel model (panel-model.mjs) at 10 Hz as the simulated field side, and serves:
//   http://127.0.0.1:8091/          the SCADA screen (scada.html): CIP process, power, 24 V, heat, alarms, trends, instructor
//   http://127.0.0.1:8091/twin      the 3D digital twin (panel-twin.html), live on the same tags
//   GET  /api/state  /api/tags  /api/history  /api/events     JSON
//   GET  /events                                               Server-Sent Events, a snapshot every 200 ms
//   POST /api/write  { "tag": "VFD200.DRV1.SpeedRef", "value": 55 }   or   { "action": "ack" }
//   Modbus TCP on 127.0.0.1:5021 (FC 1, 2, 3, 4, 5, 6, 15, 16; any unit id). Map: README.md, or GET /api/tags.
// Bind with --host 0.0.0.0 only on a network you trust: there is no authentication, as on a real Modbus device.
// Ports default to 8091 / 5021 so this runs beside the Project 1 simulator (8090 / 5020).
import { createServer } from 'node:http'
import { createServer as createTcp } from 'node:net'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPanel, snapshot, writeTag, TAGS, BAD } from './panel-model.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const a = process.argv.slice(2)
const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d }
const HOST = opt('--host', '127.0.0.1')
const PORT = Number(opt('--port', 8091))
const MB_PORT = Number(opt('--modbus-port', 5021))
const MODBUS = !a.includes('--no-modbus')

// ------------------------------------------------------------------ the simulated panel
const panel = createPanel()
const history = []           // 1 Hz samples, 30 minutes
const HIST_KEYS = ['VFD200.FM1.Flow', 'VFD200.FM2.Flow', 'VFD200.DRV1.OutCurrent', 'VFD200.DRV2.OutCurrent', 'VFD200.Enc.Temp', 'VFD200.Heat.Internal', 'VFD200.TT1.Temp', 'VFD200.LT1.Level']
const events = []            // operator / instructor log
const log = (who, what) => { const e = { t: Date.now(), who, what }; events.push(e); if (events.length > 200) events.shift(); console.log(`${new Date(e.t).toLocaleTimeString()}  ${who.padEnd(7)} ${what}`) }
let last = process.hrtime.bigint(), histAcc = 0
setInterval(() => {
  const now = process.hrtime.bigint(), dt = Math.min(0.5, Number(now - last) / 1e9); last = now
  panel.step(dt)
  if ((histAcc += dt) >= 1) {
    histAcc -= 1
    const s = snapshot(panel)
    history.push([Date.now(), ...HIST_KEYS.map((k) => s.tags[k])])
    if (history.length > 1800) history.shift()
  }
}, 100)

// ------------------------------------------------------------------ writes (HTTP and Modbus share this)
function write(tagName, value, who) {
  if (!writeTag(panel, tagName, value)) return false
  log(who, `${tagName} = ${value}`)
  return true
}
function action(name, who) {
  if (name === 'ack') { panel.ack(); log(who, 'acknowledged all alarms'); return true }
  return false
}

// ------------------------------------------------------------------ HTTP: pages, JSON, SSE
const clients = new Set()
setInterval(() => {
  if (!clients.size) return
  const msg = `data: ${JSON.stringify(snapshot(panel))}\n\n`
  for (const res of clients) res.write(msg)
}, 200)
const page = async (res, f) => {
  try { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(await readFile(join(here, f))) }
  catch { res.writeHead(404); res.end(`${f} not found`) }
}
const json = (res, o, code = 200) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(o)) }
const http = createServer((req, res) => {
  const u = new URL(req.url, 'http://x')
  if (req.method === 'GET') {
    if (u.pathname === '/' || u.pathname === '/scada' || u.pathname === '/scada.html') return page(res, 'scada.html')
    if (u.pathname === '/twin' || u.pathname === '/panel-twin.html') return page(res, 'panel-twin.html')
    if (u.pathname === '/api/hello') return json(res, { scada: true, panel: 'VFD 200', modbus: MODBUS ? { host: HOST, port: MB_PORT } : null })
    if (u.pathname === '/api/state') return json(res, snapshot(panel))
    if (u.pathname === '/api/tags') return json(res, TAGS.map(({ name, kind, addr, scale, unit, desc, set }) => ({ name, kind, addr, scale: scale ?? 1, unit: unit ?? '', desc, writable: !!set })))
    if (u.pathname === '/api/history') return json(res, { keys: HIST_KEYS, rows: history })
    if (u.pathname === '/api/events') return json(res, events.slice(-60))
    if (u.pathname === '/events') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' })
      res.write(`data: ${JSON.stringify(snapshot(panel))}\n\n`)
      clients.add(res); req.on('close', () => clients.delete(res))
      return
    }
  }
  if (req.method === 'POST' && u.pathname === '/api/write') {
    let body = ''
    req.on('data', (c) => { body += c; if (body.length > 4096) req.destroy() })
    req.on('end', () => {
      let o; try { o = JSON.parse(body) } catch { return json(res, { ok: false, error: 'bad json' }, 400) }
      const who = String(o.who ?? 'http').slice(0, 12)
      const ok = o.action ? action(o.action, who) : write(o.tag, o.value, who)
      json(res, { ok }, ok ? 200 : 400)
    })
    return
  }
  res.writeHead(404); res.end('not found')
})
http.listen(PORT, HOST, () => {
  console.log('VFD 200 SCADA simulator')
  console.log(`  SCADA screen   http://${HOST}:${PORT}/`)
  console.log(`  3D twin        http://${HOST}:${PORT}/twin`)
})

// ------------------------------------------------------------------ Modbus TCP server
// registers are read live from the model on each request; writes go through the same tag setters
const byKind = (kind) => new Map(TAGS.filter((t) => t.kind === kind).map((t) => [t.addr, t]))
const MAP = { ir: byKind('ir'), hr: byKind('hr'), di: byKind('di'), co: byKind('co') }
const reg = (t) => { if (!t) return 0; const x = Number(t.get(panel)); if (!Number.isFinite(x)) return BAD; const v = Math.round(x * (t.scale ?? 1)); return Math.max(0, Math.min(65534, v)) }
const bit = (t) => !!(t && t.get(panel))
function handle(pdu, who) {
  const fc = pdu[0], ex = (code) => Buffer.from([fc | 0x80, code])
  const addr = pdu.readUInt16BE(1), qty = pdu.length >= 5 ? pdu.readUInt16BE(3) : 0
  const inRange = (m, n) => { for (let i = 0; i < n; i++) if (!m.has(addr + i)) return false; return true }
  if (fc === 1 || fc === 2) {
    const m = fc === 1 ? MAP.co : MAP.di
    if (qty < 1 || qty > 2000) return ex(3)
    if (!inRange(m, qty)) return ex(2)
    const n = Math.ceil(qty / 8), out = Buffer.alloc(2 + n); out[0] = fc; out[1] = n
    for (let i = 0; i < qty; i++) if (bit(m.get(addr + i))) out[2 + (i >> 3)] |= 1 << (i & 7)
    return out
  }
  if (fc === 3 || fc === 4) {
    const m = fc === 3 ? MAP.hr : MAP.ir
    if (qty < 1 || qty > 125) return ex(3)
    if (!inRange(m, qty)) return ex(2)
    const out = Buffer.alloc(2 + qty * 2); out[0] = fc; out[1] = qty * 2
    for (let i = 0; i < qty; i++) out.writeUInt16BE(reg(m.get(addr + i)), 2 + i * 2)
    return out
  }
  if (fc === 5) {
    const t = MAP.co.get(addr), v = pdu.readUInt16BE(3)
    if (!t) return ex(2)
    if (v !== 0xff00 && v !== 0) return ex(3)
    write(t.name, v === 0xff00, who)
    return Buffer.from(pdu.subarray(0, 5))
  }
  if (fc === 6) {
    const t = MAP.hr.get(addr)
    if (!t) return ex(2)
    write(t.name, pdu.readUInt16BE(3) / (t.scale ?? 1), who)
    return Buffer.from(pdu.subarray(0, 5))
  }
  if (fc === 15) {
    if (qty < 1 || qty > 1968 || pdu.length < 6 + Math.ceil(qty / 8)) return ex(3)
    if (!inRange(MAP.co, qty)) return ex(2)
    for (let i = 0; i < qty; i++) write(MAP.co.get(addr + i).name, !!(pdu[6 + (i >> 3)] & (1 << (i & 7))), who)
    return Buffer.from(pdu.subarray(0, 5))
  }
  if (fc === 16) {
    if (qty < 1 || qty > 123 || pdu.length < 6 + qty * 2) return ex(3)
    if (!inRange(MAP.hr, qty)) return ex(2)
    for (let i = 0; i < qty; i++) { const t = MAP.hr.get(addr + i); write(t.name, pdu.readUInt16BE(6 + i * 2) / (t.scale ?? 1), who) }
    return Buffer.from(pdu.subarray(0, 5))
  }
  return ex(1)
}
if (MODBUS) {
  const mb = createTcp((sock) => {
    const who = `mb:${sock.remotePort}`
    let buf = Buffer.alloc(0)
    sock.on('data', (d) => {
      buf = Buffer.concat([buf, d])
      while (buf.length >= 7) {
        const len = buf.readUInt16BE(4)
        if (len < 2 || len > 254) { sock.destroy(); return }
        if (buf.length < 6 + len) break
        const tid = buf.readUInt16BE(0), unit = buf[6], pdu = buf.subarray(7, 6 + len)
        buf = buf.subarray(6 + len)
        let resp
        try { resp = pdu.length >= 5 || pdu[0] > 16 ? handle(pdu, who) : Buffer.from([pdu[0] | 0x80, 3]) } catch { resp = Buffer.from([pdu[0] | 0x80, 4]) }
        const head = Buffer.alloc(7); head.writeUInt16BE(tid, 0); head.writeUInt16BE(0, 2); head.writeUInt16BE(resp.length + 1, 4); head[6] = unit
        sock.write(Buffer.concat([head, resp]))
      }
    })
    sock.on('error', () => {})
  })
  mb.on('error', (e) => console.log(`  Modbus TCP     not started: ${e.code} on port ${MB_PORT} (try --modbus-port 5022)`))
  mb.listen(MB_PORT, HOST, () => console.log(`  Modbus TCP     ${HOST}:${MB_PORT}  (unit id any; map in README.md)`))
}
