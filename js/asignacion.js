const Asignacion = (() => {
  const MAX = 20;
  const MAXN = 20;
  const F = v => Algoritmos.fmt(v);
  const $ = s => document.querySelector(s);
  let A = null;
  let ed = null;
  let solucion = null;
  let fuente = 'matriz';
  let sincronizando = false;
  let mapa = null;

  const etqFila = i => U.letra(i);
  const etqCol = j => String(j + 1);

  function ejemploMatriz(objetivo = 'min') {
    return {
      objetivo,
      modo: 'matriz',
      filas: ['A', 'B', 'C', 'D'],
      columnas: ['1', '2', '3'],
      valores: [['9', '2', '7'], ['6', '4', '3'], ['5', '8', '1'], ['7', '6', '']]
    };
  }

  function ejemploGrafo() {
    const nombres = ['A', 'B', 'C', '1', '2', '3'];
    return {
      nodos: nombres.map((nombre, i) => ({ id: i + 1, nombre, x: 0, y: 0 })),
      aristas: [
        { de: 1, a: 4, peso: 9 }, { de: 1, a: 5, peso: 2 }, { de: 2, a: 4, peso: 6 },
        { de: 2, a: 6, peso: 3 }, { de: 3, a: 5, peso: 8 }, { de: 3, a: 6, peso: 1 }
      ],
      sigId: 7
    };
  }

  function validar(m) {
    if (!m || !Array.isArray(m.valores) || !m.valores.length || !Array.isArray(m.valores[0])) return null;
    const f = Math.min(m.valores.length, MAX);
    const c = Math.min(Math.max(...m.valores.map(r => Array.isArray(r) ? r.length : 0)), MAX);
    if (!c) return null;
    const res = {
      objetivo: m.objetivo === 'max' ? 'max' : 'min',
      modo: m.modo === 'grafo' ? 'grafo' : 'matriz',
      filas: [], columnas: [], valores: []
    };
    for (let i = 0; i < f; i++) {
      res.valores.push(Array.from({ length: c }, (_, j) => {
        const v = Array.isArray(m.valores[i]) ? m.valores[i][j] : undefined;
        return v === null || v === undefined ? '' : String(v);
      }));
      const nf = Array.isArray(m.filas) ? m.filas[i] : undefined;
      res.filas.push(nf != null && String(nf).trim() ? String(nf) : etqFila(i));
    }
    for (let j = 0; j < c; j++) {
      const nc = Array.isArray(m.columnas) ? m.columnas[j] : undefined;
      res.columnas.push(nc != null && String(nc).trim() ? String(nc) : etqCol(j));
    }
    return res;
  }

  function guardarLocal() {
    try { localStorage.setItem('grafolab.asignacion', JSON.stringify(A)); } catch (e) {}
  }

  function obsoleto() {
    if (!solucion) return;
    solucion = null;
    $('#a-resultado').classList.add('obsoleto');
  }

  function nota(texto) {
    const p = $('#a-nota');
    p.hidden = !texto;
    p.innerHTML = texto ? `<span class="material-symbols-rounded">tips_and_updates</span><span>${texto}</span>` : '';
  }

  function sincronizar() {
    U.marcar($('#a-modo'), A.modo);
    U.marcar($('#a-objetivo'), A.objetivo);
    $('#a-panel-matriz').hidden = A.modo !== 'matriz';
    $('#a-panel-grafo').hidden = A.modo !== 'grafo';
    $('#a-filas').value = A.valores.length;
    $('#a-columnas').value = A.valores[0].length;
  }

  function dibujarTabla() {
    let h = '<thead><tr><th class="esquina">agente · tarea</th>';
    A.columnas.forEach((c, j) => { h += `<th><input class="etq" data-col="${j}" value="${U.esc(c)}" maxlength="12" aria-label="Nombre de la columna ${j + 1}"></th>`; });
    h += '</tr></thead><tbody>';
    A.valores.forEach((fila, i) => {
      h += `<tr><th><input class="etq" data-fila="${i}" value="${U.esc(A.filas[i])}" maxlength="12" aria-label="Nombre de la fila ${i + 1}"></th>`;
      fila.forEach((v, j) => {
        h += `<td><input class="celda" data-i="${i}" data-j="${j}" value="${U.esc(v)}" placeholder="—" inputmode="decimal" autocomplete="off" aria-label="${U.esc(A.filas[i])}, ${U.esc(A.columnas[j])}"></td>`;
      });
      h += '</tr>';
    });
    $('#a-tabla').innerHTML = h + '</tbody>';
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

  function redimensionarEstado(f, c) {
    f = Math.max(1, Math.min(MAX, Math.round(f) || 1));
    c = Math.max(1, Math.min(MAX, Math.round(c) || 1));
    A.valores = Array.from({ length: f }, (_, i) => Array.from({ length: c }, (_, j) => A.valores[i]?.[j] ?? ''));
    A.filas = Array.from({ length: f }, (_, i) => A.filas[i] ?? etqFila(i));
    A.columnas = Array.from({ length: c }, (_, j) => A.columnas[j] ?? etqCol(j));
  }

  function redimensionar() {
    redimensionarEstado(Number($('#a-filas').value), Number($('#a-columnas').value));
    nota('');
    dibujar();
    cambioMatriz();
  }

  function aleatoria() {
    A.valores = A.valores.map(r => r.map(() => Math.random() < 0.12 ? '' : String(1 + Math.floor(Math.random() * 20))));
    nota('');
    dibujarTabla();
    cambioMatriz();
  }

  function limpiar() {
    A.valores = A.valores.map(r => r.map(() => ''));
    nota('');
    dibujarTabla();
    cambioMatriz();
  }

  function ejemplo() {
    A = ejemploMatriz(A.objetivo);
    nota('Ejemplo: 4 agentes (A, B, C, D) y 3 tareas. D no puede hacer la tarea 3. Como sobra un agente, el método agrega una tarea ficticia.');
    dibujar();
    cambioMatriz();
  }

  function leer() {
    let malo = null;
    const C = A.valores.map((r, i) => r.map((v, j) => {
      const x = U.leerCelda(v, true);
      if (x.malo && !malo) malo = `${A.filas[i]} → ${A.columnas[j]}`;
      return x.malo ? null : x.v;
    }));
    return { C, malo };
  }

  function matrizDeGrafo() {
    const g = ed.obtener();
    const ar = g.aristas.filter(a => a.de !== a.a);
    if (!ar.length) return null;
    const ori = g.nodos.filter(n => ar.some(a => a.de === n.id));
    const des = g.nodos.filter(n => ar.some(a => a.a === n.id));
    const peso = new Map(ar.map(a => [a.de + '>' + a.a, a.peso]));
    A.filas = ori.map(n => n.nombre);
    A.columnas = des.map(n => n.nombre);
    A.valores = ori.map(o => des.map(d => peso.has(o.id + '>' + d.id) ? F(peso.get(o.id + '>' + d.id)) : ''));
    mapa = { f: ori.map(n => n.id), c: des.map(n => n.id) };
    fuente = null;
    const usados = new Set([...ori, ...des].map(n => n.id));
    const sueltos = g.nodos.filter(n => !usados.has(n.id)).map(n => n.nombre);
    const bucles = g.aristas.length - ar.length;
    let t = `Matriz armada desde el grafo: las <b>filas</b> son los nodos de los que sale alguna conexión (${ori.length}) y las <b>columnas</b> los nodos a los que llega alguna (${des.length}). Así no quedan filas ni columnas vacías.`;
    if (sueltos.length) t += ` Se dejaron fuera los nodos sin conexiones: ${U.esc(Algoritmos.lista(sueltos))}.`;
    if (bucles) t += ` ${bucles === 1 ? 'Se ignoró un bucle' : 'Se ignoraron ' + bucles + ' bucles'}, porque un agente no se asigna a sí mismo.`;
    nota(t);
    dibujar();
    guardarLocal();
    return { ori: ori.length, des: des.length };
  }

  function grafoDeMatriz() {
    const { C, malo } = leer();
    if (malo) { U.aviso(`El valor de ${malo} no es un número`); return false; }
    const fOk = [], cOk = [];
    C.forEach((r, i) => { if (r.some(v => Number.isFinite(v))) fOk.push(i); });
    C[0].forEach((_, j) => { if (C.some(r => Number.isFinite(r[j]))) cOk.push(j); });
    if (!fOk.length) { U.aviso('La matriz no tiene valores para dibujar'); return false; }
    if (fOk.length + cOk.length > MAXN) { U.aviso(`El grafo admite hasta ${MAXN} nodos (filas + columnas)`); return false; }
    const nombres = [...fOk.map(i => A.filas[i]), ...cOk.map(j => A.columnas[j])];
    const aristas = [];
    fOk.forEach((i, a) => cOk.forEach((j, b) => {
      if (Number.isFinite(C[i][j])) aristas.push({ de: a, a: fOk.length + b, peso: C[i][j] });
    }));
    sincronizando = true;
    const ids = ed.desdeMatriz({ nombres, aristas, distribucion: 'bipartito', particion: fOk.length });
    sincronizando = false;
    mapa = {
      f: A.filas.map((_, i) => { const k = fOk.indexOf(i); return k < 0 ? null : ids[k]; }),
      c: A.columnas.map((_, j) => { const k = cOk.indexOf(j); return k < 0 ? null : ids[fOk.length + k]; })
    };
    fuente = null;
    const quitadas = (A.filas.length - fOk.length) + (A.columnas.length - cOk.length);
    if (quitadas) U.aviso('Las filas o columnas vacías no se dibujan');
    return true;
  }

  function cambiarModo(m) {
    if (m === A.modo) return;
    if (m === 'grafo' && fuente === 'matriz') grafoDeMatriz();
    if (m === 'matriz' && fuente === 'grafo' && !matrizDeGrafo()) U.aviso('El grafo no tiene conexiones; se mantiene la matriz anterior');
    A.modo = m;
    sincronizar();
    guardarLocal();
    if (m === 'grafo') {
      ed.mostrar();
      if (solucion && mapa) resaltarGrafo();
    }
  }

  function resaltarGrafo() {
    if (!solucion || !mapa) return;
    const aristas = solucion.asignaciones
      .filter(a => !a.ficticia)
      .map(a => [mapa.f[a.oi], mapa.c[a.oj]])
      .filter(([x, y]) => x != null && y != null);
    ed.resaltar({ aristas });
  }

  function verEnGrafo() {
    if (!solucion) return;
    if (!grafoDeMatriz()) return;
    A.modo = 'grafo';
    sincronizar();
    guardarLocal();
    ed.mostrar();
    resaltarGrafo();
    $('#a-entrada').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function error(texto) {
    solucion = null;
    const res = $('#a-resultado');
    res.classList.remove('obsoleto');
    res.innerHTML = `<div class="tarjeta aviso-error"><span class="material-symbols-rounded">error</span><div><h3>No se pudo resolver</h3><p>${U.esc(texto)}</p></div></div>`;
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resolver() {
    if (A.modo === 'grafo' && (fuente === 'grafo' || !mapa)) {
      if (!matrizDeGrafo()) return error('El grafo no tiene conexiones. Conecta cada agente con las tareas que puede hacer; el peso de cada conexión es el costo.');
    }
    const { C, malo } = leer();
    if (malo) return error(`El valor de la celda ${malo} no es un número.`);
    const r = Algoritmos.asignacion(C, A.objetivo, A.filas, A.columnas);
    if (r.error) return error(r.error);
    solucion = r;
    const res = $('#a-resultado');
    res.classList.remove('obsoleto');
    res.innerHTML = htmlResultado(r);
    if (A.modo === 'grafo') resaltarGrafo();
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function tabla(m, filas, cols, o = {}) {
    const mf = o.marcaF || [], mc = o.marcaC || [];
    let h = '<div class="tabla-scroll"><table class="matriz lectura"><thead><tr><th></th>';
    cols.forEach((c, j) => {
      const cls = [o.lc && o.lc[j] ? 'linea' : '', mc[j] || ''].join(' ').trim();
      h += `<th class="${cls}">${U.esc(c)}</th>`;
    });
    h += '</tr></thead><tbody>';
    m.forEach((r, i) => {
      const cls = [o.lf && o.lf[i] ? 'linea' : '', mf[i] || ''].join(' ').trim();
      h += `<tr><th class="${cls}">${U.esc(filas[i])}</th>`;
      r.forEach((v, j) => {
        const c = [];
        const txt = F(v);
        if (mf[i] === 'eliminada' || mc[j] === 'eliminada') c.push('eliminada');
        else {
          const cf = o.lf && o.lf[i], cc = o.lc && o.lc[j];
          if (o.asign && o.asign[i] === j) c.push('asignada');
          else if (cf && cc) c.push('doble');
          else if (cf || cc) c.push('cubierta');
          else if (o.ceros && txt === '0') c.push('cero');
          if (mf[i] === 'ficticia' || mc[j] === 'ficticia') c.push('fic');
          if (txt === '—') c.push('prohibida');
        }
        h += `<td class="${c.join(' ')}">${txt}</td>`;
      });
      h += '</tr>';
    });
    return h + '</tbody></table></div>';
  }

  function htmlResultado(r) {
    const max = r.objetivo === 'max';
    const reales = r.asignaciones.filter(a => !a.ficticia && Number.isFinite(a.valor));
    const chips = r.asignaciones.map(a => a.ficticia
      ? `<span class="chip">${U.esc(a.fila)} → ${U.esc(a.col)} <b>${a.oi >= 0 ? 'sin tarea' : 'nadie la hace'}</b></span>`
      : `<span class="chip ${Number.isFinite(a.valor) ? 'negro' : ''}">${U.esc(a.fila)} → ${U.esc(a.col)} <b>${F(a.valor)}</b></span>`).join('');
    const sinTarea = r.asignaciones.filter(a => a.ficticia && a.oi >= 0).map(a => a.fila);
    const sinAgente = r.asignaciones.filter(a => a.ficticia && a.oj >= 0).map(a => a.col);
    let explicacion = `Cada fila recibe una columna distinta. ${max ? 'Beneficio' : 'Costo'} total: ${reales.map(a => F(a.valor)).join(' + ') || '0'} = <b>${F(r.total)}</b>.`;
    if (sinTarea.length) explicacion += ` ${U.esc(Algoritmos.lista(sinTarea))} ${sinTarea.length === 1 ? 'recibió' : 'recibieron'} una columna ficticia, o sea, ${sinTarea.length === 1 ? 'se queda' : 'se quedan'} sin tarea.`;
    if (sinAgente.length) explicacion += ` ${sinAgente.length === 1 ? 'La tarea' : 'Las tareas'} ${U.esc(Algoritmos.lista(sinAgente))} ${sinAgente.length === 1 ? 'quedó asignada' : 'quedaron asignadas'} a una fila ficticia, o sea, nadie ${sinAgente.length === 1 ? 'la' : 'las'} hace.`;
    const leyenda = `<div class="leyenda">
      <span><i class="l-cero"></i>Cero</span>
      <span><i class="l-cubierta"></i>Tapada por una línea</span>
      <span><i class="l-doble"></i>Cruce de dos líneas</span>
      <span><i class="l-asignada"></i>Asignación</span>
      <span><i class="l-fic"></i>Ficticia</span>
      <span><i class="l-eliminada"></i>Eliminada</span>
    </div>`;
    const prep = [];
    if (r.eliminadasF.length || r.eliminadasC.length) prep.push(`se eliminaron ${r.eliminadasF.length + r.eliminadasC.length} ${r.eliminadasF.length + r.eliminadasC.length === 1 ? 'fila o columna vacía' : 'filas o columnas vacías'}`);
    if (r.ficticias) prep.push(`se ${r.ficticias === 1 ? 'agregó una ficticia' : 'agregaron ' + r.ficticias + ' ficticias'}`);
    return `
      <div class="tarjeta">
        <div class="resultado-cabecera">
          <div>
            <div class="etiqueta-cifra">${max ? 'Beneficio máximo' : 'Costo mínimo'}</div>
            <div class="cifra">${F(r.total)}</div>
          </div>
          <span class="insignia"><span class="material-symbols-rounded">assignment_ind</span>Método húngaro · ${r.n} × ${r.n}</span>
        </div>
        ${r.factible ? '' : '<p class="nota"><span class="material-symbols-rounded">warning</span><span>No existe una asignación completa usando solo las celdas permitidas: alguna fila tuvo que quedarse con una celda «—».</span></p>'}
        <h3>Asignaciones</h3>
        <div class="chips">${chips}</div>
        <p class="explicacion">${explicacion}</p>
        <h3>Sobre la matriz ${prep.length ? 'preparada' : 'original'}</h3>
        ${prep.length ? `<p class="ayuda"><span class="material-symbols-rounded">info</span><span>Antes de resolver, ${prep.join(' y ')}. Mira el paso a paso para ver por qué.</span></p>` : ''}
        ${tabla(r.orig, r.filas, r.cols, { asign: r.asign, marcaF: r.marcaF, marcaC: r.marcaC })}
        <div class="acciones">
          ${A.modo === 'matriz' ? '<button type="button" class="btn contorno" data-accion="ver-grafo"><span class="material-symbols-rounded">hub</span>Ver la solución en el grafo</button>' : ''}
        </div>
      </div>
      <div class="tarjeta">
        <details class="pasos" open>
          <summary><span class="material-symbols-rounded">expand_more</span>Paso a paso (${r.pasos.length} pasos)</summary>
          ${leyenda}
          ${r.pasos.map((p, k) => `
            <div class="paso">
              <h4><span class="num">${k + 1}</span>${U.esc(p.titulo)}</h4>
              <p>${U.esc(p.texto)}</p>
              ${tabla(p.m, p.filas, p.cols, p)}
            </div>`).join('')}
        </details>
      </div>`;
  }

  async function guardarArchivo() {
    const r = await U.dialogo({
      titulo: 'Guardar asignación',
      texto: 'Se descargará un archivo .json con la matriz y el grafo, que luego puedes abrir con el botón «Abrir».',
      campos: [{ id: 'nombre', etiqueta: 'Nombre del archivo', valor: 'asignacion' }],
      aceptar: 'Descargar'
    });
    if (!r) return;
    if (A.modo === 'grafo' && fuente === 'grafo') matrizDeGrafo();
    U.descargarJSON(U.nombreArchivo(r.nombre, 'asignacion') + '.json', { app: 'GrafoLab', version: 2, tipo: 'asignacion', asignacion: A, grafo: ed.obtener() });
  }

  function cargarArchivo(obj) {
    const v = validar(obj.asignacion || obj.matriz || obj);
    if (!v) { U.aviso('El archivo no contiene una matriz de asignación válida'); return false; }
    A = v;
    if (obj.grafo) {
      sincronizando = true;
      ed.cargar(obj.grafo);
      sincronizando = false;
    }
    fuente = A.modo;
    mapa = null;
    solucion = null;
    nota('');
    $('#a-resultado').innerHTML = '';
    $('#a-resultado').classList.remove('obsoleto');
    dibujar();
    guardarLocal();
    if (A.modo === 'grafo') ed.mostrar();
    return true;
  }

  function desdeGrafo(g) {
    sincronizando = true;
    ed.cargar({ nodos: g.nodos, aristas: g.aristas.filter(a => a.de !== a.a) });
    sincronizando = false;
    solucion = null;
    $('#a-resultado').innerHTML = '';
    $('#a-resultado').classList.remove('obsoleto');
    const info = matrizDeGrafo();
    A.modo = 'matriz';
    sincronizar();
    guardarLocal();
    if (info) U.aviso(`Matriz de ${info.ori} × ${info.des} armada desde el grafo`);
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
    const nf = Math.max(A.valores.length, i0 + filas.length);
    const nc = Math.max(A.valores[0].length, j0 + Math.max(...filas.map(r => r.length)));
    if (nf !== A.valores.length || nc !== A.valores[0].length) redimensionarEstado(nf, nc);
    filas.forEach((r, di) => r.forEach((v, dj) => {
      const i = i0 + di, j = j0 + dj;
      if (i < A.valores.length && j < A.valores[0].length) A.valores[i][j] = v.trim();
    }));
    dibujar();
    cambioMatriz();
    U.aviso('Valores pegados en la matriz');
  }

  function init() {
    let guardado = null;
    try { guardado = JSON.parse(localStorage.getItem('grafolab.asignacion')); } catch (e) {}
    A = validar(guardado) || ejemploMatriz();
    fuente = A.modo;

    ed = Editor.crear($('#a-editor'), {
      clave: 'grafolab.asignacion.grafo',
      ejemplo: ejemploGrafo,
      etiquetaPeso: 'Costo',
      idaVuelta: false,
      ayudas: {
        nodo: 'Toca el lienzo para crear un nodo. Pon los agentes a la izquierda y las tareas a la derecha.',
        conectar: 'Toca un agente y luego una tarea que pueda hacer; el peso es el costo (o el beneficio).'
      },
      alCambiar: () => {
        if (sincronizando) return;
        fuente = 'grafo';
        mapa = null;
        obsoleto();
      }
    });

    $('#a-modo').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) cambiarModo(b.dataset.valor);
    });
    $('#a-objetivo').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.dataset.valor === A.objetivo) return;
      A.objetivo = b.dataset.valor;
      sincronizar();
      obsoleto();
      guardarLocal();
    });
    $('#a-aplicar-tam').addEventListener('click', redimensionar);
    ['#a-filas', '#a-columnas'].forEach(s => $(s).addEventListener('keydown', e => { if (e.key === 'Enter') redimensionar(); }));
    $('#a-ejemplo').addEventListener('click', ejemplo);
    $('#a-aleatoria').addEventListener('click', aleatoria);
    $('#a-limpiar').addEventListener('click', limpiar);
    $('#a-resolver').addEventListener('click', resolver);
    $('#a-guardar').addEventListener('click', guardarArchivo);
    $('#a-abrir').addEventListener('click', () => App.abrirArchivo());
    $('#a-resultado').addEventListener('click', e => {
      if (e.target.closest('[data-accion="ver-grafo"]')) verEnGrafo();
    });

    const t = $('#a-tabla');
    t.addEventListener('input', e => {
      const x = e.target;
      if (x.classList.contains('celda')) A.valores[+x.dataset.i][+x.dataset.j] = x.value;
      else if (x.dataset.fila !== undefined) A.filas[+x.dataset.fila] = x.value;
      else if (x.dataset.col !== undefined) A.columnas[+x.dataset.col] = x.value;
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
    t.addEventListener('paste', pegar);

    dibujar();
  }

  return {
    init, desdeGrafo, cargarArchivo,
    mostrar: () => { if (A.modo === 'grafo') ed.mostrar(); }
  };
})();
