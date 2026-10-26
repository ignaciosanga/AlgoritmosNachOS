const Johnson = (() => {
  const MAX = 20;
  const F = v => Algoritmos.fmt(v);
  const $ = s => document.querySelector(s);
  let J = null;
  let ed = null;
  let solucion = null;
  let fuente = 'grafo';
  let sincronizando = false;
  let mapa = null;

  const ARISTAS_EJEMPLO = [[0, 1, 5], [0, 2, 4], [1, 3, 3], [2, 3, 5], [2, 4, 2], [3, 5, 4], [4, 5, 5]];

  function ejemploGrafo() {
    return {
      nodos: ['1', '2', '3', '4', '5', '6'].map((nombre, i) => ({ id: i + 1, nombre, x: 0, y: 0 })),
      aristas: ARISTAS_EJEMPLO.map(([de, a, peso]) => ({ de: de + 1, a: a + 1, peso })),
      sigId: 7
    };
  }

  function ejemploMatriz(objetivo = 'max', modo = 'grafo') {
    const valores = Array.from({ length: 6 }, () => new Array(6).fill(''));
    ARISTAS_EJEMPLO.forEach(([de, a, peso]) => { valores[de][a] = String(peso); });
    return { objetivo, modo, nombres: ['1', '2', '3', '4', '5', '6'], valores };
  }

  function validar(m) {
    if (!m) return null;
    const nombres = Array.isArray(m.nombres) ? m.nombres : (Array.isArray(m.filas) ? m.filas : null);
    if (!Array.isArray(m.valores) || !m.valores.length || !Array.isArray(m.valores[0])) return null;
    const n = Math.min(MAX, Math.max(m.valores.length, ...m.valores.map(r => Array.isArray(r) ? r.length : 0)));
    const res = {
      objetivo: m.objetivo === 'min' ? 'min' : 'max',
      modo: m.modo === 'matriz' ? 'matriz' : 'grafo',
      nombres: [],
      valores: []
    };
    for (let i = 0; i < n; i++) {
      const x = nombres ? nombres[i] : undefined;
      res.nombres.push(x != null && String(x).trim() ? String(x) : String(i + 1));
      res.valores.push(Array.from({ length: n }, (_, j) => {
        if (i === j) return '';
        const v = Array.isArray(m.valores[i]) ? m.valores[i][j] : undefined;
        return v === null || v === undefined ? '' : String(v);
      }));
    }
    return res;
  }

  function guardarLocal() {
    try { localStorage.setItem('grafolab.johnson', JSON.stringify(J)); } catch (e) {}
  }

  function obsoleto() {
    if (!solucion) return;
    solucion = null;
    $('#j-resultado').classList.add('obsoleto');
  }

  function nota(texto) {
    const p = $('#j-nota');
    p.hidden = !texto;
    p.innerHTML = texto ? `<span class="material-symbols-rounded">tips_and_updates</span><span>${texto}</span>` : '';
  }

  function sincronizar() {
    U.marcar($('#j-modo'), J.modo);
    U.marcar($('#j-objetivo'), J.objetivo);
    $('#j-panel-matriz').hidden = J.modo !== 'matriz';
    $('#j-panel-grafo').hidden = J.modo !== 'grafo';
    $('#j-nodos').value = J.nombres.length;
  }

  function dibujarTabla() {
    let h = '<thead><tr><th class="esquina">de → a</th>';
    J.nombres.forEach((x, j) => { h += `<th><span class="etq-chip" data-cab="${j}">${U.esc(x)}</span></th>`; });
    h += '</tr></thead><tbody>';
    J.valores.forEach((fila, i) => {
      h += `<tr><th><input class="etq" data-fila="${i}" value="${U.esc(J.nombres[i])}" maxlength="12" aria-label="Nombre del nodo ${i + 1}"></th>`;
      fila.forEach((v, j) => {
        h += i === j
          ? '<td><span class="diag" title="Un nodo no se conecta consigo mismo">—</span></td>'
          : `<td><input class="celda" data-i="${i}" data-j="${j}" value="${U.esc(v)}" placeholder="—" inputmode="decimal" autocomplete="off" aria-label="${U.esc(J.nombres[i])} a ${U.esc(J.nombres[j])}"></td>`;
      });
      h += '</tr>';
    });
    $('#j-tabla').innerHTML = h + '</tbody>';
  }

  function dibujar() {
    sincronizar();
    dibujarTabla();
  }

  function cambioMatriz() {
    fuente = 'matriz';
    mapa = null;
    obsoleto();
    guardarLocal();
  }

  function redimensionar() {
    const n = Math.max(2, Math.min(MAX, Math.round(Number($('#j-nodos').value)) || 2));
    J.valores = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? '' : (J.valores[i]?.[j] ?? '')));
    J.nombres = Array.from({ length: n }, (_, i) => J.nombres[i] ?? String(i + 1));
    nota('');
    dibujar();
    cambioMatriz();
  }

  function aleatoria() {
    const n = J.nombres.length;
    const V = Array.from({ length: n }, () => new Array(n).fill(''));
    const w = () => String(1 + Math.floor(Math.random() * 9));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.random() < 0.35) V[i][j] = w();
    for (let j = 1; j < n; j++) {
      if (!V.some((r, i) => i < j && r[j] !== '')) V[Math.floor(Math.random() * j)][j] = w();
    }
    for (let i = 0; i < n - 1; i++) {
      if (!V[i].some(v => v !== '')) V[i][i + 1 + Math.floor(Math.random() * (n - 1 - i))] = w();
    }
    J.valores = V;
    nota('');
    dibujarTabla();
    cambioMatriz();
  }

  function limpiar() {
    J.valores = J.valores.map(r => r.map(() => ''));
    nota('');
    dibujarTabla();
    cambioMatriz();
  }

  function ejemplo() {
    J = ejemploMatriz(J.objetivo, 'matriz');
    nota('Ejemplo: una red de 6 eventos y 7 actividades. Cada número es la duración de la actividad que va de la fila a la columna.');
    dibujar();
    cambioMatriz();
  }

  function leer() {
    let malo = null;
    const W = J.valores.map((r, i) => r.map((v, j) => {
      if (i === j) return null;
      const x = U.leerCelda(v, false);
      if (x.malo && !malo) malo = `${J.nombres[i]} → ${J.nombres[j]}`;
      return x.malo ? null : x.v;
    }));
    return { W, malo };
  }

  function activos(W) {
    return J.nombres.map((_, i) => i).filter(i => W[i].some(v => v !== null) || W.some(r => r[i] !== null));
  }

  function matrizDeGrafo() {
    const g = ed.obtener();
    const ar = g.aristas.filter(a => a.de !== a.a);
    if (!ar.length) return null;
    const usados = g.nodos.filter(n => ar.some(a => a.de === n.id || a.a === n.id));
    const idx = new Map(usados.map((n, i) => [n.id, i]));
    J.nombres = usados.map(n => n.nombre);
    J.valores = usados.map(() => usados.map(() => ''));
    ar.forEach(a => { J.valores[idx.get(a.de)][idx.get(a.a)] = F(a.peso); });
    mapa = usados.map(n => n.id);
    fuente = null;
    const sueltos = g.nodos.filter(n => !idx.has(n.id)).map(n => n.nombre);
    nota(sueltos.length ? `Se dejaron fuera los nodos sin conexiones (${U.esc(Algoritmos.lista(sueltos))}), porque no forman parte de la red.` : '');
    dibujar();
    guardarLocal();
    return true;
  }

  function grafoDeMatriz() {
    const { W, malo } = leer();
    if (malo) { U.aviso(`El valor de ${malo} no es un número`); return false; }
    const act = activos(W);
    if (!act.length) { U.aviso('La matriz no tiene actividades para dibujar'); return false; }
    const aristas = [];
    act.forEach((i, a) => act.forEach((j, b) => { if (W[i][j] !== null) aristas.push({ de: a, a: b, peso: W[i][j] }); }));
    sincronizando = true;
    const ids = ed.desdeMatriz({ nombres: act.map(i => J.nombres[i]), aristas, distribucion: 'capas' });
    sincronizando = false;
    mapa = J.nombres.map((_, i) => { const k = act.indexOf(i); return k < 0 ? null : ids[k]; });
    fuente = null;
    if (act.length < J.nombres.length) U.aviso('Los nodos sin conexiones no se dibujan');
    return true;
  }

  function cambiarModo(m) {
    if (m === J.modo) return;
    if (m === 'grafo' && fuente === 'matriz') grafoDeMatriz();
    if (m === 'matriz' && fuente === 'grafo' && !matrizDeGrafo()) U.aviso('La red no tiene actividades; se mantiene la matriz anterior');
    J.modo = m;
    sincronizar();
    guardarLocal();
    if (m === 'grafo') {
      ed.mostrar();
      if (solucion && mapa) resaltarGrafo();
    }
  }

  function resaltarGrafo() {
    if (!solucion || !mapa) return;
    const r = solucion;
    const id = k => mapa[r.act[k]];
    const aristas = r.actividades.filter(a => a.critica).map(a => [id(a.i), id(a.j)]).filter(([x, y]) => x != null && y != null);
    const etiquetas = {};
    r.nodos.forEach(x => { const k = id(x.i); if (k != null) etiquetas[k] = `${F(x.te)} | ${F(x.tl)}`; });
    ed.resaltar({ aristas, etiquetas });
  }

  function verEnGrafo() {
    if (!solucion) return;
    if (!grafoDeMatriz()) return;
    J.modo = 'grafo';
    sincronizar();
    guardarLocal();
    ed.mostrar();
    resaltarGrafo();
    $('#j-entrada').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function error(texto) {
    solucion = null;
    const res = $('#j-resultado');
    res.classList.remove('obsoleto');
    res.innerHTML = `<div class="tarjeta aviso-error"><span class="material-symbols-rounded">error</span><div><h3>No se pudo resolver</h3><p>${U.esc(texto)}</p></div></div>`;
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resolver() {
    if (J.modo === 'grafo' && (fuente === 'grafo' || !mapa)) {
      if (!matrizDeGrafo()) return error('La red no tiene actividades. Conecta los nodos con flechas; el peso de cada flecha es la duración de la actividad.');
    }
    if (new Set(J.nombres.map(x => x.trim())).size !== J.nombres.length) return error('Los nombres de los nodos deben ser distintos.');
    const { W, malo } = leer();
    if (malo) return error(`El valor de la celda ${malo} no es un número.`);
    const act = activos(W);
    if (!act.length) return error('La red no tiene actividades. Escribe la duración de al menos una actividad.');
    const r = Algoritmos.johnson(act.map(i => J.nombres[i]), act.map(i => act.map(j => W[i][j])), J.objetivo);
    if (r.error) return error(r.error);
    r.act = act;
    r.omitidos = J.nombres.filter((_, i) => !act.includes(i));
    solucion = r;
    const res = $('#j-resultado');
    res.classList.remove('obsoleto');
    res.innerHTML = htmlResultado(r);
    if (J.modo === 'grafo') resaltarGrafo();
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function htmlResultado(r) {
    const max = r.objetivo === 'max';
    const rutas = r.rutas.map(x => `<span class="chip negro">${x.nodos.map(U.esc).join(' → ')} <b>${F(x.valor)}</b></span>`).join('');
    const holgadas = r.actividades.filter(a => !a.critica);
    const ejemploH = holgadas.length ? holgadas[0] : null;
    let explicacion = max
      ? `El proyecto no puede terminar antes de <b>${F(r.valor)}</b> unidades de tiempo. Las actividades de la ruta crítica tienen holgura 0: si cualquiera de ellas se retrasa, se retrasa todo el proyecto.`
      : `El camino más corto desde el inicio hasta el final suma <b>${F(r.valor)}</b>. Las actividades con holgura 0 forman ese camino.`;
    if (max && ejemploH) explicacion += ` En cambio, la actividad ${U.esc(ejemploH.de)} → ${U.esc(ejemploH.a)} tiene holgura ${F(ejemploH.h)}: puede retrasarse hasta ${F(ejemploH.h)} sin afectar el final.`;
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
            <div class="etiqueta-cifra">${max ? 'Duración del proyecto' : 'Ruta más corta'}</div>
            <div class="cifra">${F(r.valor)}</div>
          </div>
          <span class="insignia"><span class="material-symbols-rounded">route</span>Johnson · ${max ? 'maximizar' : 'minimizar'}</span>
        </div>
        <p class="explicacion">${explicacion}</p>
        ${r.omitidos.length ? `<p class="nota"><span class="material-symbols-rounded">info</span><span>Se ignoraron los nodos sin conexiones: ${U.esc(Algoritmos.lista(r.omitidos))}.</span></p>` : ''}
        <h3>${r.rutas.length > 1 ? (max ? 'Rutas críticas' : 'Rutas mínimas') : (max ? 'Ruta crítica' : 'Ruta mínima')}</h3>
        <div class="chips">${rutas}</div>
        <p class="ayuda"><span class="material-symbols-rounded">info</span><span>${J.modo === 'grafo' ? 'En la red, las flechas en negro son la ruta y debajo de cada nodo aparece <b>TE | TL</b>.' : 'Puedes ver estos resultados dibujados sobre la red.'}</span></p>
        ${J.modo === 'matriz' ? '<div class="acciones"><button type="button" class="btn contorno" data-accion="ver-grafo"><span class="material-symbols-rounded">hub</span>Ver en la red</button></div>' : ''}
        <h3>Nodos (eventos)</h3>
        <p class="ayuda"><span class="material-symbols-rounded">info</span><span>TE: lo más temprano que puede ocurrir el evento · TL: lo más tarde que puede ocurrir sin retrasar el final · Holgura: ${max ? 'TL − TE' : 'TE − TL'}</span></p>
        <div class="tabla-scroll"><table class="datos">
          <thead><tr><th>Nodo</th><th>TE</th><th>TL</th><th>Holgura</th><th></th></tr></thead>
          <tbody>${filasNodos}</tbody>
        </table></div>
        <h3>Actividades (flechas)</h3>
        <div class="tabla-scroll"><table class="datos">
          <thead><tr><th>Actividad</th><th>Duración</th><th>TE origen</th><th>TL destino</th><th>Holgura</th><th></th></tr></thead>
          <tbody>${filasAct}</tbody>
        </table></div>
      </div>
      <div class="tarjeta">
        <details class="pasos" open>
          <summary><span class="material-symbols-rounded">expand_more</span>Paso a paso</summary>
          <div class="paso">
            <h4><span class="num">1</span>Ida: tiempos más tempranos (TE)</h4>
            <p>Se recorre la red de izquierda a derecha. El nodo inicial vale 0 y, en cada nodo, se toma el ${max ? 'mayor' : 'menor'} valor de «TE del nodo anterior + duración de la flecha». ${max ? 'Se toma el mayor porque un evento solo ocurre cuando terminan todas las actividades que llegan a él.' : ''}</p>
            <div class="formula">${r.ida.map(U.esc).join('\n')}</div>
          </div>
          <div class="paso">
            <h4><span class="num">2</span>Vuelta: tiempos más tardíos (TL)</h4>
            <p>Se recorre la red de derecha a izquierda. ${max ? 'El nodo final toma la duración total del proyecto' : 'Cada nodo final toma su propio TE'} y, en cada nodo, se toma el ${max ? 'menor' : 'mayor'} valor de «TL del nodo siguiente − duración de la flecha».</p>
            <div class="formula">${r.vuelta.map(U.esc).join('\n')}</div>
          </div>
          <div class="paso">
            <h4><span class="num">3</span>Holguras y ruta</h4>
            <p>${max ? 'Holgura de una actividad = TL(destino) − TE(origen) − duración.' : 'Holgura de una actividad = TE(origen) + duración − TL(destino).'} Las actividades con holgura 0 forman la ${max ? 'ruta crítica' : 'ruta mínima'}.</p>
            <div class="formula">${r.holguras.map(U.esc).join('\n')}</div>
          </div>
        </details>
      </div>`;
  }

  async function guardarArchivo() {
    const r = await U.dialogo({
      titulo: 'Guardar red',
      texto: 'Se descargará un archivo .json con la red y su matriz, que luego puedes abrir con el botón «Abrir».',
      campos: [{ id: 'nombre', etiqueta: 'Nombre del archivo', valor: 'johnson' }],
      aceptar: 'Descargar'
    });
    if (!r) return;
    if (J.modo === 'grafo' && fuente === 'grafo') matrizDeGrafo();
    U.descargarJSON(U.nombreArchivo(r.nombre, 'johnson') + '.json', { app: 'GrafoLab', version: 2, tipo: 'johnson', johnson: J, grafo: ed.obtener() });
  }

  function cargarArchivo(obj) {
    const v = validar(obj.johnson || obj.matriz || obj);
    if (!v) { U.aviso('El archivo no contiene una red válida'); return false; }
    J = v;
    if (obj.grafo) {
      sincronizando = true;
      ed.cargar(obj.grafo);
      sincronizando = false;
    }
    fuente = obj.grafo ? J.modo : 'matriz';
    mapa = null;
    solucion = null;
    nota('');
    $('#j-resultado').innerHTML = '';
    $('#j-resultado').classList.remove('obsoleto');
    dibujar();
    guardarLocal();
    if (J.modo === 'grafo') {
      if (fuente === 'matriz') grafoDeMatriz();
      ed.mostrar();
    }
    return true;
  }

  function desdeGrafo(g) {
    const bucles = g.aristas.filter(a => a.de === a.a).length;
    J.modo = 'grafo';
    sincronizar();
    sincronizando = true;
    ed.cargar({ nodos: g.nodos, aristas: g.aristas.filter(a => a.de !== a.a) }, 'capas');
    sincronizando = false;
    fuente = 'grafo';
    mapa = null;
    solucion = null;
    nota(bucles ? `${bucles === 1 ? 'Se quitó un bucle' : 'Se quitaron ' + bucles + ' bucles'}: en una red de actividades ningún evento se conecta consigo mismo.` : '');
    $('#j-resultado').innerHTML = '';
    $('#j-resultado').classList.remove('obsoleto');
    guardarLocal();
    ed.mostrar();
    U.aviso('Red cargada desde Grafos');
  }

  function init() {
    let guardado = null;
    try { guardado = JSON.parse(localStorage.getItem('grafolab.johnson')); } catch (e) {}
    J = validar(guardado) || ejemploMatriz();
    fuente = guardado ? J.modo : null;

    ed = Editor.crear($('#j-editor'), {
      clave: 'grafolab.johnson.grafo',
      ejemplo: ejemploGrafo,
      bucles: false,
      etiquetaPeso: 'Duración',
      nombrar: k => String(k + 1),
      avisoBucle: 'En Johnson un nodo no puede conectarse consigo mismo',
      ayudas: {
        nodo: 'Toca el lienzo para crear un evento (nodo).',
        conectar: 'Toca el evento donde empieza la actividad y luego donde termina; el peso es la duración.'
      },
      alCambiar: () => {
        if (sincronizando) return;
        fuente = 'grafo';
        mapa = null;
        obsoleto();
      }
    });

    $('#j-modo').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) cambiarModo(b.dataset.valor);
    });
    $('#j-objetivo').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.dataset.valor === J.objetivo) return;
      J.objetivo = b.dataset.valor;
      sincronizar();
      obsoleto();
      guardarLocal();
    });
    $('#j-aplicar-tam').addEventListener('click', redimensionar);
    $('#j-nodos').addEventListener('keydown', e => { if (e.key === 'Enter') redimensionar(); });
    $('#j-ejemplo').addEventListener('click', ejemplo);
    $('#j-aleatoria').addEventListener('click', aleatoria);
    $('#j-limpiar').addEventListener('click', limpiar);
    $('#j-resolver').addEventListener('click', resolver);
    $('#j-guardar').addEventListener('click', guardarArchivo);
    $('#j-abrir').addEventListener('click', () => App.abrirArchivo());
    $('#j-resultado').addEventListener('click', e => {
      if (e.target.closest('[data-accion="ver-grafo"]')) verEnGrafo();
    });

    const t = $('#j-tabla');
    t.addEventListener('input', e => {
      const x = e.target;
      if (x.classList.contains('celda')) J.valores[+x.dataset.i][+x.dataset.j] = x.value;
      else if (x.dataset.fila !== undefined) {
        const i = +x.dataset.fila;
        J.nombres[i] = x.value;
        const cab = t.querySelector(`[data-cab="${i}"]`);
        if (cab) cab.textContent = x.value;
      }
      cambioMatriz();
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

    dibujar();
  }

  return {
    init, desdeGrafo, cargarArchivo,
    mostrar: () => { if (J.modo === 'grafo') ed.mostrar(); }
  };
})();
