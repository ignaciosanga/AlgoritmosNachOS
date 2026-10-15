const Grafos = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const R = 24;
  const MAXN = 20;
  const FUENTE = "'Roboto Flex', Arial, sans-serif";
  const F = v => Algoritmos.fmt(v);
  const $ = s => document.querySelector(s);
  const r1 = v => Math.round(v * 10) / 10;

  const ayudas = {
    mover: 'Arrastra los nodos para acomodarlos.',
    nodo: 'Toca un espacio vacío del lienzo para crear un nodo. También puedes arrastrar los existentes.',
    conectar: 'Toca el nodo de origen y luego el de destino. Toca el mismo nodo dos veces para crear un bucle.',
    editar: 'Toca un nodo para renombrarlo o una conexión para cambiar su peso.',
    borrar: 'Toca un nodo o una conexión para eliminarlo.'
  };

  let G = { nodos: [], aristas: [], sigId: 1 };
  let herramienta = 'mover';
  let origen = null;
  let resaltado = null;
  let modoMatriz = 'pesos';
  let verCard = true;
  let pendiente = null;
  let toque = null;
  let svg, capa, lienzo;
  let tam = { w: 800, h: 480 };
  let vb = { w: 800, h: 480 };

  const nodo = id => G.nodos.find(n => n.id === id);
  const clave = (de, a) => de + '>' + a;
  const tieneBucle = id => G.aristas.some(a => a.de === id && a.a === id);
  const minY = id => tieneBucle(id) ? R + 70 : R + 10;
  const limitar = (v, a, b) => Math.min(b, Math.max(a, v));

  function ejemplo() {
    const nombres = ['A', 'B', 'C', 'D'];
    return {
      nodos: nombres.map((nombre, i) => ({ id: i + 1, nombre, x: 0, y: 0 })),
      aristas: [
        { de: 1, a: 2, peso: 4 }, { de: 2, a: 1, peso: 2 }, { de: 2, a: 3, peso: 3 },
        { de: 1, a: 3, peso: 7 }, { de: 3, a: 4, peso: 5 }, { de: 4, a: 4, peso: 1 }
      ],
      sigId: 5
    };
  }

  function validar(g) {
    if (!g || !Array.isArray(g.nodos) || !Array.isArray(g.aristas)) return null;
    const nodos = [], ids = new Set(), nombres = new Set();
    g.nodos.slice(0, MAXN).forEach((n, i) => {
      const id = Number(n && n.id);
      if (!Number.isFinite(id) || ids.has(id)) return;
      const base = String(n.nombre ?? '').trim().slice(0, 12) || U.letra(i);
      let k = base, c = 2;
      while (nombres.has(k)) k = base + c++;
      ids.add(id);
      nombres.add(k);
      nodos.push({ id, nombre: k, x: Number(n.x) || 0, y: Number(n.y) || 0 });
    });
    const vistos = new Set(), aristas = [];
    g.aristas.forEach(a => {
      if (!a) return;
      const de = Number(a.de), b = Number(a.a), w = Number(a.peso);
      if (!ids.has(de) || !ids.has(b) || !Number.isFinite(w)) return;
      const k = clave(de, b);
      if (vistos.has(k)) return;
      vistos.add(k);
      aristas.push({ de, a: b, peso: w });
    });
    const sinPos = nodos.length > 0 && nodos.every(n => !n.x && !n.y);
    return { g: { nodos, aristas, sigId: Math.max(0, ...nodos.map(n => n.id)) + 1 }, sinPos };
  }

  function guardarLocal() {
    try {
      localStorage.setItem('grafolab.grafo', JSON.stringify({
        nodos: G.nodos.map(n => ({ id: n.id, nombre: n.nombre, x: r1(n.x), y: r1(n.y) })),
        aristas: G.aristas,
        sigId: G.sigId
      }));
    } catch (e) {}
  }

  function medir() {
    const r = lienzo.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return false;
    tam = { w: r.width, h: r.height };
    return true;
  }

  function mostrar() {
    if (!medir()) return;
    if (pendiente) {
      organizar(pendiente.tipo, pendiente.particion);
      pendiente = null;
      guardarLocal();
    }
    dibujarLienzo();
  }

  function normalizar() {
    if (!G.nodos.length) return;
    const dx = Math.max(0, ...G.nodos.map(n => R + 12 - n.x));
    const dy = Math.max(0, ...G.nodos.map(n => minY(n.id) - n.y));
    G.nodos.forEach(n => { n.x += dx; n.y += dy; });
  }

  function cambio(estructura = true) {
    if (estructura) resaltado = null;
    dibujarLienzo();
    dibujarPaneles();
    guardarLocal();
  }

  function ayuda(texto) {
    $('#g-ayuda').innerHTML = `<span class="material-symbols-rounded">info</span><span>${U.esc(texto || ayudas[herramienta])}</span>`;
  }

  function elegir(h) {
    herramienta = h;
    origen = null;
    document.querySelectorAll('#g-herramientas .herr').forEach(b => b.classList.toggle('activo', b.dataset.herr === h));
    lienzo.dataset.herr = h;
    ayuda();
    dibujarLienzo();
  }

  function punto(e) {
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  function cardinalidades() {
    const m = new Map(G.nodos.map(n => [n.id, { e: 0, s: 0, b: 0 }]));
    G.aristas.forEach(a => {
      const o = m.get(a.de), d = m.get(a.a);
      if (!o || !d) return;
      o.s++;
      d.e++;
      if (a.de === a.a) o.b++;
    });
    return m;
  }

  function ajustarVista() {
    const abajo = (verCard ? 18 : 0) + (resaltado && resaltado.etiquetas ? 20 : 0) + R + 16;
    let w = tam.w, h = tam.h;
    G.nodos.forEach(n => {
      w = Math.max(w, n.x + R + 30);
      h = Math.max(h, n.y + abajo);
    });
    vb = { w, h };
    svg.setAttribute('viewBox', `0 0 ${r1(w)} ${r1(h)}`);
  }

  function geometria(A, B, bucle, doble) {
    if (bucle) {
      const s = 0.62;
      const x0 = A.x - R * Math.sin(s), y0 = A.y - R * Math.cos(s);
      const x3 = A.x + (R + 2) * Math.sin(s), y3 = A.y - (R + 2) * Math.cos(s);
      const c1x = A.x - 46, c2x = A.x + 46, cy = A.y - R - 64;
      return {
        d: `M${r1(x0)} ${r1(y0)} C${r1(c1x)} ${r1(cy)} ${r1(c2x)} ${r1(cy)} ${r1(x3)} ${r1(y3)}`,
        lx: A.x,
        ly: (y0 + 6 * cy + y3) / 8
      };
    }
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
    const off = doble ? Math.min(42, L * 0.28) : 0;
    const cx = (A.x + B.x) / 2 - dy / L * off;
    const cy = (A.y + B.y) / 2 + dx / L * off;
    const u = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    const [ax, ay] = u(cx - A.x, cy - A.y);
    const [bx, by] = u(cx - B.x, cy - B.y);
    const sx = A.x + ax * R, sy = A.y + ay * R;
    const ex = B.x + bx * (R + 2), ey = B.y + by * (R + 2);
    return {
      d: `M${r1(sx)} ${r1(sy)} Q${r1(cx)} ${r1(cy)} ${r1(ex)} ${r1(ey)}`,
      lx: 0.25 * sx + 0.5 * cx + 0.25 * ex,
      ly: 0.25 * sy + 0.5 * cy + 0.25 * ey
    };
  }

  function dibujarLienzo() {
    if (!svg) return;
    ajustarVista();
    $('#g-quitar').hidden = !resaltado;
    const porId = new Map(G.nodos.map(n => [n.id, n]));
    const grados = cardinalidades();
    const hay = !!resaltado;
    let h = '', etiquetas = '';

    if (!G.nodos.length) {
      h += `<text x="${r1(vb.w / 2)}" y="${r1(vb.h / 2)}" text-anchor="middle" font-family="${FUENTE}" font-size="15" fill="#9a9a9a">Elige «Nodo» y toca el lienzo para empezar</text>`;
    }

    G.aristas.forEach(a => {
      const A = porId.get(a.de), B = porId.get(a.a);
      if (!A || !B) return;
      const k = clave(a.de, a.a);
      const on = hay && resaltado.aristas.has(k);
      const color = hay ? (on ? '#000000' : '#c4c4c4') : '#2b2b2b';
      const marca = hay ? (on ? 'g-flecha-negra' : 'g-flecha-gris') : 'g-flecha';
      const geo = geometria(A, B, a.de === a.a, a.de !== a.a && G.aristas.some(x => x.de === a.a && x.a === a.de));
      h += `<g data-arista="${k}" class="arista"><path d="${geo.d}" fill="none" stroke="transparent" stroke-width="18"/><path d="${geo.d}" fill="none" stroke="${color}" stroke-width="${on ? 3.5 : 2}" stroke-linecap="round" marker-end="url(#${marca})"/></g>`;
      const txt = F(a.peso);
      const w = 16 + txt.length * 7.4;
      etiquetas += `<g data-arista="${k}" class="arista"><rect x="${r1(geo.lx - w / 2)}" y="${r1(geo.ly - 11)}" width="${r1(w)}" height="22" rx="11" fill="${on ? '#000000' : '#ffffff'}" stroke="${on ? '#000000' : '#d6d6d6'}" stroke-width="1.2"/><text pointer-events="none" x="${r1(geo.lx)}" y="${r1(geo.ly + 4.5)}" text-anchor="middle" font-family="${FUENTE}" font-size="12.5" font-weight="600" fill="${on ? '#ffffff' : (hay ? '#8a8a8a' : '#111111')}">${U.esc(txt)}</text></g>`;
    });

    G.nodos.forEach(n => {
      const sel = origen === n.id;
      const nombre = n.nombre.length > 5 ? n.nombre.slice(0, 4) + '…' : n.nombre;
      const fs = nombre.length > 3 ? 12 : 15;
      h += `<g data-nodo="${n.id}" class="nodo"><circle cx="${r1(n.x)}" cy="${r1(n.y)}" r="${R}" fill="${sel ? '#111111' : '#ffffff'}" stroke="#111111" stroke-width="2" filter="url(#g-sombra)"/><text pointer-events="none" x="${r1(n.x)}" y="${r1(n.y + fs * 0.35)}" text-anchor="middle" font-family="${FUENTE}" font-size="${fs}" font-weight="700" fill="${sel ? '#ffffff' : '#111111'}">${U.esc(nombre)}</text>`;
      let y = n.y + R + 16;
      if (verCard) {
        const g = grados.get(n.id);
        h += `<text x="${r1(n.x)}" y="${r1(y)}" text-anchor="middle" font-family="${FUENTE}" font-size="11" font-weight="600" fill="#6b6b6b">E${g.e} · S${g.s}</text>`;
        y += 18;
      }
      if (hay && resaltado.etiquetas && resaltado.etiquetas[n.id] != null) {
        const t = resaltado.etiquetas[n.id];
        const w = 14 + t.length * 6.6;
        h += `<rect x="${r1(n.x - w / 2)}" y="${r1(y - 12)}" width="${r1(w)}" height="18" rx="9" fill="#111111"/><text x="${r1(n.x)}" y="${r1(y + 1)}" text-anchor="middle" font-family="${FUENTE}" font-size="11" font-weight="600" fill="#ffffff">${U.esc(t)}</text>`;
      }
      h += '</g>';
    });

    capa.innerHTML = h + etiquetas;
  }

  function matrizPesos() {
    const idx = new Map(G.nodos.map((n, i) => [n.id, i]));
    const M = G.nodos.map(() => G.nodos.map(() => null));
    G.aristas.forEach(a => {
      if (idx.has(a.de) && idx.has(a.a)) M[idx.get(a.de)][idx.get(a.a)] = a.peso;
    });
    return M;
  }

  function dibujarMatriz() {
    const t = $('#g-matriz');
    const bin = modoMatriz === 'binaria';
    document.querySelectorAll('#g-modo-matriz button').forEach(b => b.classList.toggle('activo', b.dataset.valor === modoMatriz));
    $('#g-aplicar').hidden = bin || !G.nodos.length;
    if (!G.nodos.length) {
      t.innerHTML = '<tbody><tr><td class="vacio">Todavía no hay nodos</td></tr></tbody>';
      return;
    }
    const M = matrizPesos();
    const suma = l => l.reduce((s, v) => s + v, 0);
    let h = '<thead><tr><th class="esquina">de → a</th>';
    G.nodos.forEach(x => { h += `<th><span class="etq-chip">${U.esc(x.nombre)}</span></th>`; });
    h += (bin ? '' : '<th class="extra">Σ</th>') + '<th class="extra">Salidas</th></tr></thead><tbody>';
    M.forEach((fila, i) => {
      h += `<tr><th><span class="etq-chip">${U.esc(G.nodos[i].nombre)}</span></th>`;
      fila.forEach((v, j) => {
        h += bin
          ? `<td class="bin ${v !== null ? 'uno' : ''}">${v !== null ? 1 : 0}</td>`
          : `<td><input class="celda" data-i="${i}" data-j="${j}" value="${v === null ? '' : F(v)}" inputmode="decimal" autocomplete="off" aria-label="${U.esc(G.nodos[i].nombre)} a ${U.esc(G.nodos[j].nombre)}"></td>`;
      });
      const vals = fila.filter(v => v !== null);
      h += (bin ? '' : `<td class="extra">${F(suma(vals))}</td>`) + `<td class="extra">${vals.length}</td></tr>`;
    });
    const cols = G.nodos.map((_, j) => M.map(r => r[j]).filter(v => v !== null));
    if (!bin) {
      h += `<tr><th class="extra">Σ</th>${cols.map(c => `<td class="extra">${F(suma(c))}</td>`).join('')}<td class="extra total">${F(suma(G.aristas.map(a => a.peso)))}</td><td></td></tr>`;
    }
    h += `<tr><th class="extra">Entradas</th>${cols.map(c => `<td class="extra">${c.length}</td>`).join('')}${bin ? '' : '<td></td>'}<td class="extra total">${G.aristas.length}</td></tr>`;
    t.innerHTML = h + '</tbody>';
  }

  function dibujarCardinalidad() {
    const t = $('#g-cardinalidad');
    const c = cardinalidades();
    if (!G.nodos.length) {
      t.innerHTML = '<tbody><tr><td class="vacio">Todavía no hay nodos</td></tr></tbody>';
      $('#g-resumen').innerHTML = '';
      return;
    }
    t.innerHTML = '<thead><tr><th>Nodo</th><th>Entradas</th><th>Salidas</th><th>Bucle</th><th>Grado</th></tr></thead><tbody>' +
      G.nodos.map(n => {
        const g = c.get(n.id);
        return `<tr><td><span class="etq-chip">${U.esc(n.nombre)}</span></td><td>${g.e}</td><td>${g.s}</td><td>${g.b ? 'Sí' : '—'}</td><td>${g.e + g.s}</td></tr>`;
      }).join('') + '</tbody>';
    const bucles = G.aristas.filter(a => a.de === a.a).length;
    const pares = G.aristas.filter(a => a.de < a.a && G.aristas.some(b => b.de === a.a && b.a === a.de)).length;
    $('#g-resumen').innerHTML = [
      `${G.nodos.length} nodos`, `${G.aristas.length} conexiones`, `${bucles} bucles`, `${pares} pares de ida y vuelta`
    ].map(x => `<span class="chip">${x}</span>`).join('');
  }

  function dibujarPaneles() {
    dibujarMatriz();
    dibujarCardinalidad();
  }

  function ordenTopologico() {
    const ent = new Map(G.nodos.map(n => [n.id, 0]));
    G.aristas.forEach(a => ent.set(a.a, ent.get(a.a) + 1));
    const cola = G.nodos.filter(n => !ent.get(n.id)).map(n => n.id);
    const res = [];
    while (cola.length) {
      const id = cola.shift();
      res.push(id);
      G.aristas.filter(a => a.de === id).forEach(a => {
        ent.set(a.a, ent.get(a.a) - 1);
        if (!ent.get(a.a)) cola.push(a.a);
      });
    }
    return res;
  }

  const esDAG = () => G.aristas.length > 0 && ordenTopologico().length === G.nodos.length;

  function espaciar(i, k, h) {
    if (k === 1) return h / 2;
    const sup = 90, inf = h - 70;
    const paso = Math.max(88, (inf - sup) / (k - 1));
    const total = paso * (k - 1);
    const inicio = total < inf - sup ? (h - total) / 2 : sup;
    return inicio + i * paso;
  }

  function organizar(tipo, particion) {
    const n = G.nodos.length;
    if (!n) return;
    const w = tam.w, h = tam.h;
    if (!tipo) tipo = esDAG() ? 'capas' : 'circulo';
    if (tipo === 'capas' && !esDAG()) tipo = 'circulo';
    if (tipo === 'bipartito') {
      const izq = G.nodos.slice(0, particion), der = G.nodos.slice(particion);
      const xi = Math.max(R + 40, w * 0.2), xd = Math.max(xi + 150, w * 0.8);
      izq.forEach((nd, i) => { nd.x = xi; nd.y = espaciar(i, izq.length, h); });
      der.forEach((nd, i) => { nd.x = xd; nd.y = espaciar(i, der.length, h); });
    } else if (tipo === 'capas') {
      const nivel = new Map(G.nodos.map(nd => [nd.id, 0]));
      ordenTopologico().forEach(id => {
        G.aristas.filter(a => a.de === id).forEach(a => nivel.set(a.a, Math.max(nivel.get(a.a), nivel.get(id) + 1)));
      });
      const maxN = Math.max(...nivel.values());
      const grupos = [];
      G.nodos.forEach(nd => { const l = nivel.get(nd.id); (grupos[l] = grupos[l] || []).push(nd); });
      const margen = 70;
      if (w < 600) {
        const paso = maxN ? Math.max(112, (h - 2 * margen) / maxN) : 0;
        grupos.forEach((g, l) => g.forEach((nd, i) => {
          nd.y = maxN ? margen + 20 + l * paso : h / 2;
          nd.x = g.length === 1 ? w / 2 : 50 + i * Math.max(80, (w - 100) / (g.length - 1)) + (l % 2 ? 16 : 0);
        }));
      } else {
        const paso = maxN ? Math.max(120, (w - 2 * margen) / maxN) : 0;
        grupos.forEach((g, l) => g.forEach((nd, i) => {
          nd.x = maxN ? margen + l * paso : w / 2;
          nd.y = espaciar(i, g.length, h) + (g.length > 1 && l % 2 ? 22 : 0);
        }));
      }
    } else {
      const cx = w / 2, cy = h / 2 + 12;
      const rad = n === 1 ? 0 : Math.max(80, Math.min(w, h) / 2 - 82, n * 20);
      G.nodos.forEach((nd, i) => {
        const ang = -Math.PI / 2 + 2 * Math.PI * i / n;
        nd.x = cx + rad * Math.cos(ang);
        nd.y = cy + rad * Math.sin(ang);
      });
    }
    normalizar();
  }

  function abajo(e) {
    if (e.button !== undefined && e.button > 0) return;
    const el = e.target.closest('[data-nodo],[data-arista]');
    toque = {
      id: el && el.dataset.nodo ? Number(el.dataset.nodo) : null,
      arista: el && el.dataset.arista ? el.dataset.arista : null,
      cx: e.clientX,
      cy: e.clientY,
      movido: false
    };
    if (toque.id !== null) {
      const n = nodo(toque.id), p = punto(e);
      toque.dx = n.x - p.x;
      toque.dy = n.y - p.y;
      toque.limX = Math.max(tam.w - R - 30, n.x);
      toque.limY = Math.max(tam.h - R - 50, n.y);
    }
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function mover(e) {
    if (!toque || toque.id === null) return;
    if (!toque.movido && Math.hypot(e.clientX - toque.cx, e.clientY - toque.cy) < 6) return;
    toque.movido = true;
    const p = punto(e), n = nodo(toque.id);
    n.x = limitar(p.x + toque.dx, R + 10, toque.limX);
    n.y = limitar(p.y + toque.dy, minY(n.id), toque.limY);
    dibujarLienzo();
  }

  function arriba(e) {
    if (!toque) return;
    const t = toque;
    toque = null;
    if (t.movido) { guardarLocal(); return; }
    accion(t, punto(e));
  }

  async function accion(t, p) {
    if (herramienta === 'nodo') {
      if (t.id === null && t.arista === null) crearNodo(p);
      return;
    }
    if (herramienta === 'conectar') {
      if (t.id !== null) await conectar(t.id);
      else if (origen !== null) { origen = null; ayuda(); dibujarLienzo(); }
      return;
    }
    if (herramienta === 'editar') {
      if (t.id !== null) await editarNodo(t.id);
      else if (t.arista) await editarArista(t.arista);
      return;
    }
    if (herramienta === 'borrar') {
      if (t.id !== null) borrarNodo(t.id);
      else if (t.arista) borrarArista(t.arista);
    }
  }

  function crearNodo(p) {
    if (G.nodos.length >= MAXN) return U.aviso(`Máximo ${MAXN} nodos`);
    const usados = new Set(G.nodos.map(n => n.nombre));
    let k = 0;
    while (usados.has(U.letra(k))) k++;
    G.nodos.push({
      id: G.sigId++,
      nombre: U.letra(k),
      x: limitar(p.x, R + 10, vb.w - R - 10),
      y: limitar(p.y, R + 10, vb.h - R - 34)
    });
    cambio();
  }

  async function conectar(id) {
    if (origen === null) {
      origen = id;
      ayuda(`Origen: ${nodo(id).nombre}. Ahora toca el nodo destino (o el mismo nodo para un bucle).`);
      dibujarLienzo();
      return;
    }
    const de = origen, a = id;
    origen = null;
    ayuda();
    dibujarLienzo();
    const A = nodo(de), B = nodo(a);
    const existente = G.aristas.find(x => x.de === de && x.a === a);
    const inversa = de !== a && G.aristas.find(x => x.de === a && x.a === de);
    const campos = [{ id: 'peso', etiqueta: 'Peso', tipo: 'number', valor: existente ? F(existente.peso) : '1' }];
    if (de !== a && !inversa && !existente) {
      campos.push({ id: 'doble', etiqueta: `Crear también ${B.nombre} → ${A.nombre} (ida y vuelta)`, tipo: 'checkbox', valor: false });
    }
    let texto = '';
    if (existente) texto = 'Esta conexión ya existe. Entre dos nodos solo hay una conexión en cada sentido; puedes cambiar su peso.';
    else if (inversa) texto = `Ya existe ${B.nombre} → ${A.nombre}. Esta será la segunda y última conexión entre estos nodos.`;
    else if (de === a) texto = 'El nodo se conectará consigo mismo.';
    const r = await U.dialogo({
      titulo: de === a ? `Bucle en ${A.nombre}` : `${A.nombre} → ${B.nombre}`,
      texto, campos,
      aceptar: existente ? 'Actualizar' : 'Conectar'
    });
    if (!r) return;
    const w = U.num(r.peso);
    if (w === null || Number.isNaN(w)) return U.aviso('El peso debe ser un número');
    if (existente) existente.peso = w;
    else G.aristas.push({ de, a, peso: w });
    if (r.doble) G.aristas.push({ de: a, a: de, peso: w });
    if (de === a) A.y = Math.max(A.y, minY(A.id));
    cambio();
  }

  async function editarNodo(id) {
    const n = nodo(id);
    const r = await U.dialogo({ titulo: 'Editar nodo', campos: [{ id: 'nombre', etiqueta: 'Nombre', valor: n.nombre }], aceptar: 'Guardar' });
    if (!r) return;
    const nombre = r.nombre.trim().slice(0, 12);
    if (!nombre) return U.aviso('El nombre no puede estar vacío');
    if (G.nodos.some(x => x.id !== id && x.nombre === nombre)) return U.aviso('Ya existe un nodo con ese nombre');
    n.nombre = nombre;
    cambio(false);
  }

  async function editarArista(k) {
    const [de, a] = k.split('>').map(Number);
    const ar = G.aristas.find(x => x.de === de && x.a === a);
    if (!ar) return;
    const r = await U.dialogo({
      titulo: de === a ? `Bucle en ${nodo(de).nombre}` : `${nodo(de).nombre} → ${nodo(a).nombre}`,
      campos: [{ id: 'peso', etiqueta: 'Peso', tipo: 'number', valor: F(ar.peso) }],
      aceptar: 'Guardar'
    });
    if (!r) return;
    const w = U.num(r.peso);
    if (w === null || Number.isNaN(w)) return U.aviso('El peso debe ser un número');
    ar.peso = w;
    cambio();
  }

  function borrarNodo(id) {
    G.nodos = G.nodos.filter(n => n.id !== id);
    G.aristas = G.aristas.filter(a => a.de !== id && a.a !== id);
    cambio();
  }

  function borrarArista(k) {
    const [de, a] = k.split('>').map(Number);
    G.aristas = G.aristas.filter(x => !(x.de === de && x.a === a));
    cambio();
  }

  async function limpiar() {
    if (!G.nodos.length) return;
    const r = await U.dialogo({ titulo: 'Limpiar lienzo', texto: 'Se eliminarán todos los nodos y conexiones del grafo.', aceptar: 'Limpiar' });
    if (!r) return;
    G = { nodos: [], aristas: [], sigId: 1 };
    origen = null;
    cambio();
  }

  function aplicarMatriz() {
    const nuevas = [];
    let malo = false;
    $('#g-matriz').querySelectorAll('input.celda').forEach(inp => {
      const v = U.num(inp.value);
      if (v === null) return;
      if (Number.isNaN(v)) { malo = true; return; }
      nuevas.push({ de: G.nodos[+inp.dataset.i].id, a: G.nodos[+inp.dataset.j].id, peso: v });
    });
    if (malo) return U.aviso('Hay celdas con valores que no son números');
    G.aristas = nuevas;
    G.nodos.forEach(n => { n.y = Math.max(n.y, minY(n.id)); });
    cambio();
    U.aviso('Matriz aplicada al grafo');
  }

  async function nuevoDesdeMatriz() {
    const r = await U.dialogo({
      titulo: 'Nuevo grafo desde matriz',
      texto: 'Se creará un grafo sin conexiones con la cantidad de nodos que indiques. Luego llena su matriz de adyacencia y presiona «Aplicar matriz al grafo».',
      campos: [{ id: 'n', etiqueta: 'Cantidad de nodos', tipo: 'number', valor: '4' }],
      aceptar: 'Crear'
    });
    if (!r) return;
    const n = Math.round(U.num(r.n));
    if (!(n >= 1 && n <= MAXN)) return U.aviso(`Elige entre 1 y ${MAXN} nodos`);
    G = { nodos: Array.from({ length: n }, (_, i) => ({ id: i + 1, nombre: U.letra(i), x: 0, y: 0 })), aristas: [], sigId: n + 1 };
    origen = null;
    modoMatriz = 'pesos';
    medir();
    organizar('circulo');
    cambio();
    $('#g-tarjeta-matriz').scrollIntoView({ behavior: 'smooth', block: 'start' });
    const primera = $('#g-matriz input.celda');
    if (primera) setTimeout(() => primera.focus({ preventScroll: true }), 400);
  }

  async function aMatriz() {
    if (!G.nodos.length) return U.aviso('El grafo no tiene nodos');
    const r = await U.dialogo({
      titulo: 'Enviar a Matrices',
      texto: 'Elige con qué algoritmo quieres trabajar la matriz de este grafo.',
      campos: [{
        id: 'alg', etiqueta: 'Algoritmo', tipo: 'select', valor: esDAG() ? 'johnson' : 'asignacion',
        opciones: [{ valor: 'johnson', texto: 'Johnson (ruta crítica)' }, { valor: 'asignacion', texto: 'Asignación (método húngaro)' }]
      }],
      aceptar: 'Enviar'
    });
    if (!r) return;
    const nombres = G.nodos.map(n => n.nombre);
    let datos = null;
    if (r.alg === 'asignacion') {
      const c = cardinalidades();
      const org = G.nodos.filter(n => c.get(n.id).s > 0 && c.get(n.id).e === 0);
      const des = G.nodos.filter(n => c.get(n.id).e > 0 && c.get(n.id).s === 0);
      const mp = new Map(G.aristas.map(a => [clave(a.de, a.a), a.peso]));
      const celda = (o, d) => mp.has(clave(o.id, d.id)) ? F(mp.get(clave(o.id, d.id))) : 'M';
      if (org.length && des.length && org.length + des.length === G.nodos.length) {
        datos = { algoritmo: 'asignacion', filas: org.map(n => n.nombre), columnas: des.map(n => n.nombre), valores: org.map(o => des.map(d => celda(o, d))) };
      } else {
        datos = { algoritmo: 'asignacion', filas: nombres, columnas: nombres.slice(), valores: G.nodos.map(o => G.nodos.map(d => celda(o, d))) };
      }
    } else {
      datos = { algoritmo: 'johnson', filas: nombres, columnas: nombres.slice(), valores: matrizPesos().map(f => f.map(v => v === null ? '' : F(v))) };
    }
    App.ir('matrices');
    if (Matrices.cargar(datos)) U.aviso('Matriz cargada en el modo Matrices');
  }

  function desdeMatriz(d) {
    const usados = new Set();
    const nombres = d.nombres.slice(0, MAXN).map((x, i) => {
      const base = String(x).trim().slice(0, 12) || U.letra(i);
      let k = base, c = 2;
      while (usados.has(k)) k = base + c++;
      usados.add(k);
      return k;
    });
    const n = nombres.length;
    G = {
      nodos: nombres.map((nombre, i) => ({ id: i + 1, nombre, x: 0, y: 0 })),
      aristas: d.aristas.filter(a => a.de < n && a.a < n).map(a => ({ de: a.de + 1, a: a.a + 1, peso: a.peso })),
      sigId: n + 1
    };
    origen = null;
    resaltado = d.resaltado ? {
      aristas: new Set(d.resaltado.aristas.map(([i, j]) => clave(i + 1, j + 1))),
      etiquetas: d.resaltado.etiquetas ? Object.fromEntries(d.resaltado.etiquetas.map((t, i) => [i + 1, t])) : null
    } : null;
    if (medir()) organizar(d.distribucion, d.particion);
    else pendiente = { tipo: d.distribucion, particion: d.particion };
    dibujarLienzo();
    dibujarPaneles();
    guardarLocal();
    U.aviso(resaltado ? 'Grafo generado con la solución resaltada' : 'Grafo generado desde la matriz');
  }

  function cargar(g) {
    const v = validar(g);
    if (!v) { U.aviso('El archivo no contiene un grafo válido'); return false; }
    G = v.g;
    resaltado = null;
    origen = null;
    if (v.sinPos) {
      if (medir()) organizar();
      else pendiente = { tipo: null };
    } else normalizar();
    dibujarLienzo();
    dibujarPaneles();
    guardarLocal();
    return true;
  }

  async function guardarArchivo() {
    const r = await U.dialogo({
      titulo: 'Guardar grafo',
      texto: 'Se descargará un archivo .json que luego puedes abrir con el botón «Abrir».',
      campos: [{ id: 'nombre', etiqueta: 'Nombre del archivo', valor: 'grafo' }],
      aceptar: 'Descargar'
    });
    if (!r) return;
    U.descargarJSON(U.nombreArchivo(r.nombre, 'grafo') + '.json', {
      app: 'GrafoLab', version: 1, tipo: 'grafo',
      grafo: {
        nodos: G.nodos.map(n => ({ id: n.id, nombre: n.nombre, x: r1(n.x), y: r1(n.y) })),
        aristas: G.aristas.map(a => ({ de: a.de, a: a.a, peso: a.peso }))
      }
    });
  }

  async function exportarPNG() {
    if (!G.nodos.length) return U.aviso('El grafo está vacío');
    const r = await U.dialogo({ titulo: 'Exportar imagen', campos: [{ id: 'nombre', etiqueta: 'Nombre del archivo', valor: 'grafo' }], aceptar: 'Descargar' });
    if (!r) return;
    origen = null;
    dibujarLienzo();
    const clon = svg.cloneNode(true);
    clon.setAttribute('xmlns', NS);
    clon.setAttribute('width', r1(vb.w));
    clon.setAttribute('height', r1(vb.h));
    clon.removeAttribute('id');
    const fondo = document.createElementNS(NS, 'rect');
    fondo.setAttribute('width', r1(vb.w));
    fondo.setAttribute('height', r1(vb.h));
    fondo.setAttribute('fill', '#ffffff');
    clon.insertBefore(fondo, clon.querySelector('#g-capa'));
    clon.querySelectorAll('path[stroke="transparent"]').forEach(p => p.remove());
    const datos = new XMLSerializer().serializeToString(clon);
    const img = new Image();
    img.onload = () => {
      const esc = 2;
      const c = document.createElement('canvas');
      c.width = Math.round(vb.w * esc);
      c.height = Math.round(vb.h * esc);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => {
        if (b) U.descargarBlob(U.nombreArchivo(r.nombre, 'grafo') + '.png', b);
        else U.aviso('No se pudo generar la imagen');
      }, 'image/png');
    };
    img.onerror = () => U.aviso('No se pudo generar la imagen');
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(datos);
  }

  function init() {
    svg = $('#g-svg');
    capa = $('#g-capa');
    lienzo = $('#g-lienzo');

    let guardado = null;
    try { guardado = JSON.parse(localStorage.getItem('grafolab.grafo')); } catch (e) {}
    const v = validar(guardado);
    if (v) {
      G = v.g;
      if (v.sinPos) pendiente = { tipo: null };
    } else {
      G = ejemplo();
      pendiente = { tipo: null };
    }

    $('#g-herramientas').addEventListener('click', e => {
      const b = e.target.closest('[data-herr]');
      if (b) elegir(b.dataset.herr);
    });
    svg.addEventListener('pointerdown', abajo);
    svg.addEventListener('pointermove', mover);
    svg.addEventListener('pointerup', arriba);
    svg.addEventListener('pointercancel', () => { toque = null; });

    $('#g-organizar').addEventListener('click', () => { medir(); organizar(); cambio(false); });
    $('#g-limpiar').addEventListener('click', limpiar);
    $('#g-quitar').addEventListener('click', () => { resaltado = null; dibujarLienzo(); });
    $('#g-card').addEventListener('change', e => { verCard = e.target.checked; dibujarLienzo(); });
    $('#g-a-matriz').addEventListener('click', aMatriz);
    $('#g-png').addEventListener('click', exportarPNG);
    $('#g-guardar').addEventListener('click', guardarArchivo);
    $('#g-abrir').addEventListener('click', () => App.abrirArchivo());
    $('#g-modo-matriz').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      modoMatriz = b.dataset.valor;
      dibujarMatriz();
    });
    $('#g-aplicar').addEventListener('click', aplicarMatriz);
    $('#g-nuevo-matriz').addEventListener('click', nuevoDesdeMatriz);

    const tm = $('#g-matriz');
    tm.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || !e.target.classList.contains('celda')) return;
      e.preventDefault();
      const celdas = [...tm.querySelectorAll('.celda')];
      const sig = celdas[celdas.indexOf(e.target) + 1];
      if (sig) { sig.focus(); sig.select(); } else aplicarMatriz();
    });
    tm.addEventListener('focusin', e => { if (e.target.classList.contains('celda')) e.target.select(); });

    if (window.ResizeObserver) new ResizeObserver(() => mostrar()).observe(lienzo);
    window.addEventListener('resize', () => mostrar());

    elegir('mover');
    dibujarPaneles();
  }

  return { init, mostrar, cargar, desdeMatriz };
})();