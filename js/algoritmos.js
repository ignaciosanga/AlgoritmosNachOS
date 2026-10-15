const Algoritmos = (() => {
  const EPS = 1e-9;
  const GRANDE = 1e9;
  const copia = m => m.map(f => f.slice());

  function fmt(v) {
    if (v === null || v === undefined || v === '') return '';
    if (!Number.isFinite(v) || Math.abs(v) >= GRANDE / 10) return 'M';
    const r = Math.round(v * 10000) / 10000;
    return String(Object.is(r, -0) ? 0 : r);
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
    const f = C0.length, c = C0[0].length, n = Math.max(f, c);
    const filas = etqF.slice(0, f), cols = etqC.slice(0, c);
    for (let i = f; i < n; i++) filas.push('Fic' + (i - f + 1));
    for (let j = c; j < n; j++) cols.push('Fic' + (j - c + 1));
    const orig = [];
    for (let i = 0; i < n; i++) {
      orig.push([]);
      for (let j = 0; j < n; j++) orig[i].push(i < f && j < c ? C0[i][j] : 0);
    }
    const finitos = orig.flat().filter(v => Number.isFinite(v));
    const pasos = [];
    pasos.push({
      titulo: 'Matriz inicial',
      texto: f !== c
        ? `La matriz era de ${f} × ${c}; se completó con ${f < c ? 'filas' : 'columnas'} ficticias de valor 0 para hacerla cuadrada.`
        : `Matriz cuadrada de ${n} × ${n}.`,
      m: copia(orig)
    });

    let m;
    if (objetivo === 'max') {
      const mayor = finitos.length ? Math.max(...finitos) : 0;
      m = orig.map(r => r.map(v => Number.isFinite(v) ? mayor - v : GRANDE));
      pasos.push({
        titulo: 'Convertir a minimización',
        texto: `Para maximizar se resta cada valor del mayor de la matriz (${fmt(mayor)}). Así el mayor beneficio pasa a ser el menor costo.`,
        m: copia(m)
      });
    } else {
      m = orig.map(r => r.map(v => Number.isFinite(v) ? v : GRANDE));
    }

    const minF = m.map(r => Math.min(...r));
    m = m.map((r, i) => r.map(v => v - minF[i]));
    pasos.push({
      titulo: 'Reducción por filas',
      texto: 'Se resta a cada fila su menor valor: ' + filas.map((x, i) => `${x} → ${fmt(minF[i])}`).join(', ') + '.',
      m: copia(m),
      ceros: true
    });

    const minC = cols.map((_, j) => Math.min(...m.map(r => r[j])));
    m = m.map(r => r.map((v, j) => v - minC[j]));
    pasos.push({
      titulo: 'Reducción por columnas',
      texto: 'Se resta a cada columna su menor valor: ' + cols.map((x, j) => `${x} → ${fmt(minC[j])}`).join(', ') + '.',
      m: copia(m),
      ceros: true
    });

    let iter = 0, emp;
    while (true) {
      const Z = m.map(r => r.map(v => Math.abs(v) < EPS));
      emp = emparejar(Z);
      if (emp.tam === n || iter > 4 * n * n + 10) break;
      iter++;
      const { lf, lc } = cubrir(Z, emp.deFila, emp.deCol);
      pasos.push({
        titulo: `Cubrir ceros · iteración ${iter}`,
        texto: `Todos los ceros se cubren con ${emp.tam} líneas. Como ${emp.tam} < ${n}, todavía no hay una asignación óptima.`,
        m: copia(m), lf, lc, ceros: true
      });
      let k = Infinity;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (!lf[i] && !lc[j]) k = Math.min(k, m[i][j]);
      m = m.map((r, i) => r.map((v, j) => (!lf[i] && !lc[j]) ? v - k : (lf[i] && lc[j]) ? v + k : v));
      pasos.push({
        titulo: `Ajuste · iteración ${iter}`,
        texto: `El menor valor no cubierto es ${fmt(k)}. Se resta a todos los valores no cubiertos y se suma en las intersecciones de dos líneas.`,
        m: copia(m),
        ceros: true
      });
    }

    const asign = emp.deFila.slice();
    pasos.push({
      titulo: 'Asignación óptima',
      texto: `Se necesitan ${n} líneas para cubrir todos los ceros, así que se puede elegir un cero independiente por cada fila y columna.`,
      m: copia(m),
      asign,
      ceros: true
    });

    const asignaciones = [];
    let total = 0, factible = emp.tam === n;
    asign.forEach((j, i) => {
      if (j < 0) return;
      const real = i < f && j < c;
      const v = orig[i][j];
      if (!Number.isFinite(v)) factible = false;
      else if (real) total += v;
      asignaciones.push({ i, j, fila: filas[i], col: cols[j], valor: v, ficticia: !real });
    });

    return { n, f, c, filas, cols, orig, pasos, asignaciones, total, factible, objetivo, asign };
  }

  function johnson(nombres, W, objetivo) {
    const n = nombres.length, max = objetivo === 'max';
    const nm = i => nombres[i];
    for (let i = 0; i < n; i++) {
      if (W[i][i] !== null) return { error: `Johnson no admite bucles. Deja vacía la celda ${nm(i)} → ${nm(i)}.` };
    }
    const pred = Array.from({ length: n }, () => []);
    const suc = Array.from({ length: n }, () => []);
    let arcos = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (W[i][j] !== null) { suc[i].push(j); pred[j].push(i); arcos++; }
      }
    }
    if (!arcos) return { error: 'La matriz no tiene conexiones. Escribe la duración de al menos una actividad.' };

    const grado = pred.map(p => p.length);
    const cola = [];
    for (let i = 0; i < n; i++) if (!grado[i]) cola.push(i);
    const orden = [];
    while (cola.length) {
      const i = cola.shift();
      orden.push(i);
      for (const j of suc[i]) if (--grado[j] === 0) cola.push(j);
    }
    if (orden.length < n) return { error: 'La red tiene un ciclo (un camino que regresa a un nodo anterior). Johnson necesita una red sin ciclos.' };

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

  return { fmt, asignacion, johnson, GRANDE };
})();

if (typeof module !== 'undefined') module.exports = Algoritmos;