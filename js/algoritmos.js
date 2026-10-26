const Algoritmos = (() => {
  const EPS = 1e-9;
  const GRANDE = 1e9;
  const copia = m => m.map(f => f.slice());

  function fmt(v) {
    if (v === null || v === undefined || v === '') return '';
    if (!Number.isFinite(v) || Math.abs(v) >= GRANDE / 10) return '—';
    const r = Math.round(v * 10000) / 10000;
    return String(Object.is(r, -0) ? 0 : r);
  }

  function lista(x) {
    if (x.length <= 1) return x.join('');
    return x.slice(0, -1).join(', ') + ' y ' + x[x.length - 1];
  }

  function emparejar(Z) {
    const n = Z.length;
    const deCol = new Array(n).fill(-1);
    const intentar = (i, vis) => {
      for (let j = 0; j < n; j++) {
        if (Z[i][j] && !vis[j]) {
          vis[j] = true;
          if (deCol[j] < 0 || intentar(deCol[j], vis)) {
            deCol[j] = i;
            return true;
          }
        }
      }
      return false;
    };
    let tam = 0;
    for (let i = 0; i < n; i++) if (intentar(i, new Array(n).fill(false))) tam++;
    const deFila = new Array(n).fill(-1);
    deCol.forEach((i, j) => { if (i >= 0) deFila[i] = j; });
    return { deFila, deCol, tam };
  }

  function cubrir(Z, deFila, deCol) {
    const n = Z.length;
    const mf = deFila.map(j => j < 0);
    const mc = new Array(n).fill(false);
    let cambio = true;
    while (cambio) {
      cambio = false;
      for (let i = 0; i < n; i++) {
        if (!mf[i]) continue;
        for (let j = 0; j < n; j++) {
          if (Z[i][j] && !mc[j]) { mc[j] = true; cambio = true; }
        }
      }
      for (let j = 0; j < n; j++) {
        if (mc[j] && deCol[j] >= 0 && !mf[deCol[j]]) { mf[deCol[j]] = true; cambio = true; }
      }
    }
    return { lf: mf.map(v => !v), lc: mc };
  }

  function asignacion(C0, objetivo, etqF, etqC) {
    const f0 = C0.length, c0 = C0[0].length;
    const filasOk = [], colsOk = [];
    for (let i = 0; i < f0; i++) if (C0[i].some(v => Number.isFinite(v))) filasOk.push(i);
    for (let j = 0; j < c0; j++) if (C0.some(r => Number.isFinite(r[j]))) colsOk.push(j);
    if (!filasOk.length) return { error: 'La matriz no tiene ningún valor. Escribe al menos un costo.' };

    const eliminadasF = [], eliminadasC = [];
    for (let i = 0; i < f0; i++) if (!filasOk.includes(i)) eliminadasF.push(i);
    for (let j = 0; j < c0; j++) if (!colsOk.includes(j)) eliminadasC.push(j);

    const pasos = [];
    const vista0 = C0.map(r => r.map(v => Number.isFinite(v) ? v : Infinity));
    let texto0 = `La matriz tiene ${f0} ${f0 === 1 ? 'fila' : 'filas'} y ${c0} ${c0 === 1 ? 'columna' : 'columnas'}. Las celdas con «—» son asignaciones que no se pueden hacer.`;
    if (eliminadasF.length || eliminadasC.length) {
      const partes = [];
      if (eliminadasF.length) partes.push(`${eliminadasF.length === 1 ? 'la fila' : 'las filas'} ${lista(eliminadasF.map(i => etqF[i]))}`);
      if (eliminadasC.length) partes.push(`${eliminadasC.length === 1 ? 'la columna' : 'las columnas'} ${lista(eliminadasC.map(j => etqC[j]))}`);
      texto0 += ` Se eliminan ${partes.join(' y ')} porque no tienen ningún valor: no aportan nada a la asignación.`;
    } else {
      texto0 += ' Todas las filas y columnas tienen al menos un valor, así que no hay nada que eliminar.';
    }
    pasos.push({
      titulo: eliminadasF.length || eliminadasC.length ? 'Eliminar filas y columnas vacías' : 'Matriz inicial',
      texto: texto0,
      m: vista0,
      filas: etqF.slice(0, f0),
      cols: etqC.slice(0, c0),
      marcaF: C0.map((_, i) => eliminadasF.includes(i) ? 'eliminada' : ''),
      marcaC: C0[0].map((_, j) => eliminadasC.includes(j) ? 'eliminada' : '')
    });

    const f = filasOk.length, c = colsOk.length, n = Math.max(f, c);
    const filasIdx = filasOk.slice(), colsIdx = colsOk.slice();
    const filas = filasOk.map(i => etqF[i]), cols = colsOk.map(j => etqC[j]);
    for (let k = f; k < n; k++) { filasIdx.push(-1); filas.push(n - f > 1 ? `Ficticia ${k - f + 1}` : 'Ficticia'); }
    for (let k = c; k < n; k++) { colsIdx.push(-1); cols.push(n - c > 1 ? `Ficticia ${k - c + 1}` : 'Ficticia'); }

    const orig = [];
    for (let i = 0; i < n; i++) {
      orig.push([]);
      for (let j = 0; j < n; j++) {
        const fi = filasIdx[i], cj = colsIdx[j];
        if (fi < 0 || cj < 0) orig[i].push(0);
        else orig[i].push(Number.isFinite(C0[fi][cj]) ? C0[fi][cj] : Infinity);
      }
    }
    const marcaF = filasIdx.map(x => x < 0 ? 'ficticia' : '');
    const marcaC = colsIdx.map(x => x < 0 ? 'ficticia' : '');
    const ficticias = (n - f) + (n - c);

    if (ficticias) {
      const que = f < c ? (n - f === 1 ? 'una fila ficticia' : `${n - f} filas ficticias`) : (n - c === 1 ? 'una columna ficticia' : `${n - c} columnas ficticias`);
      const sentido = f < c
        ? 'Una fila ficticia es un agente que no existe: la tarea que reciba, en realidad, queda sin hacer.'
        : 'Una columna ficticia es una tarea que no existe: el agente que la reciba, en realidad, se queda sin tarea.';
      pasos.push({
        titulo: 'Completar con ficticias',
        texto: `Quedan ${f} ${f === 1 ? 'fila' : 'filas'} y ${c} ${c === 1 ? 'columna' : 'columnas'}. El método necesita una matriz cuadrada, así que se agrega ${que} con costo 0. ${sentido}`,
        m: copia(orig), filas, cols, marcaF, marcaC
      });
    }

    const finitos = orig.flat().filter(v => Number.isFinite(v));
    let m;
    if (objetivo === 'max') {
      const mayor = finitos.length ? Math.max(...finitos) : 0;
      m = orig.map(r => r.map(v => Number.isFinite(v) ? mayor - v : GRANDE));
      pasos.push({
        titulo: 'Convertir a minimización',
        texto: `El método húngaro siempre minimiza. Para maximizar se resta cada valor del mayor de la matriz (${fmt(mayor)}): así el mayor beneficio se convierte en el menor costo.`,
        m: copia(m), filas, cols, marcaF, marcaC
      });
    } else {
      m = orig.map(r => r.map(v => Number.isFinite(v) ? v : GRANDE));
    }

    const minF = m.map(r => Math.min(...r));
    m = m.map((r, i) => r.map(v => v - minF[i]));
    pasos.push({
      titulo: 'Reducción por filas',
      texto: 'A cada fila se le resta su menor valor, así cada fila tiene al menos un cero: ' + filas.map((x, i) => `${x} − ${fmt(minF[i])}`).join(', ') + '.',
      m: copia(m), filas, cols, marcaF, marcaC, ceros: true
    });

    const minC = cols.map((_, j) => Math.min(...m.map(r => r[j])));
    m = m.map(r => r.map((v, j) => v - minC[j]));
    pasos.push({
      titulo: 'Reducción por columnas',
      texto: 'A cada columna se le resta su menor valor, así cada columna también tiene un cero: ' + cols.map((x, j) => `${x} − ${fmt(minC[j])}`).join(', ') + '.',
      m: copia(m), filas, cols, marcaF, marcaC, ceros: true
    });

    let iter = 0, emp;
    while (true) {
      const Z = m.map(r => r.map(v => Math.abs(v) < EPS));
      emp = emparejar(Z);
      if (emp.tam === n || iter > 4 * n * n + 10) break;
      iter++;
      const { lf, lc } = cubrir(Z, emp.deFila, emp.deCol);
      pasos.push({
        titulo: `Cubrir los ceros · intento ${iter}`,
        texto: `Todos los ceros se pueden tapar con solo ${emp.tam} ${emp.tam === 1 ? 'línea' : 'líneas'} (las filas y columnas en negro). Como ${emp.tam} es menor que ${n}, todavía no se puede elegir un cero distinto para cada fila.`,
        m: copia(m), filas, cols, marcaF, marcaC, lf, lc, ceros: true
      });
      let k = Infinity;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!lf[i] && !lc[j]) k = Math.min(k, m[i][j]);
      m = m.map((r, i) => r.map((v, j) => (!lf[i] && !lc[j]) ? v - k : (lf[i] && lc[j]) ? v + k : v));
      pasos.push({
        titulo: `Ajustar · intento ${iter}`,
        texto: `El menor valor que quedó sin tapar es ${fmt(k)}. Se resta a todos los valores sin tapar y se suma a los que están tapados dos veces (cruce de líneas). Así aparecen ceros nuevos.`,
        m: copia(m), filas, cols, marcaF, marcaC, ceros: true
      });
    }

    const asign = emp.deFila.slice();
    pasos.push({
      titulo: 'Elegir la asignación',
      texto: `Ahora hacen falta ${n} líneas para tapar todos los ceros, así que se puede elegir un cero en cada fila sin repetir columna. Esos ceros (en negro) son la asignación óptima.`,
      m: copia(m), filas, cols, marcaF, marcaC, asign, ceros: true
    });

    const asignaciones = [];
    let total = 0, factible = emp.tam === n;
    asign.forEach((j, i) => {
      if (j < 0) return;
      const oi = filasIdx[i], oj = colsIdx[j];
      const real = oi >= 0 && oj >= 0;
      const v = orig[i][j];
      if (!Number.isFinite(v)) factible = false;
      else if (real) total += v;
      asignaciones.push({ i, j, oi, oj, fila: filas[i], col: cols[j], valor: v, ficticia: !real });
    });

    return {
      n, f, c, filas, cols, filasIdx, colsIdx, marcaF, marcaC, orig, pasos, asignaciones,
      total, factible, objetivo, asign, eliminadasF, eliminadasC, ficticias, iteraciones: iter
    };
  }

  function johnson(nombres, W, objetivo) {
    const n = nombres.length, max = objetivo === 'max';
    const nm = i => nombres[i];
    for (let i = 0; i < n; i++) {
      if (W[i][i] !== null) return { error: `Johnson no admite bucles. Quita la conexión de ${nm(i)} hacia sí mismo.` };
    }
    const pred = Array.from({ length: n }, () => []);
    const suc = Array.from({ length: n }, () => []);
    let arcos = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (W[i][j] !== null) { suc[i].push(j); pred[j].push(i); arcos++; }
      }
    }
    if (!arcos) return { error: 'La red no tiene actividades. Agrega al menos una conexión con su duración.' };

    const grado = pred.map(p => p.length);
    const cola = [];
    for (let i = 0; i < n; i++) if (!grado[i]) cola.push(i);
    const orden = [];
    while (cola.length) {
      const i = cola.shift();
      orden.push(i);
      for (const j of suc[i]) if (--grado[j] === 0) cola.push(j);
    }
    if (orden.length < n) return { error: 'La red tiene un ciclo: un camino que vuelve a un nodo por el que ya pasó. Johnson necesita una red sin ciclos, donde las actividades siempre avancen.' };

    const te = new Array(n).fill(0), ida = [];
    for (const j of orden) {
      if (!pred[j].length) { ida.push(`TE(${nm(j)}) = 0      ← nodo inicial`); continue; }
      const cand = pred[j].map(i => te[i] + W[i][j]);
      te[j] = max ? Math.max(...cand) : Math.min(...cand);
      const partes = pred[j].map(i => `${fmt(te[i])} + ${fmt(W[i][j])}`);
      if (pred[j].length === 1) {
        const i = pred[j][0];
        ida.push(`TE(${nm(j)}) = TE(${nm(i)}) + ${fmt(W[i][j])} = ${partes[0]} = ${fmt(te[j])}`);
      } else {
        ida.push(`TE(${nm(j)}) = ${max ? 'máx' : 'mín'}(${partes.join(', ')}) = ${fmt(te[j])}`);
      }
    }

    const finales = orden.filter(i => !suc[i].length);
    const fin = Math.max(...finales.map(i => te[i]));
    const tl = new Array(n).fill(0), vuelta = [];
    for (const i of orden.slice().reverse()) {
      if (!suc[i].length) {
        tl[i] = max ? fin : te[i];
        vuelta.push(`TL(${nm(i)}) = ${fmt(tl[i])}      ← nodo final`);
        continue;
      }
      const cand = suc[i].map(j => tl[j] - W[i][j]);
      tl[i] = max ? Math.min(...cand) : Math.max(...cand);
      const partes = suc[i].map(j => `${fmt(tl[j])} − ${fmt(W[i][j])}`);
      if (suc[i].length === 1) {
        const j = suc[i][0];
        vuelta.push(`TL(${nm(i)}) = TL(${nm(j)}) − ${fmt(W[i][j])} = ${partes[0]} = ${fmt(tl[i])}`);
      } else {
        vuelta.push(`TL(${nm(i)}) = ${max ? 'mín' : 'máx'}(${partes.join(', ')}) = ${fmt(tl[i])}`);
      }
    }

    const nodos = nombres.map((x, i) => {
      const h = max ? tl[i] - te[i] : te[i] - tl[i];
      return { i, nombre: x, te: te[i], tl: tl[i], h, critico: Math.abs(h) < EPS };
    });

    const actividades = [], holguras = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (W[i][j] === null) continue;
        const w = W[i][j];
        const h = max ? tl[j] - te[i] - w : te[i] + w - tl[j];
        actividades.push({ i, j, de: nm(i), a: nm(j), w, te: te[i], tl: tl[j], h, critica: Math.abs(h) < EPS });
        holguras.push(max
          ? `h(${nm(i)}→${nm(j)}) = TL(${nm(j)}) − TE(${nm(i)}) − ${fmt(w)} = ${fmt(tl[j])} − ${fmt(te[i])} − ${fmt(w)} = ${fmt(h)}`
          : `h(${nm(i)}→${nm(j)}) = TE(${nm(i)}) + ${fmt(w)} − TL(${nm(j)}) = ${fmt(te[i])} + ${fmt(w)} − ${fmt(tl[j])} = ${fmt(h)}`);
      }
    }

    const crit = new Set(actividades.filter(a => a.critica).map(a => a.i + '>' + a.j));
    const rutas = [];
    const dfs = (i, camino, largo) => {
      if (rutas.length >= 20) return;
      const sig = suc[i].filter(j => crit.has(i + '>' + j));
      if (!sig.length) {
        if (!suc[i].length) rutas.push({ nodos: camino.map(nm), valor: largo });
        return;
      }
      for (const j of sig) dfs(j, [...camino, j], largo + W[i][j]);
    };
    orden.filter(i => !pred[i].length && nodos[i].critico).forEach(i => dfs(i, [i], 0));

    const valor = max ? fin : (rutas.length ? Math.min(...rutas.map(r => r.valor)) : Math.min(...finales.map(i => te[i])));
    return { nodos, actividades, rutas, valor, ida, vuelta, holguras, objetivo };
  }

  return { fmt, lista, asignacion, johnson, GRANDE };
})();

if (typeof module !== 'undefined') module.exports = Algoritmos;
