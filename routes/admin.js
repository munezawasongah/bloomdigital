const express = require('express');

module.exports = (db) => {
  const router = express.Router();

  // simple password protect - set ADMIN_PASSWORD in Railway variables
  function auth(req, res, next) {
    const key = req.query.key || req.headers['x-admin-key'];
    const pwd = process.env.ADMIN_PASSWORD || 'bloom-admin';
    if (key !== pwd) return res.status(401).json({ error: 'Unauthorized' });
    next();
  }

  // ── GET /admin/stats ──────────────────────
  router.get('/stats', auth, (req, res) => {
    const gardens = db.get('gardens').value() || [];

    // group by day
    const byDay = {};
    gardens.forEach(g => {
      const day = new Date(g.createdAt).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    });

    // group by message type
    const byType = {};
    gardens.forEach(g => {
      byType[g.msgType] = (byType[g.msgType] || 0) + 1;
    });

    // group by theme
    const themeNames = ['Rose','Violet','Sunset','Ocean','Forest','Gold','Cherry','Midnight','Blush','Lavender'];
    const byTheme = {};
    gardens.forEach(g => {
      const name = themeNames[g.theme] || 'Unknown';
      byTheme[name] = (byTheme[name] || 0) + 1;
    });

    // recent gardens
    const recent = gardens.slice(-20).reverse().map(g => ({
      shareId:   g.shareId,
      sender:    g.sender,
      recipient: g.recipient,
      msgType:   g.msgType,
      createdAt: new Date(g.createdAt).toLocaleString('en-KE'),
    }));

    res.json({
      summary: { totalGardens: gardens.length },
      gardensByDay: byDay,
      gardensByType: byType,
      gardensByTheme: byTheme,
      recentGardens: recent,
    });
  });

  // ── GET /admin  — HTML dashboard ──────────
  router.get('/', auth, (req, res) => {
    const key = req.query.key;
    res.send(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bloom Admin</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#0a0a0f;color:#e2e8f0;min-height:100vh;padding:24px}
  h1{font-size:1.6rem;font-weight:700;color:#ffb7d5;margin-bottom:4px}
  .sub{color:rgba(255,180,210,.4);font-size:.8rem;margin-bottom:28px}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-bottom:28px}
  .card{background:rgba(255,255,255,.04);border:1px solid rgba(255,180,210,.1);border-radius:8px;padding:20px}
  .card .label{font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,180,210,.4);margin-bottom:8px}
  .card .value{font-size:1.8rem;font-weight:700;color:#ffb7d5}
  .card .value.green{color:#4ade80}
  .card .value.gold{color:#fbbf24}
  table{width:100%;border-collapse:collapse;background:rgba(255,255,255,.03);border-radius:8px;overflow:hidden}
  th{background:rgba(255,180,210,.08);padding:10px 14px;text-align:left;font-size:.65rem;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,180,210,.5)}
  td{padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.04);font-size:.82rem;color:rgba(255,255,255,.7)}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:rgba(255,255,255,.03)}
  .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:.65rem;font-weight:600}
  .badge.love{background:rgba(255,128,170,.15);color:#ffb7d5}
  .badge.birthday{background:rgba(251,191,36,.15);color:#fbbf24}
  .badge.congratulations{background:rgba(74,222,128,.15);color:#4ade80}
  .badge.apology{background:rgba(148,163,184,.15);color:#94a3b8}
  .badge.condolences{background:rgba(255,255,255,.1);color:#e2e8f0}
  .badge.gratitude{background:rgba(167,139,250,.15);color:#a78bfa}
  .section-title{font-size:.75rem;letter-spacing:.15em;text-transform:uppercase;color:rgba(255,180,210,.4);margin:24px 0 12px}
  .refresh{float:right;font-size:.72rem;color:rgba(255,180,210,.3);text-decoration:none;padding:4px 10px;border:1px solid rgba(255,180,210,.15);border-radius:4px}
  .refresh:hover{color:#ffb7d5;border-color:rgba(255,180,210,.4)}
  .empty{text-align:center;padding:32px;color:rgba(255,255,255,.2);font-style:italic;font-size:.85rem}
</style>
</head>
<body>
<h1>🌸 Bloom Admin</h1>
<div class="sub">Gardens Dashboard</div>
<a class="refresh" href="?key=${key}">↻ Refresh</a>

<div id="app"><div class="empty">Loading...</div></div>

<script>
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
fetch('/admin/stats?key=${key}')
  .then(r=>r.json())
  .then(d=>{
    const s=d.summary;
    const days=Object.entries(d.gardensByDay).sort().slice(-7);
    const types=Object.entries(d.gardensByType).sort((a,b)=>b[1]-a[1]);

    document.getElementById('app').innerHTML=\`
      <div class="grid">
        <div class="card"><div class="label">Total Gardens</div><div class="value">\${s.totalGardens}</div></div>
      </div>

      <div class="section-title">Gardens Created — Last 7 Days</div>
      <table>
        <tr><th>Date</th><th>Gardens</th></tr>
        \${days.length ? days.map(([day,n])=>\`<tr><td>\${day}</td><td>\${n}</td></tr>\`).join('') : '<tr><td colspan="2"><div class="empty">No gardens yet</div></td></tr>'}
      </table>

      <div class="section-title">Popular Message Types</div>
      <table>
        <tr><th>Type</th><th>Count</th></tr>
        \${types.length ? types.map(([type,count])=>\`<tr><td><span class="badge \${type}">\${type}</span></td><td>\${count}</td></tr>\`).join('') : '<tr><td colspan="2"><div class="empty">No data yet</div></td></tr>'}
      </table>

      <div class="section-title">Recent Gardens</div>
      <table>
        <tr><th>Date</th><th>From</th><th>To</th><th>Type</th><th>Link</th></tr>
        \${d.recentGardens.length ? d.recentGardens.map(t=>\`
          <tr>
            <td>\${t.createdAt}</td>
            <td>\${esc(t.sender)}</td>
            <td>\${esc(t.recipient)}</td>
            <td><span class="badge \${esc(t.msgType)}">\${esc(t.msgType)}</span></td>
            <td><a href="/garden/\${t.shareId}" target="_blank" style="color:#ffb7d5;font-size:.75rem">Open 🌸</a></td>
          </tr>
        \`).join('') : '<tr><td colspan="5"><div class="empty">No gardens yet</div></td></tr>'}
      </table>
    \`;
  })
  .catch(e=>document.getElementById('app').innerHTML='<div class="empty">Error loading stats</div>');
</script>
</body>
</html>`);
  });

  return router;
};
