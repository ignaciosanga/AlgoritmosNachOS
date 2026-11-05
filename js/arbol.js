const Arboles = (() => {
  const $ = s => document.querySelector(s);
  const T = Algoritmos.Arbol;
  const MAXN = 31;
  const SEP = 54, NIVEL = 78, R = 22, MARGEN = 40, MX = 64;
  const NOMBRES = {
    pre: { titulo: 'Preorden', regla: 'raíz → izquierda → derecha', idea: 'Primero se anota la raíz y después se recorren sus hijos.' },
    in: { titulo: 'Inorden', regla: 'izquierda → raíz → derecha', idea: 'En un árbol de búsqueda sale ordenado de menor a mayor.' },
    post: { titulo: 'Postorden', regla: 'izquierda → derecha → raíz', idea: 'La raíz se anota al final, después de sus dos subárboles.' },
    niveles: { titulo: 'Por niveles', regla: 'de arriba hacia abajo, de izquierda a derecha', idea: 'Recorre el árbol piso por piso.' }
  };
  let raiz = null;
  let rep = null;
  let frames = [];
  let tipoRecon = 'pre';

  const clonar = x => x ? JSON.parse(JSON.stringify(x)) : null;

  function guardarLocal() {
    try { localStorage.setItem('grafolab.arbol', JSON.stringify({ raiz })); } catch (e) {}
  }

  function valido(x, prof = 0) {
    if (x === null) return true;
    if (!x || typeof x !== 'object' || !Number.isFinite(x.v) || prof > 40) return false;
    return valido(x.i ?? null, prof + 1) && valido(x.d ?? null, prof + 1);
  }

  function normalizar(x) {
    if (!x) return null;
    return { v: Number(x.v), i: normalizar(x.i), d: normalizar(x.d) };
  }

  function posiciones(r) {
    const pos = new Map();
    let k = 0;
    const rec = (x, prof) => {
      if (!x) return;
      rec(x.i, prof + 1);
      pos.set(x, { x: MX + k * SEP, y: MARGEN + prof * NIVEL, prof });
      k++;
      rec(x.d, prof + 1);
    };
    rec(r, 0);
    return { pos, ancho: Math.max(1, k) };
  }

  function dibujar(f = {}) {
    const r = f.arbol !== undefined ? f.arbol : raiz;
    const lienzo = $('#t-lienzo');
    if (!r) {
      lienzo.innerHTML = '<div class="vacio-arbol"><span class="material-symbols-rounded" style="font-size:40px;color:#c4c4c4">account_tree</span><p>El árbol está vacío. Escribe un número y presiona «Insertar», o usa «Ejemplo».</p></div>';
      return;
    }
    const { pos, ancho } = posiciones(r);
    const alt = T.altura(r);
    const w = MX + MARGEN + (ancho - 1) * SEP + 10, h = MARGEN * 2 + (alt - 1) * NIVEL + 10;
    const vis = f.visibles ? new Set(f.visibles) : null;
    const nodos = f.nodos || {};
    const aristas = new Set(f.aristas || []);
    let lineas = '', circulos = '', niveles = '';
    for (let p = 0; p < alt; p++) niveles += `<text class="etq-nivel" x="8" y="${MARGEN + p * NIVEL + 4}">N${p}</text>`;
    pos.forEach((p, x) => {
      if (vis && !vis.has(x.v)) return;
      [x.i, x.d].forEach(h2 => {
        if (!h2 || (vis && !vis.has(h2.v))) return;
        const q = pos.get(h2);
        lineas += `<line class="ar-l ${aristas.has(h2.v) ? 'camino' : ''}" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`;
      });
      const c = [nodos[x.v] || '', x === r ? 'raiz' : ''].join(' ');
      circulos += `<g class="nd ${c}"><title>${x.v}</title><circle cx="${p.x}" cy="${p.y}" r="${R}"/><text x="${p.x}" y="${p.y + 5}">${Algoritmos.fmt(x.v)}</text></g>`;
    });
    lienzo.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="width:100%;max-width:${w}px;height:auto" xmlns="http://www.w3.org/2000/svg">${niveles}${lineas}${circulos}</svg>`;
  }

  function narrar(f) {
    const n = $('#t-narracion');
    n.classList.toggle('fin', !!f.fin);
    n.innerHTML = `<span class="material-symbols-rounded">${f.fin ? 'check_circle' : 'record_voice_over'}</span><span>${f.texto || ''}</span>`;
  }

  function mostrarFrame(k) {
    const f = frames[k];
    dibujar(f);
    narrar(f);
    document.querySelectorAll('.secuencia span').forEach(s => s.classList.remove('on', 'ahora'));
    if (f.secuencia) {
      const fila = document.querySelector(`.recorrido[data-tipo="${f.secuencia.tipo}"] .secuencia`);
      if (fila) [...fila.children].forEach((s, j) => {
        if (j < f.secuencia.hasta) s.classList.add('on');
        else if (j === f.secuencia.hasta) s.classList.add('ahora');
      });
    }
  }

  function animar(lista, auto = true) {
    frames = lista;
    rep.cargar(frames.length, 0, auto && frames.length > 1);
    if (frames.length) $('#t-escena').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function estadisticas() {
    const n = T.contar(raiz);
    const bst = T.esBST(raiz);
    const ino = T.recorrido(raiz, 'in');
    const chips = [
      `${n} ${n === 1 ? 'nodo' : 'nodos'}`,
      `Altura ${T.altura(raiz)}`,
      `${T.hojas(raiz)} ${T.hojas(raiz) === 1 ? 'hoja' : 'hojas'}`
    ];
    if (n && bst) chips.push(`Mínimo ${Algoritmos.fmt(ino[0])}`, `Máximo ${Algoritmos.fmt(ino[ino.length - 1])}`);
    $('#t-stats').innerHTML = chips.map(c => `<span class="chip">${c}</span>`).join('') +
      (n ? `<span class="chip ${bst ? 'verde' : 'violeta'}">${bst ? 'Es árbol de búsqueda' : 'No es de búsqueda'}</span>` : '');
    $('#t-nobst').hidden = !n || bst;
    ['#t-insertar', '#t-buscar', '#t-eliminar', '#t-aleatorios'].forEach(s => { $(s).disabled = n > 0 && !bst; });
  }

  function dibujarRecorridos() {
    $('#t-recorridos').innerHTML = Object.entries(NOMBRES).map(([tipo, d]) => {
      const sec = T.recorrido(raiz, tipo);
      return `<div class="recorrido" data-tipo="${tipo}">
        <div><b>${d.titulo}</b><small>${d.regla}</small></div>
        <div class="secuencia">${sec.length ? sec.map(v => `<span>${Algoritmos.fmt(v)}</span>`).join('') : '<small style="color:var(--texto-3)">Vacío</small>'}</div>
        <div class="acciones">
          <button type="button" class="btn lleno" data-animar="${tipo}" ${sec.length ? '' : 'disabled'}><span class="material-symbols-rounded">play_arrow</span>Animar</button>
          <button type="button" class="btn tonal" data-copiar="${tipo}" ${sec.length ? '' : 'disabled'} aria-label="Copiar ${d.titulo}"><span class="material-symbols-rounded">content_copy</span></button>
        </div>
      </div>`;
    }).join('');
  }

  function actualizar() {
    estadisticas();
    dibujarRecorridos();
    guardarLocal();
  }

  function framesCamino(arbol, camino, v, accion) {
    const lista = [];
    const vistos = [];
    camino.forEach((p, k) => {
      const nodos = {};
      vistos.forEach(x => { nodos[x] = 'camino'; });
      nodos[p.v] = 'actual';
      const fv = Algoritmos.fmt(v), fp = Algoritmos.fmt(p.v);
      let texto;
      if (p.dir === 'igual') texto = accion === 'insertar' ? `${fv} es igual a ${fp}: ese valor ya está en el árbol.` : `${fv} es igual a ${fp}: ¡lo encontramos!`;
      else texto = `Comparamos ${fv} con ${fp}: ${fv} ${p.dir === 'izq' ? '<' : '>'} ${fp}, así que vamos a la <b>${p.dir === 'izq' ? 'izquierda' : 'derecha'}</b>.`;
      if (k === 0) texto = `Empezamos en la raíz (${fp}). ` + texto;
      lista.push({ arbol, nodos, aristas: vistos.slice(1).concat(k > 0 ? [p.v] : []), texto });
      vistos.push(p.v);
    });
    return lista;
  }

  function leerValores() {
    const t = $('#t-valor').value.trim();
    if (!t) { U.aviso('Escribe un número'); return null; }
    const partes = t.split(/[\s,;]+/).filter(Boolean);
    const nums = partes.map(x => U.num(x));
    const malo = partes.find((x, k) => nums[k] === null || Number.isNaN(nums[k]));
    if (malo !== undefined) { U.aviso(`«${malo}» no es un número`); return null; }
    return nums;
  }

  function insertarValores(nums, animarUno = true) {
    if (T.contar(raiz) >= MAXN) return U.aviso(`Máximo ${MAXN} nodos`);
    if (nums.length === 1 && animarUno) {
      const v = nums[0];
      if (T.contar(raiz) >= MAXN) return U.aviso(`Máximo ${MAXN} nodos`);
      const antes = clonar(raiz);
      const r = T.insertar(raiz, v);
      raiz = r.raiz;
      const lista = framesCamino(antes, r.camino, v, 'insertar');
      if (r.repetido) {
        lista[lista.length - 1].fin = true;
        lista[lista.length - 1].nodos[v] = 'borrar';
        U.aviso(`${Algoritmos.fmt(v)} ya estaba en el árbol`);
      } else {
        const padre = r.camino.length ? r.camino[r.camino.length - 1] : null;
        const nodos = {};
        r.camino.forEach(p => { nodos[p.v] = 'camino'; });
        nodos[v] = 'ok';
        lista.push({
          arbol: clonar(raiz), nodos, aristas: r.camino.slice(1).map(p => p.v).concat([v]), fin: true,
          texto: padre ? `Encontramos un lugar vacío: ${Algoritmos.fmt(v)} se inserta como hijo <b>${padre.dir === 'izq' ? 'izquierdo' : 'derecho'}</b> de ${Algoritmos.fmt(padre.v)}.` : `El árbol estaba vacío: ${Algoritmos.fmt(v)} es la nueva raíz.`
        });
      }
      actualizar();
      animar(lista);
      return;
    }
    const nuevos = [], repetidos = [];
    for (const v of nums) {
      if (T.contar(raiz) >= MAXN) break;
      const r = T.insertar(raiz, v);
      raiz = r.raiz;
      (r.repetido ? repetidos : nuevos).push(v);
    }
    const nodos = {};
    nuevos.forEach(v => { nodos[v] = 'ok'; });
    actualizar();
    animar([{ nodos, fin: true, texto: `Se insertaron ${nuevos.length} ${nuevos.length === 1 ? 'valor' : 'valores'} (en verde)${repetidos.length ? `. Se ignoraron los repetidos: ${repetidos.map(Algoritmos.fmt).join(', ')}` : ''}. Cada uno bajó por el árbol hasta un lugar vacío: a la izquierda si era menor, a la derecha si era mayor.` }], false);
  }

  function insertar() {
    const nums = leerValores();
    if (!nums) return;
    insertarValores(nums);
    $('#t-valor').value = '';
    $('#t-valor').focus();
  }

  function buscar() {
    const nums = leerValores();
    if (!nums) return;
    const v = nums[0];
    if (!raiz) return U.aviso('El árbol está vacío');
    const r = T.buscar(raiz, v);
    const lista = framesCamino(clonar(raiz), r.camino, v, 'buscar');
    const ult = lista[lista.length - 1];
    if (r.encontrado) {
      ult.nodos[v] = 'ok';
      ult.fin = true;
      ult.texto += ` Se necesitaron ${r.camino.length} ${r.camino.length === 1 ? 'comparación' : 'comparaciones'}.`;
    } else {
      lista.push({ arbol: clonar(raiz), nodos: Object.fromEntries(r.camino.map(p => [p.v, 'camino'])), aristas: r.camino.slice(1).map(p => p.v), fin: true, texto: `Llegamos a un lugar vacío: <b>${Algoritmos.fmt(v)} no está</b> en el árbol. Solo revisamos ${r.camino.length} de ${T.contar(raiz)} nodos.` });
    }
    animar(lista);
  }

  function eliminar() {
    const nums = leerValores();
    if (!nums) return;
    const v = nums[0];
    if (!raiz) return U.aviso('El árbol está vacío');
    const antes = clonar(raiz);
    const r = T.eliminar(raiz, v);
    const lista = framesCamino(antes, r.camino, v, 'buscar');
    if (!r.encontrado) {
      lista.push({ arbol: antes, nodos: Object.fromEntries(r.camino.map(p => [p.v, 'camino'])), fin: true, texto: `${Algoritmos.fmt(v)} no está en el árbol, así que no hay nada que eliminar.` });
      return animar(lista);
    }
    const fv = Algoritmos.fmt(v);
    const caso = r.caso;
    const ult = lista[lista.length - 1];
    ult.nodos[v] = 'borrar';
    if (caso.tipo === 'hoja') ult.texto = `${fv} es una <b>hoja</b> (no tiene hijos): se puede quitar directamente.`;
    else if (caso.tipo === 'uno') ult.texto = `${fv} tiene <b>un solo hijo</b> (${Algoritmos.fmt(caso.hijo)}): ese hijo sube a ocupar su lugar.`;
    else {
      ult.texto = `${fv} tiene <b>dos hijos</b>. Se reemplaza por su sucesor: el menor del subárbol derecho, ${Algoritmos.fmt(caso.sucesor)}.`;
      ult.nodos[caso.sucesor] = 'actual';
    }
    raiz = r.raiz;
    const nodos = {};
    if (caso.tipo === 'dos') nodos[caso.sucesor] = 'ok';
    if (caso.tipo === 'uno') nodos[caso.hijo] = 'ok';
    lista.push({ arbol: clonar(raiz), nodos, fin: true, texto: `Listo: ${fv} se eliminó y el árbol sigue cumpliendo la regla (menores a la izquierda, mayores a la derecha).` });
    actualizar();
    animar(lista);
    $('#t-valor').value = '';
  }

  function animarRecorrido(tipo) {
    if (!raiz) return;
    const sec = T.recorrido(raiz, tipo);
    const d = NOMBRES[tipo];
    const arbol = clonar(raiz);
    const lista = [{ arbol, nodos: {}, secuencia: { tipo, hasta: -1 }, texto: `<b>${d.titulo}</b> (${d.regla}). ${d.idea}` }];
    sec.forEach((v, k) => {
      const nodos = {};
      sec.slice(0, k).forEach(x => { nodos[x] = 'visto'; });
      nodos[v] = 'actual';
      lista.push({ arbol, nodos, secuencia: { tipo, hasta: k }, texto: `Paso ${k + 1}: anotamos <b>${Algoritmos.fmt(v)}</b>. Recuerda la regla: ${d.regla}.` });
    });
    lista.push({ arbol, nodos: Object.fromEntries(sec.map(x => [x, 'visto'])), secuencia: { tipo, hasta: sec.length }, fin: true, texto: `${d.titulo} completo: ${sec.map(Algoritmos.fmt).join(', ')}.` });
    animar(lista);
  }

  async function aleatorios() {
    const r = await U.dialogo({
      titulo: 'Insertar aleatorios',
      texto: 'Se insertan números al azar, sin repetir.',
      campos: [
        { id: 'n', etiqueta: 'Cantidad', tipo: 'number', valor: '8' },
        { id: 'min', etiqueta: 'Mínimo', tipo: 'number', valor: '1' },
        { id: 'max', etiqueta: 'Máximo', tipo: 'number', valor: '99' }
      ],
      aceptar: 'Insertar'
    });
    if (!r) return;
    const n = Math.round(U.num(r.n)), lo = Math.round(U.num(r.min)), hi = Math.round(U.num(r.max));
    if (!(n >= 1 && n <= MAXN)) return U.aviso(`Elige entre 1 y ${MAXN} números`);
    if (!(Number.isFinite(lo) && Number.isFinite(hi) && hi > lo)) return U.aviso('El máximo debe ser mayor que el mínimo');
    const existentes = new Set(T.recorrido(raiz, 'in'));
    const libres = [];
    for (let x = lo; x <= hi && libres.length < 5000; x++) if (!existentes.has(x)) libres.push(x);
    if (!libres.length) return U.aviso('No quedan números libres en ese rango');
    const elegidos = [];
    while (elegidos.length < n && libres.length) elegidos.push(libres.splice(Math.floor(Math.random() * libres.length), 1)[0]);
    insertarValores(elegidos, false);
  }

  function ejemplo() {
    raiz = null;
    [50, 30, 70, 20, 40, 60, 80, 35, 65].forEach(v => { raiz = T.insertar(raiz, v).raiz; });
    actualizar();
    animar([{ nodos: {}, fin: true, texto: 'Ejemplo cargado: se insertaron 50, 30, 70, 20, 40, 60, 80, 35 y 65 en ese orden. Fíjate que cada nodo tiene a su izquierda solo valores menores y a su derecha solo mayores.' }], false);
  }

  async function limpiar() {
    if (!raiz) return;
    const r = await U.dialogo({ titulo: 'Limpiar árbol', texto: 'Se eliminarán todos los nodos.', aceptar: 'Limpiar' });
    if (!r) return;
    raiz = null;
    actualizar();
    animar([{ nodos: {}, texto: 'Árbol vacío. Inserta un número para empezar.' }], false);
  }

  function leerLista(sel) {
    const t = $(sel).value.trim();
    if (!t) return [];
    const partes = t.split(/[\s,;]+/).filter(Boolean);
    const nums = partes.map(x => U.num(x));
    if (nums.some(x => x === null || Number.isNaN(x))) return null;
    return nums;
  }

  function reconstruir() {
    const ino = leerLista('#t-ino');
    const otro = leerLista('#t-otro');
    const res = $('#t-recon-res');
    if (ino === null || otro === null) { res.innerHTML = '<div class="aviso-c c-cuidado"><span class="material-symbols-rounded">error</span><div><b>Revisa los valores</b><p>Escribe solo números separados por comas.</p></div></div>'; return; }
    const r = T.reconstruir(ino, otro, tipoRecon);
    if (r.error) { res.innerHTML = `<div class="aviso-c c-cuidado"><span class="material-symbols-rounded">error</span><div><b>No se pudo reconstruir</b><p>${U.esc(r.error)}</p></div></div>`; return; }
    raiz = r.raiz;
    const nombre = tipoRecon === 'pre' ? 'preorden' : 'postorden';
    const donde = tipoRecon === 'pre' ? 'el primero que queda en el preorden' : 'el último que queda en el postorden';
    res.innerHTML = `
      <div class="aviso-c c-clave"><span class="material-symbols-rounded">check_circle</span><div><b>Árbol reconstruido</b><p>Usa el reproductor de arriba para verlo armarse nodo por nodo. ${T.esBST(raiz) ? 'Además es un árbol de búsqueda.' : 'No es un árbol de búsqueda, así que insertar, buscar y eliminar quedan desactivados hasta que empieces uno nuevo.'}</p></div></div>
      <div class="recon-pasos">${r.pasos.map(p => `
        <div class="recon-paso"><span class="etq-chip">${Algoritmos.fmt(p.v)}</span><span>La raíz de este subárbol es <b>${Algoritmos.fmt(p.v)}</b> (${donde}). ${!p.izq.length && !p.der.length ? 'No le queda nada a ningún lado: es una <b>hoja</b>.' : `En el inorden, a su izquierda ${p.izq.length ? `quedan <b>[${p.izq.map(Algoritmos.fmt).join(', ')}]</b>` : 'no queda nada'} y a su derecha ${p.der.length ? `<b>[${p.der.map(Algoritmos.fmt).join(', ')}]</b>` : 'nada'}.`}</span></div>`).join('')}</div>`;
    const arbol = clonar(raiz);
    const lista = [{ arbol, visibles: [], texto: `Reconstruimos con inorden + ${nombre}. La raíz es ${donde}; el inorden dice qué queda a cada lado.` }];
    const creados = [];
    r.pasos.forEach(p => {
      creados.push(p.v);
      lista.push({ arbol, visibles: creados.slice(), nodos: { [p.v]: 'actual' }, texto: `Raíz <b>${Algoritmos.fmt(p.v)}</b>: a la izquierda [${p.izq.map(Algoritmos.fmt).join(', ')}], a la derecha [${p.der.map(Algoritmos.fmt).join(', ')}].` });
    });
    lista.push({ arbol, fin: true, texto: 'Árbol completo. Compara sus recorridos con los que escribiste: coinciden.' });
    actualizar();
    animar(lista, true);
  }

  function ejemploRecon() {
    $('#t-ino').value = '4, 2, 5, 1, 6, 3, 7';
    $('#t-otro').value = tipoRecon === 'pre' ? '1, 2, 4, 5, 3, 6, 7' : '4, 5, 2, 6, 7, 3, 1';
  }

  async function exportarPNG() {
    if (!raiz) return U.aviso('El árbol está vacío');
    const r = await U.dialogo({ titulo: 'Exportar imagen', campos: [{ id: 'nombre', etiqueta: 'Nombre del archivo', valor: 'arbol' }], aceptar: 'Descargar' });
    if (!r) return;
    dibujar({});
    const svg = $('#t-lienzo svg');
    const clon = svg.cloneNode(true);
    const w = +svg.getAttribute('width'), h = +svg.getAttribute('height');
    const estilo = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    estilo.textContent = ".nd circle{fill:#fff;stroke:#111;stroke-width:2}.nd text{font:700 14px Arial,sans-serif;text-anchor:middle;fill:#111}.ar-l{stroke:#2b2b2b;stroke-width:2}.etq-nivel{font:600 11px Arial,sans-serif;fill:#8c8c8c}";
    clon.insertBefore(estilo, clon.firstChild);
    const fondo = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    fondo.setAttribute('width', w);
    fondo.setAttribute('height', h);
    fondo.setAttribute('fill', '#fff');
    clon.insertBefore(fondo, estilo.nextSibling);
    clon.querySelectorAll('title').forEach(t => t.remove());
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = w * 2;
      c.height = h * 2;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => b ? U.descargarBlob(U.nombreArchivo(r.nombre, 'arbol') + '.png', b) : U.aviso('No se pudo generar la imagen'), 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clon));
  }

  async function guardarArchivo() {
    const r = await U.dialogo({ titulo: 'Guardar árbol', campos: [{ id: 'nombre', etiqueta: 'Nombre del archivo', valor: 'arbol' }], aceptar: 'Descargar' });
    if (!r) return;
    U.descargarJSON(U.nombreArchivo(r.nombre, 'arbol') + '.json', { app: 'GrafoLab', version: 2, tipo: 'arbol', arbol: { raiz, inorden: T.recorrido(raiz, 'in'), preorden: T.recorrido(raiz, 'pre') } });
  }

  function cargarArchivo(obj) {
    const a = obj.arbol || obj;
    let nuevo = null;
    if (a && a.raiz !== undefined && valido(a.raiz)) nuevo = normalizar(a.raiz);
    else if (a && Array.isArray(a.inorden) && Array.isArray(a.preorden)) {
      const r = T.reconstruir(a.inorden.map(Number), a.preorden.map(Number), 'pre');
      if (!r.error) nuevo = r.raiz;
    }
    if (!nuevo && !(a && a.raiz === null)) { U.aviso('El archivo no contiene un árbol válido'); return false; }
    raiz = nuevo;
    actualizar();
    animar([{ nodos: {}, fin: true, texto: 'Árbol abierto desde el archivo.' }], false);
    return true;
  }

  function init() {
    let g = null;
    try { g = JSON.parse(localStorage.getItem('grafolab.arbol')); } catch (e) {}
    rep = Reproductor.crear($('#t-repro'), { alMostrar: mostrarFrame, velocidad: 3 });
    if (g && valido(g.raiz) && g.raiz) {
      raiz = normalizar(g.raiz);
      actualizar();
      animar([{ nodos: {}, texto: 'Este es tu árbol. Inserta, busca o elimina un valor, o anima un recorrido.' }], false);
    } else ejemplo();
    $('#t-insertar').addEventListener('click', insertar);
    $('#t-buscar').addEventListener('click', buscar);
    $('#t-eliminar').addEventListener('click', eliminar);
    $('#t-valor').addEventListener('keydown', e => { if (e.key === 'Enter') insertar(); });
    $('#t-aleatorios').addEventListener('click', aleatorios);
    $('#t-ejemplo').addEventListener('click', ejemplo);
    $('#t-limpiar').addEventListener('click', limpiar);
    $('#t-png').addEventListener('click', exportarPNG);
    $('#t-guardar').addEventListener('click', guardarArchivo);
    $('#t-abrir').addEventListener('click', () => App.abrirArchivo());
    $('#t-recorridos').addEventListener('click', e => {
      const a = e.target.closest('[data-animar]');
      if (a) return animarRecorrido(a.dataset.animar);
      const c = e.target.closest('[data-copiar]');
      if (c) {
        const t = T.recorrido(raiz, c.dataset.copiar).map(Algoritmos.fmt).join(', ');
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => U.aviso('Recorrido copiado')).catch(() => U.aviso(t));
      }
    });
    $('#t-tipo-recon').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      tipoRecon = b.dataset.valor;
      U.marcar($('#t-tipo-recon'), tipoRecon);
      $('#t-otro-etq').textContent = tipoRecon === 'pre' ? 'Preorden' : 'Postorden';
      $('#t-otro').placeholder = tipoRecon === 'pre' ? 'Ej.: 1, 2, 4, 5, 3, 6, 7' : 'Ej.: 4, 5, 2, 6, 7, 3, 1';
    });
    $('#t-reconstruir').addEventListener('click', reconstruir);
    $('#t-ejemplo-recon').addEventListener('click', ejemploRecon);
    U.marcar($('#t-tipo-recon'), tipoRecon);
  }

  return { init, cargarArchivo, mostrar: () => {} };
})();
