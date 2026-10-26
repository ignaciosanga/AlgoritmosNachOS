const Grafos = (() => {
  const MAXN = 20;
  const F = v => Algoritmos.fmt(v);
  const $ = s => document.querySelector(s);
  let ed = null;
  let modoMatriz = 'pesos';
  let vista = 'compacta';

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

  function matrizPesos(g) {
    const idx = new Map(g.nodos.map((n, i) => [n.id, i]));
    const M = g.nodos.map(() => g.nodos.map(() => null));
    g.aristas.forEach(a => {
      if (idx.has(a.de) && idx.has(a.a)) M[idx.get(a.de)][idx.get(a.a)] = a.peso;
    });
    return M;
  }

  function lista(x) {
    return U.esc(Algoritmos.lista(x));
  }

  function dibujarMatriz() {
    const g = ed.obtener();
    const t = $('#g-matriz');
    const info = $('#g-matriz-info');
    const bin = modoMatriz === 'binaria';
    U.marcar($('#g-modo-matriz'), modoMatriz);
    U.marcar($('#g-vista-matriz'), vista);
    $('#g-aplicar').hidden = bin || !g.nodos.length;
    if (!g.nodos.length) {
      t.innerHTML = '<tbody><tr><td class="vacio">Todavía no hay nodos</td></tr></tbody>';
      info.hidden = true;
      return;
    }
    const M = matrizPesos(g);
    const todos = g.nodos.map((_, i) => i);
    let filas = todos, cols = todos;
    let texto = '';
    if (vista === 'compacta' && g.aristas.length) {
      filas = todos.filter(i => M[i].some(v => v !== null));
      cols = todos.filter(j => M.some(r => r[j] !== null));
      const sinF = todos.filter(i => !filas.includes(i)).map(i => g.nodos[i].nombre);
      const sinC = todos.filter(j => !cols.includes(j)).map(j => g.nodos[j].nombre);
      const partes = [];
      if (sinF.length) partes.push(`${sinF.length === 1 ? 'la fila' : 'las filas'} de ${lista(sinF)} (de ${sinF.length === 1 ? 'ese nodo' : 'esos nodos'} no sale ninguna conexión)`);
      if (sinC.length) partes.push(`${sinC.length === 1 ? 'la columna' : 'las columnas'} de ${lista(sinC)} (a ${sinC.length === 1 ? 'ese nodo' : 'esos nodos'} no llega ninguna)`);
      texto = `Matriz de <b>${filas.length} × ${cols.length}</b>. ` + (partes.length
        ? `Se ocultan ${partes.join(' y ')}, porque solo tendrían ceros. Los 0 que quedan son pares de nodos sin conexión dentro de la tabla.`
        : 'Todos los nodos tienen conexiones de salida y de llegada, así que no se oculta nada.');
    } else if (vista === 'compacta') {
      texto = `El grafo todavía no tiene conexiones, así que se muestra la matriz completa de <b>${g.nodos.length} × ${g.nodos.length}</b> para que puedas llenarla.`;
    } else {
      texto = `Matriz completa de <b>${g.nodos.length} × ${g.nodos.length}</b>: cada nodo tiene su fila y su columna, aunque solo tengan ceros. 0 = sin conexión.`;
    }
    info.hidden = false;
    info.innerHTML = `<span class="material-symbols-rounded">grid_on</span><span>${texto}</span>`;

    const suma = l => l.reduce((s, v) => s + v, 0);
    let h = '<thead><tr><th class="esquina">de → a</th>';
    cols.forEach(j => { h += `<th><span class="etq-chip">${U.esc(g.nodos[j].nombre)}</span></th>`; });
    h += (bin ? '' : '<th class="extra">Σ</th>') + '<th class="extra">Salidas</th></tr></thead><tbody>';
    filas.forEach(i => {
      h += `<tr><th><span class="etq-chip">${U.esc(g.nodos[i].nombre)}</span></th>`;
      cols.forEach(j => {
        const v = M[i][j];
        h += bin
          ? `<td class="bin ${v !== null ? 'uno' : ''}">${v !== null ? 1 : 0}</td>`
          : `<td><input class="celda" data-i="${i}" data-j="${j}" value="${v === null ? '' : F(v)}" placeholder="0" inputmode="decimal" autocomplete="off" aria-label="${U.esc(g.nodos[i].nombre)} a ${U.esc(g.nodos[j].nombre)}"></td>`;
      });
      const vals = M[i].filter(v => v !== null);
      h += (bin ? '' : `<td class="extra">${F(suma(vals))}</td>`) + `<td class="extra">${vals.length}</td></tr>`;
    });
    const colVals = cols.map(j => M.map(r => r[j]).filter(v => v !== null));
    if (!bin) {
      h += `<tr><th class="extra">Σ</th>${colVals.map(c => `<td class="extra">${F(suma(c))}</td>`).join('')}<td class="extra total">${F(suma(g.aristas.map(a => a.peso)))}</td><td></td></tr>`;
    }
    h += `<tr><th class="extra">Entradas</th>${colVals.map(c => `<td class="extra">${c.length}</td>`).join('')}${bin ? '' : '<td></td>'}<td class="extra total">${g.aristas.length}</td></tr>`;
    t.innerHTML = h + '</tbody>';
  }

  function dibujarCardinalidad() {
    const g = ed.obtener();
    const t = $('#g-cardinalidad');
    const c = ed.cardinalidades();
    if (!g.nodos.length) {
      t.innerHTML = '<tbody><tr><td class="vacio">Todavía no hay nodos</td></tr></tbody>';
      $('#g-resumen').innerHTML = '';
      return;
    }
    t.innerHTML = '<thead><tr><th>Nodo</th><th>Entradas</th><th>Salidas</th><th>Bucle</th><th>Grado</th></tr></thead><tbody>' +
      g.nodos.map(n => {
        const x = c.get(n.id);
        return `<tr><td><span class="etq-chip">${U.esc(n.nombre)}</span></td><td>${x.e}</td><td>${x.s}</td><td>${x.b ? 'Sí' : '—'}</td><td>${x.e + x.s}</td></tr>`;
      }).join('') + '</tbody>';
    const bucles = g.aristas.filter(a => a.de === a.a).length;
    const pares = g.aristas.filter(a => a.de < a.a && g.aristas.some(b => b.de === a.a && b.a === a.de)).length;
    const aislados = g.nodos.filter(n => { const x = c.get(n.id); return !x.e && !x.s; }).length;
    $('#g-resumen').innerHTML = [
      `${g.nodos.length} ${g.nodos.length === 1 ? 'nodo' : 'nodos'}`,
      `${g.aristas.length} ${g.aristas.length === 1 ? 'conexión' : 'conexiones'}`,
      `${bucles} ${bucles === 1 ? 'bucle' : 'bucles'}`,
      `${pares} ${pares === 1 ? 'par' : 'pares'} de ida y vuelta`,
      ...(aislados ? [`${aislados} sin conexiones`] : [])
    ].map(x => `<span class="chip">${x}</span>`).join('');
  }

  function buscarCiclo(g) {
    const suc = new Map(g.nodos.map(n => [n.id, []]));
    g.aristas.forEach(a => { if (a.de !== a.a) suc.get(a.de).push(a.a); });
    const estado = new Map();
    const pila = [];
    let ciclo = null;
    const visitar = id => {
      estado.set(id, 1);
      pila.push(id);
      for (const s of suc.get(id)) {
        if (ciclo) return;
        if (estado.get(s) === 1) { ciclo = pila.slice(pila.indexOf(s)).concat(s); return; }
        if (!estado.get(s)) visitar(s);
      }
      pila.pop();
      estado.set(id, 2);
    };
    for (const n of g.nodos) {
      if (ciclo) break;
      if (!estado.get(n.id)) visitar(n.id);
    }
    return ciclo;
  }

  function evaluar(g) {
    const nombre = new Map(g.nodos.map(n => [n.id, n.nombre]));
    const ar = g.aristas.filter(a => a.de !== a.a);
    const bucles = g.aristas.length - ar.length;
    const asig = { ok: false, titulo: 'Asignación', texto: '' };
    const joh = { ok: false, titulo: 'Johnson', texto: '' };
    if (!ar.length) {
      const t = bucles ? 'Solo hay bucles. Conecta nodos distintos entre sí.' : 'Conecta algunos nodos para poder usarlo.';
      asig.texto = t;
      joh.texto = t;
      return { asig, joh };
    }
    const f = new Set(ar.map(a => a.de)).size;
    const c = new Set(ar.map(a => a.a)).size;
    asig.ok = true;
    asig.texto = f === c
      ? `Matriz de ${f} × ${c}: ya es cuadrada.`
      : `Matriz de ${f} × ${c}: no es cuadrada, así que al resolver se ${Math.abs(f - c) === 1 ? 'agrega una' : 'agregan ' + Math.abs(f - c)} ${f < c ? (Math.abs(f - c) === 1 ? 'fila ficticia' : 'filas ficticias') : (Math.abs(f - c) === 1 ? 'columna ficticia' : 'columnas ficticias')}.`;
    if (bucles) asig.texto += ` ${bucles === 1 ? 'El bucle no se usa' : 'Los bucles no se usan'}.`;
    const ciclo = buscarCiclo(g);
    if (ciclo) {
      joh.texto = `Hay un ciclo (${ciclo.map(id => nombre.get(id)).join(' → ')}). Johnson necesita una red donde las flechas siempre avancen.`;
    } else {
      joh.ok = true;
      const usados = new Set(ar.flatMap(a => [a.de, a.a]));
      const inicios = [...usados].filter(id => !ar.some(a => a.a === id)).map(id => nombre.get(id));
      const finales = [...usados].filter(id => !ar.some(a => a.de === id)).map(id => nombre.get(id));
      joh.texto = `Red sin ciclos: empieza en ${Algoritmos.lista(inicios)} y termina en ${Algoritmos.lista(finales)}.`;
      if (bucles) joh.texto += ` ${bucles === 1 ? 'El bucle se quitará' : 'Los bucles se quitarán'}.`;
    }
    return { asig, joh };
  }

  function dibujarEstado() {
    const { asig, joh } = evaluar(ed.obtener());
    const caja = e => `<div class="estado ${e.ok ? '' : 'no'}"><span class="material-symbols-rounded">${e.ok ? 'check' : 'block'}</span><div><b>${e.titulo}${e.ok ? '' : ': no disponible'}</b>${U.esc(e.texto)}</div></div>`;
    $('#g-estado').innerHTML = caja(asig) + caja(joh);
    const bA = $('#g-a-asignacion'), bJ = $('#g-a-johnson');
    bA.disabled = !asig.ok;
    bJ.disabled = !joh.ok;
    bA.title = asig.ok ? '' : asig.texto;
    bJ.title = joh.ok ? '' : joh.texto;
  }

  function dibujarPaneles() {
    dibujarMatriz();
    dibujarCardinalidad();
    dibujarEstado();
  }

  function aplicarMatriz() {
    const g = ed.obtener();
    const visibles = new Set();
    const nuevas = [];
    let malo = false;
    $('#g-matriz').querySelectorAll('input.celda').forEach(inp => {
      const de = g.nodos[+inp.dataset.i].id, a = g.nodos[+inp.dataset.j].id;
      visibles.add(de + '>' + a);
      const v = U.num(inp.value);
      if (v === null || v === 0) return;
      if (Number.isNaN(v)) { malo = true; return; }
      nuevas.push({ de, a, peso: v });
    });
    if (malo) return U.aviso('Hay celdas con valores que no son números');
    g.aristas.forEach(x => { if (!visibles.has(x.de + '>' + x.a)) nuevas.push(x); });
    ed.fijarAristas(nuevas);
    U.aviso('Matriz aplicada al grafo');
  }

  async function nuevoDesdeMatriz() {
    const r = await U.dialogo({
      titulo: 'Nuevo grafo desde matriz',
      texto: 'Se crea un grafo con la cantidad de nodos que indiques y sin conexiones. Después llena su matriz de adyacencia (fila = origen, columna = destino) y presiona «Aplicar matriz al grafo».',
      campos: [{ id: 'n', etiqueta: 'Cantidad de nodos', tipo: 'number', valor: '4' }],
      aceptar: 'Crear'
    });
    if (!r) return;
    const n = Math.round(U.num(r.n));
    if (!(n >= 1 && n <= MAXN)) return U.aviso(`Elige entre 1 y ${MAXN} nodos`);
    modoMatriz = 'pesos';
    vista = 'completa';
    ed.nuevo(n);
    $('#g-tarjeta-matriz').scrollIntoView({ behavior: 'smooth', block: 'start' });
    const primera = $('#g-matriz input.celda');
    if (primera) setTimeout(() => primera.focus({ preventScroll: true }), 400);
  }

  function enviar(destino) {
    const g = ed.obtener();
    const { asig, joh } = evaluar(g);
    const e = destino === 'asignacion' ? asig : joh;
    if (!e.ok) return U.aviso(e.texto);
    App.ir(destino);
    if (destino === 'asignacion') Asignacion.desdeGrafo(g);
    else Johnson.desdeGrafo(g);
  }

  async function guardarArchivo() {
    const r = await U.dialogo({
      titulo: 'Guardar grafo',
      texto: 'Se descargará un archivo .json que luego puedes abrir con el botón «Abrir».',
      campos: [{ id: 'nombre', etiqueta: 'Nombre del archivo', valor: 'grafo' }],
      aceptar: 'Descargar'
    });
    if (!r) return;
    U.descargarJSON(U.nombreArchivo(r.nombre, 'grafo') + '.json', { app: 'GrafoLab', version: 2, tipo: 'grafo', grafo: ed.obtener() });
  }

  async function exportarPNG() {
    if (ed.vacio()) return U.aviso('El grafo está vacío');
    const r = await U.dialogo({ titulo: 'Exportar imagen', campos: [{ id: 'nombre', etiqueta: 'Nombre del archivo', valor: 'grafo' }], aceptar: 'Descargar' });
    if (r) ed.exportarPNG(r.nombre);
  }

  function cargar(g) {
    if (!ed.cargar(g)) { U.aviso('El archivo no contiene un grafo válido'); return false; }
    return true;
  }

  function init() {
    ed = Editor.crear($('#g-editor'), { clave: 'grafolab.grafo', ejemplo, alCambiar: dibujarPaneles });
    $('#g-a-asignacion').addEventListener('click', () => enviar('asignacion'));
    $('#g-a-johnson').addEventListener('click', () => enviar('johnson'));
    $('#g-png').addEventListener('click', exportarPNG);
    $('#g-guardar').addEventListener('click', guardarArchivo);
    $('#g-abrir').addEventListener('click', () => App.abrirArchivo());
    $('#g-modo-matriz').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      modoMatriz = b.dataset.valor;
      dibujarMatriz();
    });
    $('#g-vista-matriz').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      vista = b.dataset.valor;
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
    dibujarPaneles();
  }

  return { init, mostrar: () => ed.mostrar(), cargar };
})();
