const Matrices = (() => {
  const MAX = 20;
  const F = v => Algoritmos.fmt(v);
  const $ = s => document.querySelector(s);
  let E = null;
  let solucion = null;

  const ayudas = {
    asignacion: 'Filas = agentes, columnas = tareas. Celda vacía = 0. Escribe M para una asignación prohibida. Si no es cuadrada se completa con filas o columnas ficticias. Puedes pegar una tabla desde Excel.',
    johnson: 'Cada celda (fila → columna) es la duración de la actividad entre esos nodos; deja vacío si no hay conexión. La red no debe tener bucles ni ciclos. Maximizar = ruta crítica, minimizar = ruta más corta.'
  };

  function etqFila(i) { return E.algoritmo === 'johnson' ? String(i + 1) : U.letra(i); }
  function etqCol(j) { return String(j + 1); }

  function ejemplo() {
    return {
      algoritmo: 'asignacion',
      objetivo: 'min',
      filas: ['A', 'B', 'C'],
      columnas: ['1', '2', '3'],
      valores: [['9', '2', '7'], ['6', '4', '3'], ['5', '8', '1']]
    };
  }

  function cuadrar(m) {
    const n = Math.max(m.valores.length, m.valores[0].length);
    m.valores = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => m.valores[i]?.[j] ?? ''));
    m.filas = Array.from({ length: n }, (_, i) => m.filas[i] ?? String(i + 1));
    m.columnas = m.filas.slice();
  }

  function validar(m, objetivoActual) {
    if (!m || !Array.isArray(m.valores) || !m.valores.length || !Array.isArray(m.valores[0])) return null;
    const f = Math.min(m.valores.length, MAX);
    const c = Math.min(Math.max(...m.valores.map(r => Array.isArray(r) ? r.length : 0)), MAX);
    if (!c) return null;
    const algoritmo = m.algoritmo === 'johnson' ? 'johnson' : 'asignacion';
    const objetivo = m.objetivo === 'max' || m.objetivo === 'min' ? m.objetivo : (objetivoActual || 'min');
    const res = { algoritmo, objetivo, filas: [], columnas: [], valores: [] };
    for (let i = 0; i < f; i++) {
      res.valores.push(Array.from({ length: c }, (_, j) => {
        const v = Array.isArray(m.valores[i]) ? m.valores[i][j] : undefined;
        return v === null || v === undefined ? '' : String(v);
      }));
      const nf = Array.isArray(m.filas) ? m.filas[i] : undefined;
      res.filas.push(nf != null && String(nf).trim() ? String(nf) : (algoritmo === 'johnson' ? String(i + 1) : U.letra(i)));
    }
    for (let j = 0; j < c; j++) {
      const nc = Array.isArray(m.columnas) ? m.columnas[j] : undefined;
      res.columnas.push(nc != null && String(nc).trim() ? String(nc) : String(j + 1));
    }
    if (algoritmo === 'johnson') cuadrar(res);
    return res;
  }

  function guardarLocal() {
    try { localStorage.setItem('grafolab.matriz', JSON.stringify(E)); } catch (e) {}
  }

  function cambio() {
    if (solucion) {
      solucion = null;
      $('#m-resultado').classList.add('obsoleto');
    }
    guardarLocal();
  }

  function sincronizar() {
    const joh = E.algoritmo === 'johnson';
    document.querySelectorAll('#m-algoritmo button').forEach(b => b.classList.toggle('activo', b.dataset.valor === E.algoritmo));
    document.querySelectorAll('#m-objetivo button').forEach(b => b.classList.toggle('activo', b.dataset.valor === E.objetivo));
    $('#m-filas').value = E.valores.length;
    $('#m-columnas').value = E.valores[0].length;
    $('#m-caja-columnas').hidden = joh;
    $('#m-etq-filas').textContent = joh ? 'Nodos' : 'Filas';
    $('#m-ayuda').innerHTML = `<span class="material-symbols-rounded">info</span><span>${U.esc(ayudas[E.algoritmo])}</span>`;
  }

  function dibujarTabla() {
    const joh = E.algoritmo === 'johnson';
    let h = `<thead><tr><th class="esquina">${joh ? 'de → a' : ''}</th>`;
    E.columnas.forEach((c, j) => { h += `<th><input class="etq" data-col="${j}" value="${U.esc(c)}" maxlength="12" aria-label="Nombre de columna"></th>`; });
    h += '</tr></thead><tbody>';
    E.valores.forEach((fila, i) => {
      h += `<tr><th><input class="etq" data-fila="${i}" value="${U.esc(E.filas[i])}" maxlength="12" aria-label="Nombre de fila"></th>`;
      fila.forEach((v, j) => {
        h += `<td><input class="celda" data-i="${i}" data-j="${j}" value="${U.esc(v)}" inputmode="decimal" autocomplete="off" aria-label="${U.esc(E.filas[i])}, ${U.esc(E.columnas[j])}"></td>`;
      });
      h += '</tr>';
    });
    $('#m-tabla').innerHTML = h + '</tbody>';
  }

  function dibujar() {
    sincronizar();
    dibujarTabla();
  }

  function redimensionarEstado(f, c) {
    f = Math.max(1, Math.min(MAX, Math.round(f) || 1));
    c = Math.max(1, Math.min(MAX, Math.round(c) || 1));
    if (E.algoritmo === 'johnson') f = c = Math.max(f, c);
    E.valores = Array.from({ length: f }, (_, i) => Array.from({ length: c }, (_, j) => E.valores[i]?.[j] ?? ''));
    E.filas = Array.from({ length: f }, (_, i) => E.filas[i] ?? etqFila(i));
    E.columnas = E.algoritmo === 'johnson'
      ? E.filas.slice()
      : Array.from({ length: c }, (_, j) => E.columnas[j] ?? etqCol(j));
  }

  function redimensionar() {
    const f = Number($('#m-filas').value);
    const c = E.algoritmo === 'johnson' ? f : Number($('#m-columnas').value);
    redimensionarEstado(f, c);
    dibujar();
    cambio();
  }

  function cambiarAlgoritmo(a) {
    if (a === E.algoritmo) return;
    E.algoritmo = a;
    if (a === 'johnson') cuadrar(E);
    dibujar();
    $('#m-resultado').innerHTML = '';
    $('#m-resultado').classList.remove('obsoleto');
    solucion = null;
    guardarLocal();
  }

  function aleatoria() {
    const n = E.valores.length;
    if (E.algoritmo === 'asignacion') {
      E.valores = E.valores.map(r => r.map(() => String(1 + Math.floor(Math.random() * 20))));
    } else {
      const V = Array.from({ length: n }, () => new Array(n).fill(''));
      const w = () => String(1 + Math.floor(Math.random() * 9));
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.random() < 0.35) V[i][j] = w();
      for (let j = 1; j < n; j++) {
        if (!V.some((r, i) => i < j && r[j] !== '')) V[Math.floor(Math.random() * j)][j] = w();
      }
      for (let i = 0; i < n - 1; i++) {
        if (!V[i].some(v => v !== '')) V[i][i + 1 + Math.floor(Math.random() * (n - 1 - i))] = w();
      }
      E.valores = V;
    }
    dibujarTabla();
    cambio();
  }

  function limpiar() {
    E.valores = E.valores.map(r => r.map(() => ''));
    dibujarTabla();
    cambio();
  }

  function leerNumeros(permitirM) {
    let malo = null;
    const M = E.valores.map((r, i) => r.map((v, j) => {
      const t = String(v).trim();
      if (permitirM && /^(m|x|∞|inf)$/i.test(t)) return Infinity;
      const n = U.num(t);
      if (Number.isNaN(n) && !malo) malo = `${E.filas[i]} → ${E.columnas[j]}`;
      return n;
    }));
    return { M, malo };
  }

  function error(texto) {
    solucion = null;
    const res = $('#m-resultado');
    res.classList.remove('obsoleto');
    res.innerHTML = `<div class="tarjeta aviso-error"><span class="material-symbols-rounded">error</span><div><h3>No se pudo resolver</h3><p>${U.esc(texto)}</p></div></div>`;
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resolver() {
    const res = $('#m-resultado');
    if (E.algoritmo === 'asignacion') {
      const { M, malo } = leerNumeros(true);
      if (malo) return error(`El valor de la celda ${malo} no es un número.`);
      const C = M.map(r => r.map(v => v === null ? 0 : v));
      if (C.flat().every(v => !Number.isFinite(v))) return error('Todas las celdas están prohibidas (M).');
      const r = Algoritmos.asignacion(C, E.objetivo, E.filas, E.columnas);
      solucion = { tipo: 'asignacion', r };
      res.innerHTML = htmlAsignacion(r);
    } else {
      if (new Set(E.filas.map(x => x.trim())).size !== E.filas.length) return error('Los nombres de los nodos deben ser distintos.');
      const { M, malo } = leerNumeros(false);
      if (malo) return error(`El valor de la celda ${malo} no es un número.`);
      const r = Algoritmos.johnson(E.filas, M, E.objetivo);
      if (r.error) return error(r.error);
      solucion = { tipo: 'johnson', r };
      res.innerHTML = htmlJohnson(r);
    }
    res.classList.remove('obsoleto');
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function htmlMatriz(m, filas, cols, o = {}) {
    let h = '<div class="tabla-scroll"><table class="matriz lectura"><thead><tr><th></th>';
    cols.forEach((c, j) => { h += `<th class="${o.lc && o.lc[j] ? 'linea' : ''}">${U.esc(c)}</th>`; });
    h += '</tr></thead><tbody>';
    m.forEach((r, i) => {
      h += `<tr><th class="${o.lf && o.lf[i] ? 'linea' : ''}">${U.esc(filas[i])}</th>`;
      r.forEach((v, j) => {
        const cls = [];
        const cf = o.lf && o.lf[i], cc = o.lc && o.lc[j];
        if (o.asign && o.asign[i] === j) cls.push('asignada');
        else if (cf && cc) cls.push('doble');
        else if (cf || cc) cls.push('cubierta');
        else if (o.ceros && Math.abs(v) < 1e-9) cls.push('cero');
        h += `<td class="${cls.join(' ')}">${F(v)}</td>`;
      });
      h += '</tr>';
    });
    return h + '</tbody></table></div>';
  }

  function htmlAsignacion(r) {
    const max = r.objetivo === 'max';
    const chips = r.asignaciones.map(a =>
      `<span class="chip ${a.ficticia ? '' : 'negro'}">${U.esc(a.fila)} → ${U.esc(a.col)} <b>${a.ficticia ? 'ficticia' : F(a.valor)}</b></span>`).join('');
    const reales = r.asignaciones.filter(a => !a.ficticia && Number.isFinite(a.valor));
    const leyenda = `<div class="leyenda">
      <span><i style="background:#fff;box-shadow:inset 0 0 0 1.5px #111"></i>Cero</span>
      <span><i style="background:#dcdcdc"></i>Cubierta por una línea</span>
      <span><i style="background:#b8b8b8"></i>Intersección de líneas</span>
      <span><i style="background:#111"></i>Asignación</span>
    </div>`;
    return `
      <div class="tarjeta">
        <div class="resultado-cabecera">
          <div>
            <div class="etiqueta-cifra">${max ? 'Beneficio máximo' : 'Costo mínimo'}</div>
            <div class="cifra">${F(r.total)}</div>
          </div>
          <span class="insignia"><span class="material-symbols-rounded">assignment_ind</span>Método húngaro · ${r.n} × ${r.n}</span>
        </div>
        ${r.factible ? '' : '<p class="nota">No existe una asignación completa sin usar celdas prohibidas (M).</p>'}
        <h3>Asignaciones</h3>
        <div class="chips">${chips}</div>
        <h3>Sobre la matriz original</h3>
        ${htmlMatriz(r.orig, r.filas, r.cols, { asign: r.asign })}
        <p class="ayuda">Suma: ${reales.map(a => F(a.valor)).join(' + ') || '0'} = ${F(r.total)}</p>
      </div>
      <div class="tarjeta">
        <details class="pasos">
          <summary><span class="material-symbols-rounded">expand_more</span>Paso a paso (${r.pasos.length} pasos)</summary>
          ${leyenda}
          ${r.pasos.map((p, k) => `
            <div class="paso">
              <h4><span class="num">${k + 1}</span>${U.esc(p.titulo)}</h4>
              <p>${U.esc(p.texto)}</p>
              ${htmlMatriz(p.m, r.filas, r.cols, { lf: p.lf, lc: p.lc, asign: p.asign, ceros: p.ceros })}
            </div>`).join('')}
        </details>
      </div>`;
  }

  function htmlJohnson(r) {
    const max = r.objetivo === 'max';
    const rutas = r.rutas.map(x => `<span class="chip negro">${x.nodos.map(U.esc).join(' → ')} <b>${F(x.valor)}</b></span>`).join('');
    const filasNodos = r.nodos.map(x => `
      <tr class="${x.critico ? 'critica' : ''}">
        <td><span class="etq-chip">${U.esc(x.nombre)}</span></td>
        <td>${F(x.te)}</td><td>${F(x.tl)}</td><td>${F(x.h)}</td>
        <td>${x.critico ? '<span class="insignia">crítico</span>' : ''}</td>
      </tr>`).join('');
    const filasAct = r.actividades.map(a => `
      <tr class="${a.critica ? 'critica' : ''}">
        <td>${U.esc(a.de)} → ${U.esc(a.a)}</td>
        <td>${F(a.w)}</td><td>${F(a.te)}</td><td>${F(a.tl)}</td><td>${F(a.h)}</td>
        <td>${a.critica ? '<span class="insignia">crítica</span>' : ''}</td>
      </tr>`).join('');
    return `
      <div class="tarjeta">
        <div class="resultado-cabecera">
          <div>
            <div class="etiqueta-cifra">${max ? 'Duración · ruta crítica' : 'Valor · ruta mínima'}</div>
            <div class="cifra">${F(r.valor)}</div>
          </div>
          <span class="insignia"><span class="material-symbols-rounded">route</span>Johnson · ${max ? 'maximizar' : 'minimizar'}</span>
        </div>
        <h3>${r.rutas.length > 1 ? (max ? 'Rutas críticas' : 'Rutas mínimas') : (max ? 'Ruta crítica' : 'Ruta mínima')}</h3>
        <div class="chips">${rutas}</div>
        <h3>Nodos</h3>
        <p class="ayuda">TE: tiempo más temprano · TL: tiempo más tardío · Holgura: ${max ? 'TL − TE' : 'TE − TL'}</p>
        <div class="tabla-scroll"><table class="datos">
          <thead><tr><th>Nodo</th><th>TE</th><th>TL</th><th>Holgura</th><th></th></tr></thead>
          <tbody>${filasNodos}</tbody>
        </table></div>
        <h3>Actividades</h3>
        <div class="tabla-scroll"><table class="datos">
          <thead><tr><th>Actividad</th><th>Duración</th><th>TE inicio</th><th>TL fin</th><th>Holgura</th><th></th></tr></thead>
          <tbody>${filasAct}</tbody>
        </table></div>
      </div>
      <div class="tarjeta">
        <details class="pasos">
          <summary><span class="material-symbols-rounded">expand_more</span>Explicación paso a paso</summary>
          <div class="paso">
            <h4><span class="num">1</span>Ida: tiempos más tempranos (TE)</h4>
            <p>Se recorre la red desde el inicio. El nodo inicial vale 0 y en cada nodo se toma el ${max ? 'mayor' : 'menor'} valor de TE(anterior) + duración.</p>
            <div class="formula">${r.ida.map(U.esc).join('\n')}</div>
          </div>
          <div class="paso">
            <h4><span class="num">2</span>Vuelta: tiempos más tardíos (TL)</h4>
            <p>Se recorre la red desde el final hacia atrás. ${max ? 'El nodo final toma la duración total' : 'El nodo final toma su propio TE'} y en cada nodo se toma el ${max ? 'menor' : 'mayor'} valor de TL(siguiente) − duración.</p>
            <div class="formula">${r.vuelta.map(U.esc).join('\n')}</div>
          </div>
          <div class="paso">
            <h4><span class="num">3</span>Holguras</h4>
            <p>${max ? 'Holgura = TL(destino) − TE(origen) − duración.' : 'Holgura = TE(origen) + duración − TL(destino).'} Las actividades con holgura 0 forman la ${max ? 'ruta crítica' : 'ruta mínima'}.</p>
            <div class="formula">${r.holguras.map(U.esc).join('\n')}</div>
          </div>
        </details>
      </div>`;
  }

  function aGrafo() {
    const joh = E.algoritmo === 'johnson';
    const { M, malo } = leerNumeros(!joh);
    if (malo) return U.aviso(`El valor de ${malo} no es un número`);
    if (joh) {
      const aristas = [];
      M.forEach((r, i) => r.forEach((v, j) => { if (v !== null) aristas.push({ de: i, a: j, peso: v }); }));
      let resaltado = null;
      if (solucion && solucion.tipo === 'johnson') {
        resaltado = {
          aristas: solucion.r.actividades.filter(a => a.critica).map(a => [a.i, a.j]),
          etiquetas: solucion.r.nodos.map(x => `${F(x.te)} | ${F(x.tl)}`)
        };
      }
      App.ir('grafos');
      Grafos.desdeMatriz({ nombres: E.filas, aristas, resaltado, distribucion: 'capas' });
    } else {
      const f = E.filas.length;
      const aristas = [];
      M.forEach((r, i) => r.forEach((v, j) => {
        const w = v === null ? 0 : v;
        if (Number.isFinite(w)) aristas.push({ de: i, a: f + j, peso: w });
      }));
      let resaltado = null;
      if (solucion && solucion.tipo === 'asignacion') {
        resaltado = { aristas: solucion.r.asignaciones.filter(a => !a.ficticia).map(a => [a.i, f + a.j]), etiquetas: null };
      }
      App.ir('grafos');
      Grafos.desdeMatriz({ nombres: [...E.filas, ...E.columnas], aristas, resaltado, distribucion: 'bipartito', particion: f });
    }
  }

  async function guardarArchivo() {
    const r = await U.dialogo({
      titulo: 'Guardar matriz',
      texto: 'Se descargará un archivo .json que luego puedes abrir con el botón «Abrir».',
      campos: [{ id: 'nombre', etiqueta: 'Nombre del archivo', valor: E.algoritmo === 'johnson' ? 'matriz-johnson' : 'matriz-asignacion' }],
      aceptar: 'Descargar'
    });
    if (!r) return;
    U.descargarJSON(U.nombreArchivo(r.nombre, 'matriz') + '.json', { app: 'GrafoLab', version: 1, tipo: 'matriz', matriz: E });
  }

  function cargar(m) {
    const v = validar(m, E ? E.objetivo : 'min');
    if (!v) { U.aviso('El archivo no contiene una matriz válida'); return false; }
    E = v;
    solucion = null;
    $('#m-resultado').innerHTML = '';
    $('#m-resultado').classList.remove('obsoleto');
    dibujar();
    guardarLocal();
    return true;
  }

  function pegar(e) {
    const x = e.target;
    if (!x.classList.contains('celda')) return;
    const texto = (e.clipboardData || window.clipboardData).getData('text');
    if (!/[\t\n]|\s\S/.test(texto.trim())) return;
    e.preventDefault();
    const filas = texto.replace(/\r/g, '').split('\n').filter(l => l.trim() !== '')
      .map(l => l.includes('\t') ? l.split('\t') : l.trim().split(/\s+/));
    const i0 = +x.dataset.i, j0 = +x.dataset.j;
    const nf = Math.max(E.valores.length, i0 + filas.length);
    const nc = Math.max(E.valores[0].length, j0 + Math.max(...filas.map(r => r.length)));
    if (nf !== E.valores.length || nc !== E.valores[0].length) redimensionarEstado(nf, nc);
    filas.forEach((r, di) => r.forEach((v, dj) => {
      const i = i0 + di, j = j0 + dj;
      if (i < E.valores.length && j < E.valores[0].length) E.valores[i][j] = v.trim();
    }));
    dibujar();
    cambio();
    U.aviso('Valores pegados en la matriz');
  }

  function init() {
    let guardado = null;
    try { guardado = JSON.parse(localStorage.getItem('grafolab.matriz')); } catch (e) {}
    E = validar(guardado) || ejemplo();

    $('#m-algoritmo').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) cambiarAlgoritmo(b.dataset.valor);
    });
    $('#m-objetivo').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.dataset.valor === E.objetivo) return;
      E.objetivo = b.dataset.valor;
      sincronizar();
      cambio();
    });
    $('#m-aplicar-tam').addEventListener('click', redimensionar);
    ['#m-filas', '#m-columnas'].forEach(s => $(s).addEventListener('keydown', e => { if (e.key === 'Enter') redimensionar(); }));
    $('#m-aleatoria').addEventListener('click', aleatoria);
    $('#m-limpiar').addEventListener('click', limpiar);
    $('#m-resolver').addEventListener('click', resolver);
    $('#m-a-grafo').addEventListener('click', aGrafo);
    $('#m-guardar').addEventListener('click', guardarArchivo);
    $('#m-abrir').addEventListener('click', () => App.abrirArchivo());

    const t = $('#m-tabla');
    t.addEventListener('input', e => {
      const x = e.target;
      const joh = E.algoritmo === 'johnson';
      if (x.classList.contains('celda')) {
        E.valores[+x.dataset.i][+x.dataset.j] = x.value;
      } else if (x.dataset.fila !== undefined) {
        const i = +x.dataset.fila;
        E.filas[i] = x.value;
        if (joh) {
          E.columnas[i] = x.value;
          const o = t.querySelector(`[data-col="${i}"]`);
          if (o) o.value = x.value;
        }
      } else if (x.dataset.col !== undefined) {
        const j = +x.dataset.col;
        E.columnas[j] = x.value;
        if (joh) {
          E.filas[j] = x.value;
          const o = t.querySelector(`[data-fila="${j}"]`);
          if (o) o.value = x.value;
        }
      }
      cambio();
    });
    t.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || !e.target.classList.contains('celda')) return;
      e.preventDefault();
      const celdas = [...t.querySelectorAll('.celda')];
      const sig = celdas[celdas.indexOf(e.target) + 1] || celdas[0];
      sig.focus();
      sig.select();
    });
    t.addEventListener('focusin', e => { if (e.target.classList.contains('celda')) e.target.select(); });
    t.addEventListener('paste', pegar);

    dibujar();
  }

  return { init, cargar };
})();