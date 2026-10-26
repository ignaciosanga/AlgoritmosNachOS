const Editor = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const R = 24;
  const MAXN = 20;
  const FUENTE = "'Roboto Flex', Arial, sans-serif";
  const F = v => Algoritmos.fmt(v);
  const r1 = v => Math.round(v * 10) / 10;
  const limitar = (v, a, b) => Math.min(b, Math.max(a, v));
  const clave = (de, a) => de + '>' + a;
  let contador = 0;

  const herramientas = [
    ['mover', 'open_with', 'Mover'],
    ['nodo', 'add_circle', 'Nodo'],
    ['conectar', 'arrow_right_alt', 'Conectar'],
    ['editar', 'edit', 'Editar'],
    ['borrar', 'delete', 'Borrar']
  ];

  function crear(raiz, op = {}) {
    const pre = 'ed' + (++contador);
    const bucles = op.bucles !== false;
    const ayudas = {
      mover: 'Arrastra los nodos para acomodarlos.',
      nodo: 'Toca un espacio vacío del lienzo para crear un nodo.',
      conectar: bucles
        ? 'Toca el nodo de origen y luego el de destino. Si tocas el mismo nodo dos veces, se crea un bucle.'
        : 'Toca el nodo de origen y luego el de destino.',
      editar: 'Toca un nodo para cambiarle el nombre o una conexión para cambiar su peso.',
      borrar: 'Toca un nodo o una conexión para eliminarlo.',
      ...(op.ayudas || {})
    };

    let G = { nodos: [], aristas: [], sigId: 1 };
    let herramienta = 'mover';
    let origen = null;
    let resaltado = null;
    let verCard = op.cardinalidad !== false;
    let pendiente = null;
    let toque = null;
    let tam = { w: 800, h: 480 };
    let vb = { w: 800, h: 480 };

    raiz.innerHTML = `
      <div class="barra-herramientas">
        ${herramientas.map(([h, i, t]) => `<button type="button" class="herr" data-herr="${h}"><span class="material-symbols-rounded">${i}</span><span>${t}</span></button>`).join('')}
      </div>
      <p class="ayuda ed-ayuda"></p>
      <div class="lienzo">
        <svg xmlns="${NS}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Lienzo del grafo">
          <defs>
            <marker id="${pre}-f" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0.8 L10 5 L0 9.2 Z" fill="#2b2b2b"/></marker>
            <marker id="${pre}-fn" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="13" markerHeight="13" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0.8 L10 5 L0 9.2 Z" fill="#000000"/></marker>
            <marker id="${pre}-fg" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0.8 L10 5 L0 9.2 Z" fill="#c4c4c4"/></marker>
            <filter id="${pre}-s" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000000" flood-opacity="0.2"/></filter>
          </defs>
          <g class="capa"></g>
        </svg>
      </div>
      <div class="acciones">
        <button type="button" class="btn tonal" data-acc="organizar"><span class="material-symbols-rounded">auto_awesome_mosaic</span>Organizar</button>
        <button type="button" class="btn tonal" data-acc="limpiar"><span class="material-symbols-rounded">delete_sweep</span>Limpiar</button>
        <button type="button" class="btn tonal" data-acc="quitar" hidden><span class="material-symbols-rounded">format_color_reset</span>Quitar resaltado</button>
        <label class="check"><input type="checkbox" data-acc="card" ${verCard ? 'checked' : ''}><span>Mostrar entradas y salidas</span></label>
      </div>`;

    const q = s => raiz.querySelector(s);
    const svg = q('svg');
    const capa = q('.capa');
    const lienzo = q('.lienzo');
    const pAyuda = q('.ed-ayuda');
    const bQuitar = q('[data-acc=quitar]');

    const nodo = id => G.nodos.find(n => n.id === id);
    const tieneBucle = id => G.aristas.some(a => a.de === id && a.a === id);
    const minY = id => tieneBucle(id) ? R + 70 : R + 10;

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
        if (!bucles && de === b) return;
        const k = clave(de, b);
        if (vistos.has(k)) return;
        vistos.add(k);
        aristas.push({ de, a: b, peso: w });
      });
      const sinPos = nodos.length > 0 && nodos.every(n => !n.x && !n.y);
      return { g: { nodos, aristas, sigId: Math.max(0, ...nodos.map(n => n.id)) + 1 }, sinPos };
    }

    function guardarLocal() {
      if (!op.clave) return;
      try {
        localStorage.setItem(op.clave, JSON.stringify({
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
      dibujar();
    }

    function normalizar() {
      if (!G.nodos.length) return;
      const dx = Math.max(0, ...G.nodos.map(n => R + 12 - n.x));
      const dy = Math.max(0, ...G.nodos.map(n => minY(n.id) - n.y));
      G.nodos.forEach(n => { n.x += dx; n.y += dy; });
    }

    function avisar() {
      if (op.alCambiar) op.alCambiar();
    }

    function cambio(estructura = true) {
      if (estructura) resaltado = null;
      dibujar();
      guardarLocal();
      avisar();
    }

    function ayuda(texto) {
      pAyuda.innerHTML = `<span class="material-symbols-rounded">info</span><span>${U.esc(texto || ayudas[herramienta])}</span>`;
    }

    function elegir(h) {
      herramienta = h;
      origen = null;
      raiz.querySelectorAll('.herr').forEach(b => b.classList.toggle('activo', b.dataset.herr === h));
      lienzo.dataset.herr = h;
      ayuda();
      dibujar();
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
        en: t => [
          (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * ex,
          (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ey
        ]
      };
    }

    function dibujar() {
      ajustarVista();
      bQuitar.hidden = !resaltado;
      const porId = new Map(G.nodos.map(n => [n.id, n]));
      const grados = cardinalidades();
      const hay = !!resaltado;
      let h = '', etiquetas = '';

      if (!G.nodos.length) {
        h += `<text x="${r1(vb.w / 2)}" y="${r1(vb.h / 2)}" text-anchor="middle" font-family="${FUENTE}" font-size="15" fill="#9a9a9a">${U.esc(op.textoVacio || 'Elige «Nodo» y toca el lienzo para empezar')}</text>`;
      }

      const puestas = [];
      const libre = (x, y, w) => puestas.every(q => Math.abs(q.x - x) > (q.w + w) / 2 + 4 || Math.abs(q.y - y) > 25);
      G.aristas.forEach(a => {
        const A = porId.get(a.de), B = porId.get(a.a);
        if (!A || !B) return;
        const k = clave(a.de, a.a);
        const on = hay && resaltado.aristas.has(k);
        const color = hay ? (on ? '#000000' : '#c4c4c4') : '#2b2b2b';
        const marca = hay ? (on ? `${pre}-fn` : `${pre}-fg`) : `${pre}-f`;
        const geo = geometria(A, B, a.de === a.a, a.de !== a.a && G.aristas.some(x => x.de === a.a && x.a === a.de));
        h += `<g data-arista="${k}" class="arista"><path d="${geo.d}" fill="none" stroke="transparent" stroke-width="18"/><path d="${geo.d}" fill="none" stroke="${color}" stroke-width="${on ? 3.5 : 2}" stroke-linecap="round" marker-end="url(#${marca})"/></g>`;
        const txt = F(a.peso);
        const w = 16 + txt.length * 7.4;
        if (geo.en) {
          const opciones = [0.5, 0.36, 0.64, 0.27, 0.73, 0.43, 0.57, 0.2, 0.8];
          const t = opciones.find(t => { const [x, y] = geo.en(t); return libre(x, y, w); }) ?? 0.5;
          [geo.lx, geo.ly] = geo.en(t);
        }
        puestas.push({ x: geo.lx, y: geo.ly, w });
        etiquetas += `<g data-arista="${k}" class="arista"><rect x="${r1(geo.lx - w / 2)}" y="${r1(geo.ly - 11)}" width="${r1(w)}" height="22" rx="11" fill="${on ? '#000000' : '#ffffff'}" stroke="${on ? '#000000' : '#d6d6d6'}" stroke-width="1.2"/><text pointer-events="none" x="${r1(geo.lx)}" y="${r1(geo.ly + 4.5)}" text-anchor="middle" font-family="${FUENTE}" font-size="12.5" font-weight="600" fill="${on ? '#ffffff' : (hay ? '#8a8a8a' : '#111111')}">${U.esc(txt)}</text></g>`;
      });

      G.nodos.forEach(n => {
        const sel = origen === n.id;
        const nombre = n.nombre.length > 5 ? n.nombre.slice(0, 4) + '…' : n.nombre;
        const fs = nombre.length > 3 ? 12 : 15;
        h += `<g data-nodo="${n.id}" class="nodo"><title>${U.esc(n.nombre)}</title><circle cx="${r1(n.x)}" cy="${r1(n.y)}" r="${R}" fill="${sel ? '#111111' : '#ffffff'}" stroke="#111111" stroke-width="2" filter="url(#${pre}-s)"/><text pointer-events="none" x="${r1(n.x)}" y="${r1(n.y + fs * 0.35)}" text-anchor="middle" font-family="${FUENTE}" font-size="${fs}" font-weight="700" fill="${sel ? '#ffffff' : '#111111'}">${U.esc(nombre)}</text>`;
        let y = n.y + R + 16;
        if (verCard) {
          const g = grados.get(n.id);
          h += `<text pointer-events="none" x="${r1(n.x)}" y="${r1(y)}" text-anchor="middle" font-family="${FUENTE}" font-size="11" font-weight="600" fill="#6b6b6b">E${g.e} · S${g.s}</text>`;
          y += 18;
        }
        if (hay && resaltado.etiquetas && resaltado.etiquetas[n.id] != null) {
          const t = resaltado.etiquetas[n.id];
          const w = 14 + t.length * 6.6;
          h += `<rect x="${r1(n.x - w / 2)}" y="${r1(y - 12)}" width="${r1(w)}" height="18" rx="9" fill="#111111"/><text pointer-events="none" x="${r1(n.x)}" y="${r1(y + 1)}" text-anchor="middle" font-family="${FUENTE}" font-size="11" font-weight="600" fill="#ffffff">${U.esc(t)}</text>`;
        }
        h += '</g>';
      });

      capa.innerHTML = h + etiquetas;
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
      dibujar();
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
        else if (origen !== null) { origen = null; ayuda(); dibujar(); }
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
      const nombrar = op.nombrar || (k => U.letra(k));
      let k = 0;
      while (usados.has(nombrar(k))) k++;
      G.nodos.push({
        id: G.sigId++,
        nombre: nombrar(k),
        x: limitar(p.x, R + 10, vb.w - R - 10),
        y: limitar(p.y, R + 10, vb.h - R - 34)
      });
      cambio();
    }

    async function conectar(id) {
      if (origen === null) {
        origen = id;
        ayuda(`Origen: ${nodo(id).nombre}. Ahora toca el nodo de destino${bucles ? ' (o el mismo nodo para un bucle)' : ''}.`);
        dibujar();
        return;
      }
      const de = origen, a = id;
      origen = null;
      ayuda();
      dibujar();
      if (de === a && !bucles) {
        U.aviso(op.avisoBucle || 'Aquí no se permiten bucles');
        return;
      }
      const A = nodo(de), B = nodo(a);
      const existente = G.aristas.find(x => x.de === de && x.a === a);
      const inversa = de !== a && G.aristas.find(x => x.de === a && x.a === de);
      const campos = [{ id: 'peso', etiqueta: op.etiquetaPeso || 'Peso', tipo: 'number', valor: existente ? F(existente.peso) : '1' }];
      if (de !== a && !inversa && !existente && op.idaVuelta !== false) {
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
        campos: [{ id: 'peso', etiqueta: op.etiquetaPeso || 'Peso', tipo: 'number', valor: F(ar.peso) }],
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
      const r = await U.dialogo({ titulo: 'Limpiar lienzo', texto: 'Se eliminarán todos los nodos y conexiones.', aceptar: 'Limpiar' });
      if (!r) return;
      G = { nodos: [], aristas: [], sigId: 1 };
      origen = null;
      cambio();
    }

    function obtener() {
      return {
        nodos: G.nodos.map(n => ({ id: n.id, nombre: n.nombre, x: r1(n.x), y: r1(n.y) })),
        aristas: G.aristas.map(a => ({ de: a.de, a: a.a, peso: a.peso }))
      };
    }

    function cargar(g, organizarTipo) {
      const v = validar(g);
      if (!v) return false;
      G = v.g;
      resaltado = null;
      origen = null;
      if (v.sinPos || organizarTipo) {
        if (medir()) organizar(organizarTipo || null);
        else pendiente = { tipo: organizarTipo || null };
      } else normalizar();
      dibujar();
      guardarLocal();
      avisar();
      return true;
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
        aristas: d.aristas.filter(a => a.de < n && a.a < n && (bucles || a.de !== a.a)).map(a => ({ de: a.de + 1, a: a.a + 1, peso: a.peso })),
        sigId: n + 1
      };
      origen = null;
      resaltado = null;
      if (medir()) organizar(d.distribucion, d.particion);
      else pendiente = { tipo: d.distribucion, particion: d.particion };
      dibujar();
      guardarLocal();
      avisar();
      return G.nodos.map(x => x.id);
    }

    function fijarAristas(lista) {
      const ids = new Set(G.nodos.map(n => n.id));
      G.aristas = lista.filter(a => ids.has(a.de) && ids.has(a.a) && (bucles || a.de !== a.a));
      G.nodos.forEach(n => { n.y = Math.max(n.y, minY(n.id)); });
      cambio();
    }

    function nuevo(n) {
      G = { nodos: Array.from({ length: n }, (_, i) => ({ id: i + 1, nombre: U.letra(i), x: 0, y: 0 })), aristas: [], sigId: n + 1 };
      origen = null;
      resaltado = null;
      if (medir()) organizar('circulo');
      else pendiente = { tipo: 'circulo' };
      cambio();
    }

    function resaltar(r) {
      resaltado = {
        aristas: new Set((r.aristas || []).map(([de, a]) => clave(de, a))),
        etiquetas: r.etiquetas || null
      };
      dibujar();
    }

    function quitarResaltado() {
      resaltado = null;
      dibujar();
    }

    function exportarPNG(nombre) {
      if (!G.nodos.length) return U.aviso('El grafo está vacío');
      origen = null;
      dibujar();
      const clon = svg.cloneNode(true);
      clon.setAttribute('xmlns', NS);
      clon.setAttribute('width', r1(vb.w));
      clon.setAttribute('height', r1(vb.h));
      const fondo = document.createElementNS(NS, 'rect');
      fondo.setAttribute('width', r1(vb.w));
      fondo.setAttribute('height', r1(vb.h));
      fondo.setAttribute('fill', '#ffffff');
      clon.insertBefore(fondo, clon.querySelector('.capa'));
      clon.querySelectorAll('path[stroke="transparent"]').forEach(p => p.remove());
      clon.querySelectorAll('title').forEach(t => t.remove());
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
          if (b) U.descargarBlob(U.nombreArchivo(nombre, 'grafo') + '.png', b);
          else U.aviso('No se pudo generar la imagen');
        }, 'image/png');
      };
      img.onerror = () => U.aviso('No se pudo generar la imagen');
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(datos);
    }

    raiz.querySelector('.barra-herramientas').addEventListener('click', e => {
      const b = e.target.closest('[data-herr]');
      if (b) elegir(b.dataset.herr);
    });
    svg.addEventListener('pointerdown', abajo);
    svg.addEventListener('pointermove', mover);
    svg.addEventListener('pointerup', arriba);
    svg.addEventListener('pointercancel', () => { toque = null; });
    q('[data-acc=organizar]').addEventListener('click', () => { if (medir()) organizar(); dibujar(); guardarLocal(); });
    q('[data-acc=limpiar]').addEventListener('click', limpiar);
    bQuitar.addEventListener('click', quitarResaltado);
    q('[data-acc=card]').addEventListener('change', e => { verCard = e.target.checked; dibujar(); });

    if (window.ResizeObserver) new ResizeObserver(() => { if (raiz.offsetParent) mostrar(); }).observe(lienzo);

    let guardado = null;
    if (op.clave) {
      try { guardado = JSON.parse(localStorage.getItem(op.clave)); } catch (e) {}
    }
    const v = validar(guardado) || validar(op.ejemplo ? op.ejemplo() : null);
    if (v) {
      G = v.g;
      if (v.sinPos || !guardado) pendiente = { tipo: null };
    }

    elegir('mover');

    return {
      obtener, cargar, desdeMatriz, fijarAristas, nuevo, resaltar, quitarResaltado,
      mostrar, exportarPNG, cardinalidades: () => cardinalidades(),
      vacio: () => !G.nodos.length
    };
  }

  return { crear };
})();
