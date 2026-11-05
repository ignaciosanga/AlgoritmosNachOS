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
        texto: `Todos los ceros se pueden tapar con solo ${emp.tam} ${emp.tam === 1 ? 'línea' : 'líneas'} (las filas y columnas en azul). Como ${emp.tam} es menor que ${n}, todavía no se puede elegir un cero distinto para cada fila.`,
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
      texto: `Ahora hacen falta ${n} líneas para tapar todos los ceros, así que se puede elegir un cero en cada fila sin repetir columna. Esos ceros (en verde) son la asignación óptima.`,
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
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (W[i][j] !== null && W[j][i] !== null) {
        return { error: `Johnson no permite conexiones de ida y vuelta: hay una actividad de ${nm(i)} → ${nm(j)} (duración ${fmt(W[i][j])}) y otra de ${nm(j)} → ${nm(i)} (duración ${fmt(W[j][i])}). Eso es un ciclo, y en una red de actividades el tiempo siempre avanza. Deja solo la que va hacia adelante.` };
      }
    }

    const grado = pred.map(p => p.length);
    const cola = [];
    for (let i = 0; i < n; i++) if (!grado[i]) cola.push(i);
    const orden = [];
    while (cola.length) {
      const i = cola.shift();
      orden.push(i);
      for (const j of suc[i]) if (--grado[j] === 0) cola.push(j);
    }
    if (orden.length < n) {
      const resto = new Set([...Array(n).keys()].filter(i => !orden.includes(i)));
      let x = [...resto][0];
      const visto = [];
      while (!visto.includes(x)) { visto.push(x); x = pred[x].find(p => resto.has(p)); }
      const ciclo = visto.slice(visto.indexOf(x)).reverse();
      ciclo.push(ciclo[0]);
      return { error: `La red tiene un ciclo: ${ciclo.map(nm).join(' → ')}. Ese camino vuelve a un nodo por el que ya pasó. Johnson necesita una red sin ciclos, donde las actividades siempre avancen: quita una de esas conexiones.` };
    }

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
    return { nodos, actividades, rutas, valor, ida, vuelta, holguras, objetivo, orden, pred, suc, te, tl };
  }

  const suma = l => l.reduce((s, v) => s + v, 0);
  const copiaX = X => X.map(r => r.slice());

  function cicloTransporte(X, p, q) {
    const m = X.length, n = X[0].length;
    const ady = Array.from({ length: m + n }, () => []);
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
      if (X[i][j] === null) continue;
      ady[i].push({ a: m + j, i, j });
      ady[m + j].push({ a: i, i, j });
    }
    const ini = m + q, fin = p;
    const prev = new Array(m + n).fill(null);
    const vis = new Array(m + n).fill(false);
    vis[ini] = true;
    const cola = [ini];
    while (cola.length) {
      const x = cola.shift();
      if (x === fin) break;
      for (const e of ady[x]) {
        if (vis[e.a]) continue;
        vis[e.a] = true;
        prev[e.a] = { de: x, celda: { i: e.i, j: e.j } };
        cola.push(e.a);
      }
    }
    if (!vis[fin]) return null;
    const celdas = [];
    let x = fin;
    while (x !== ini) { celdas.unshift(prev[x].celda); x = prev[x].de; }
    return [{ i: p, j: q }, ...celdas];
  }

  function transporte(C0, oferta0, demanda0, objetivo, etqF, etqC) {
    const max = objetivo === 'max';
    const C = C0.map(r => r.slice());
    const oferta = oferta0.slice(), demanda = demanda0.slice();
    const filas = etqF.slice(), cols = etqC.slice();
    const tO = suma(oferta), tD = suma(demanda);
    if (tO <= 0 || tD <= 0) return { error: 'La oferta total y la demanda total deben ser mayores que 0.' };
    const balanceo = { tO, tD, tipo: null, cantidad: 0 };
    if (tO - tD > EPS) {
      C.forEach(r => r.push(0));
      demanda.push(tO - tD);
      cols.push('Ficticia');
      Object.assign(balanceo, { tipo: 'columna', cantidad: tO - tD });
    } else if (tD - tO > EPS) {
      C.push(cols.map(() => 0));
      oferta.push(tD - tO);
      filas.push('Ficticia');
      Object.assign(balanceo, { tipo: 'fila', cantidad: tD - tO });
    }
    const m = filas.length, n = cols.length;
    const ficF = balanceo.tipo === 'fila' ? m - 1 : -1;
    const ficC = balanceo.tipo === 'columna' ? n - 1 : -1;

    const X = Array.from({ length: m }, () => new Array(n).fill(null));
    const s = oferta.slice(), d = demanda.slice();
    const pasos = [];
    let i = 0, j = 0;
    while (i < m && j < n) {
      const ci = i, cj = j;
      const antesS = s[i], antesD = d[j];
      const q = Math.min(s[i], d[j]);
      X[i][j] = q;
      s[i] -= q;
      d[j] -= q;
      if (Math.abs(s[i]) < EPS) s[i] = 0;
      if (Math.abs(d[j]) < EPS) d[j] = 0;
      const ultima = i === m - 1 && j === n - 1;
      const filaOk = s[i] === 0, colOk = d[j] === 0;
      let mov, cero = null;
      let texto = `Celda ${filas[i]} → ${cols[j]}: a ${filas[i]} le quedan ${fmt(antesS)} de oferta y ${cols[j]} necesita ${fmt(antesD)}. Se asignan ${fmt(q)}, el menor de los dos.`;
      if (ultima) {
        mov = 'fin';
        texto += ' Era la última celda: toda la oferta y la demanda quedaron repartidas.';
      } else if (filaOk && colOk) {
        mov = 'diagonal';
        cero = { i, j: j + 1 };
        X[i][j + 1] = 0;
        texto += ` ${filas[i]} y ${cols[j]} se agotan a la vez (caso degenerado): se anota un 0 en ${filas[i]} → ${cols[j + 1]} y se avanza en diagonal.`;
        i++;
        j++;
      } else if (colOk) {
        mov = 'derecha';
        texto += ` La demanda de ${cols[j]} quedó cubierta: se avanza a la derecha.`;
        j++;
      } else {
        mov = 'abajo';
        texto += ` La oferta de ${filas[i]} se agotó: se baja a la siguiente fila.`;
        i++;
      }
      pasos.push({ X: copiaX(X), i: ci, j: cj, q, s: s.slice(), d: d.slice(), mov, cero, texto });
      if (mov === 'fin') break;
    }
    const costo = Y => {
      let t = 0;
      for (let a = 0; a < m; a++) for (let b = 0; b < n; b++) if (Y[a][b]) t += Y[a][b] * C[a][b];
      return t;
    };
    const inicial = copiaX(X);
    const costoInicial = costo(inicial);

    const iteraciones = [];
    const Y = copiaX(X);
    for (let it = 0; it < 60; it++) {
      const u = new Array(m).fill(null), v = new Array(n).fill(null);
      u[0] = 0;
      let cambio = true;
      while (cambio) {
        cambio = false;
        for (let a = 0; a < m; a++) for (let b = 0; b < n; b++) {
          if (Y[a][b] === null) continue;
          if (u[a] !== null && v[b] === null) { v[b] = C[a][b] - u[a]; cambio = true; }
          else if (v[b] !== null && u[a] === null) { u[a] = C[a][b] - v[b]; cambio = true; }
        }
        if (!cambio && (u.includes(null) || v.includes(null))) {
          const k = u.indexOf(null);
          if (k >= 0) u[k] = 0; else v[v.indexOf(null)] = 0;
          cambio = true;
        }
      }
      const Rd = Array.from({ length: m }, () => new Array(n).fill(null));
      let mejor = null;
      for (let a = 0; a < m; a++) for (let b = 0; b < n; b++) {
        if (Y[a][b] !== null) continue;
        const r = C[a][b] - u[a] - v[b];
        Rd[a][b] = Math.abs(r) < EPS ? 0 : r;
        const mejora = max ? r > EPS : r < -EPS;
        if (mejora && (mejor === null || (max ? r > mejor.r : r < mejor.r))) mejor = { i: a, j: b, r };
      }
      const registro = { X: copiaX(Y), u: u.slice(), v: v.slice(), R: Rd, costo: costo(Y) };
      if (!mejor) { registro.optimo = true; iteraciones.push(registro); break; }
      const ciclo = cicloTransporte(Y, mejor.i, mejor.j);
      if (!ciclo) { registro.optimo = true; registro.atascado = true; iteraciones.push(registro); break; }
      const menos = ciclo.filter((_, k) => k % 2 === 1);
      const theta = Math.min(...menos.map(c => Y[c.i][c.j]));
      const sale = menos.find(c => Math.abs(Y[c.i][c.j] - theta) < EPS);
      Object.assign(registro, { entra: mejor, ciclo, theta, sale });
      iteraciones.push(registro);
      Y[mejor.i][mejor.j] = 0;
      ciclo.forEach((c, k) => { Y[c.i][c.j] += k % 2 === 0 ? theta : -theta; if (Math.abs(Y[c.i][c.j]) < EPS) Y[c.i][c.j] = 0; });
      Y[sale.i][sale.j] = null;
    }
    const final = iteraciones[iteraciones.length - 1].X;
    return {
      filas, cols, C, oferta, demanda, balanceo, ficF, ficC, pasos, inicial, costoInicial,
      iteraciones, final, costoFinal: costo(final), objetivo
    };
  }

  const PSEUDO = {
    burbuja: [
      'para i ← 0 hasta n − 2',
      '  para j ← 0 hasta n − 2 − i',
      '    si a[j] {>} a[j+1]',
      '      intercambiar a[j] y a[j+1]',
      '  a[n − 1 − i] ya quedó en su lugar',
      '  si no hubo intercambios: terminar'
    ],
    seleccion: [
      'para i ← 0 hasta n − 2',
      '  pos ← i',
      '  para j ← i + 1 hasta n − 1',
      '    si a[j] {<} a[pos]: pos ← j',
      '  intercambiar a[i] y a[pos]'
    ],
    insercion: [
      'para i ← 1 hasta n − 1',
      '  j ← i',
      '  mientras j > 0 y a[j−1] {>} a[j]',
      '    intercambiar a[j−1] y a[j]',
      '    j ← j − 1'
    ],
    shell: [
      'gap ← n / 2',
      'mientras gap > 0',
      '  para i ← gap hasta n − 1',
      '    j ← i',
      '    mientras j ≥ gap y a[j−gap] {>} a[j]',
      '      intercambiar a[j−gap] y a[j];  j ← j − gap',
      '  gap ← gap / 2'
    ],
    merge: [
      'mergeSort(izq, der)',
      '  si izq ≥ der: volver',
      '  medio ← (izq + der) / 2',
      '  mergeSort(izq, medio);  mergeSort(medio + 1, der)',
      '  comparar el primero de cada mitad',
      '  pasar el {menor} al resultado',
      '  copiar el resultado en a[izq..der]'
    ],
    quick: [
      'quickSort(izq, der)',
      '  si izq ≥ der: volver',
      '  pivote ← a[der];  i ← izq − 1',
      '  para j ← izq hasta der − 1',
      '    si a[j] {<} pivote: i ← i + 1; intercambiar a[i] y a[j]',
      '  intercambiar a[i + 1] y a[der]   (pivote en su lugar)',
      '  quickSort(izq, i);  quickSort(i + 2, der)'
    ]
  };

  function ordenar(algoritmo, datos, orden) {
    const asc = orden !== 'desc';
    const a = datos.slice();
    const n = a.length;
    const op = asc ? '>' : '<';
    const antes = (x, y) => asc ? x < y : x > y;
    const despues = (x, y) => antes(y, x);
    const final = new Set();
    let comp = 0, inter = 0;
    const frames = [];
    const foto = (extra) => frames.push({
      a: a.slice(), comp, inter, ord: [...final],
      comparar: null, cambio: null, pivote: null, rango: null, parcial: null, marca: null, linea: null, texto: '',
      ...extra
    });
    const swap = (i, j) => { const t = a[i]; a[i] = a[j]; a[j] = t; inter++; };

    foto({ texto: `Lista inicial de ${n} ${n === 1 ? 'número' : 'números'}. Presiona ▶ para ver cómo se ordena.` });

    if (algoritmo === 'burbuja') {
      for (let i = 0; i < n - 1; i++) {
        let hubo = false;
        for (let j = 0; j < n - 1 - i; j++) {
          comp++;
          const sw = despues(a[j], a[j + 1]);
          foto({ comparar: [j, j + 1], linea: 2, texto: sw ? `Comparamos ${a[j]} y ${a[j + 1]}: ${a[j]} ${op} ${a[j + 1]}, están al revés.` : `Comparamos ${a[j]} y ${a[j + 1]}: ya están en orden.` });
          if (sw) {
            swap(j, j + 1);
            hubo = true;
            foto({ cambio: [j, j + 1], linea: 3, texto: `Se intercambian: ahora ${a[j]} va antes que ${a[j + 1]}.` });
          }
        }
        final.add(n - 1 - i);
        foto({ linea: 4, texto: `Fin de la pasada ${i + 1}: el ${asc ? 'mayor' : 'menor'} que quedaba (${a[n - 1 - i]}) «burbujeó» hasta su lugar final.` });
        if (!hubo) {
          for (let k = 0; k < n; k++) final.add(k);
          foto({ linea: 5, texto: 'En esta pasada no hubo ningún intercambio: la lista ya está ordenada y el algoritmo termina antes.' });
          break;
        }
      }
    } else if (algoritmo === 'seleccion') {
      for (let i = 0; i < n - 1; i++) {
        let pos = i;
        foto({ marca: pos, linea: 1, texto: `Buscamos el ${asc ? 'menor' : 'mayor'} desde la posición ${i + 1}. Por ahora es ${a[pos]}.` });
        for (let j = i + 1; j < n; j++) {
          comp++;
          const mejor = antes(a[j], a[pos]);
          foto({ comparar: [pos, j], marca: pos, linea: 3, texto: mejor ? `${a[j]} es ${asc ? 'menor' : 'mayor'} que ${a[pos]}: es el nuevo candidato.` : `${a[j]} no es ${asc ? 'menor' : 'mayor'} que ${a[pos]}.` });
          if (mejor) pos = j;
        }
        if (pos !== i) {
          swap(i, pos);
          foto({ cambio: [i, pos], linea: 4, texto: `El ${asc ? 'menor' : 'mayor'} encontrado (${a[i]}) se intercambia con la posición ${i + 1}.` });
        } else {
          foto({ marca: i, linea: 4, texto: `${a[i]} ya estaba en su lugar: no hace falta intercambiar.` });
        }
        final.add(i);
      }
      final.add(n - 1);
    } else if (algoritmo === 'insercion') {
      for (let i = 1; i < n; i++) {
        foto({ marca: i, parcial: [0, i - 1], linea: 0, texto: `Tomamos ${a[i]} y lo insertamos en la parte ya ordenada (a su izquierda).` });
        let j = i;
        while (j > 0) {
          comp++;
          const sw = despues(a[j - 1], a[j]);
          foto({ comparar: [j - 1, j], parcial: [0, i], linea: 2, texto: sw ? `${a[j - 1]} ${op} ${a[j]}: ${a[j]} todavía debe ir más a la izquierda.` : `${a[j - 1]} no ${op === '>' ? 'es mayor que' : 'es menor que'} ${a[j]}: ${a[j]} ya está en su sitio.` });
          if (!sw) break;
          swap(j - 1, j);
          foto({ cambio: [j - 1, j], parcial: [0, i], linea: 3, texto: `Se intercambian ${a[j]} y ${a[j - 1]}.` });
          j--;
        }
      }
      for (let k = 0; k < n; k++) final.add(k);
    } else if (algoritmo === 'shell') {
      let gap = Math.floor(n / 2);
      while (gap > 0) {
        foto({ linea: 1, texto: `Ahora se comparan elementos separados por una distancia (gap) de ${gap}.`, gap });
        for (let i = gap; i < n; i++) {
          let j = i;
          while (j >= gap) {
            comp++;
            const sw = despues(a[j - gap], a[j]);
            foto({ comparar: [j - gap, j], linea: 4, gap, texto: sw ? `Distancia ${gap}: ${a[j - gap]} ${op} ${a[j]}, se intercambian.` : `Distancia ${gap}: ${a[j - gap]} y ${a[j]} están en orden.` });
            if (!sw) break;
            swap(j - gap, j);
            foto({ cambio: [j - gap, j], linea: 5, gap, texto: `Intercambiados. Los elementos lejanos se acercan rápido a su zona.` });
            j -= gap;
          }
        }
        gap = Math.floor(gap / 2);
      }
      for (let k = 0; k < n; k++) final.add(k);
    } else if (algoritmo === 'merge') {
      const rec = (l, r) => {
        if (l >= r) return;
        const m = Math.floor((l + r) / 2);
        foto({ rango: [l, r], linea: 2, texto: `Dividimos las posiciones ${l + 1} a ${r + 1} en dos mitades: ${l + 1}–${m + 1} y ${m + 2}–${r + 1}.` });
        rec(l, m);
        rec(m + 1, r);
        const res = [];
        let p = l, q = m + 1;
        while (p <= m && q <= r) {
          comp++;
          const tomaIzq = !despues(a[p], a[q]);
          foto({ comparar: [p, q], rango: [l, r], linea: 4, texto: `Mezclamos: comparamos ${a[p]} (mitad izquierda) con ${a[q]} (mitad derecha). Pasa ${tomaIzq ? a[p] : a[q]}.` });
          res.push(tomaIzq ? a[p++] : a[q++]);
        }
        while (p <= m) res.push(a[p++]);
        while (q <= r) res.push(a[q++]);
        for (let k = 0; k < res.length; k++) {
          a[l + k] = res[k];
          inter++;
          foto({ cambio: [l + k, l + k], rango: [l, r], linea: 6, texto: `Copiamos ${res[k]} en la posición ${l + k + 1}.` });
        }
        foto({ parcial: [l, r], rango: [l, r], linea: 6, texto: `Las posiciones ${l + 1} a ${r + 1} quedaron ordenadas.` });
      };
      rec(0, n - 1);
      for (let k = 0; k < n; k++) final.add(k);
    } else if (algoritmo === 'quick') {
      const rec = (l, r) => {
        if (l > r) return;
        if (l === r) { final.add(l); foto({ linea: 1, rango: [l, r], texto: `${a[l]} está solo en su parte: ya está en su lugar.` }); return; }
        const piv = a[r];
        foto({ pivote: r, rango: [l, r], linea: 2, texto: `Elegimos como pivote el último de la parte: ${piv}. Los que vayan antes que él irán a su izquierda.` });
        let i = l - 1;
        for (let j = l; j < r; j++) {
          comp++;
          const va = antes(a[j], piv);
          foto({ comparar: [j, r], pivote: r, rango: [l, r], linea: 4, texto: va ? `${a[j]} va antes que el pivote ${piv}: lo pasamos a la zona izquierda.` : `${a[j]} no va antes que ${piv}: se queda a la derecha.` });
          if (va) {
            i++;
            if (i !== j) {
              swap(i, j);
              foto({ cambio: [i, j], pivote: r, rango: [l, r], linea: 4, texto: `Intercambiamos ${a[j]} y ${a[i]}.` });
            }
          }
        }
        if (i + 1 !== r) swap(i + 1, r);
        final.add(i + 1);
        foto({ cambio: [i + 1, r], pivote: i + 1, rango: [l, r], linea: 5, texto: `El pivote ${piv} pasa a la posición ${i + 2}: todo lo de su izquierda va antes y todo lo de su derecha va después. Ya está en su lugar final.` });
        rec(l, i);
        rec(i + 2, r);
      };
      rec(0, n - 1);
    }
    for (let k = 0; k < n; k++) final.add(k);
    foto({ texto: `¡Lista ordenada! Se hicieron ${comp} comparaciones y ${inter} ${algoritmo === 'merge' ? 'copias' : 'intercambios'}.`, fin: true });
    return { frames, pseudo: PSEUDO[algoritmo].map(l => l.replace('{>}', op).replace('{<}', asc ? '<' : '>').replace('{menor}', asc ? 'menor' : 'mayor')), resultado: a };
  }

  const Arbol = (() => {
    const nuevo = v => ({ v, i: null, d: null });

    function insertar(raiz, v) {
      const camino = [];
      if (!raiz) return { raiz: nuevo(v), camino, nuevo: true };
      let x = raiz;
      while (true) {
        camino.push({ v: x.v, dir: v < x.v ? 'izq' : (v > x.v ? 'der' : 'igual') });
        if (v === x.v) return { raiz, camino, repetido: true };
        if (v < x.v) {
          if (!x.i) { x.i = nuevo(v); break; }
          x = x.i;
        } else {
          if (!x.d) { x.d = nuevo(v); break; }
          x = x.d;
        }
      }
      return { raiz, camino, nuevo: true };
    }

    function buscar(raiz, v) {
      const camino = [];
      let x = raiz;
      while (x) {
        camino.push({ v: x.v, dir: v < x.v ? 'izq' : (v > x.v ? 'der' : 'igual') });
        if (v === x.v) return { camino, encontrado: true };
        x = v < x.v ? x.i : x.d;
      }
      return { camino, encontrado: false };
    }

    function minimo(x) {
      while (x.i) x = x.i;
      return x;
    }

    function eliminar(raiz, v) {
      const { camino, encontrado } = buscar(raiz, v);
      if (!encontrado) return { raiz, camino, encontrado: false };
      let caso = null;
      const rec = (x, val) => {
        if (!x) return null;
        if (val < x.v) { x.i = rec(x.i, val); return x; }
        if (val > x.v) { x.d = rec(x.d, val); return x; }
        if (!x.i && !x.d) { caso = caso || { tipo: 'hoja' }; return null; }
        if (!x.i || !x.d) { caso = caso || { tipo: 'uno', hijo: (x.i || x.d).v }; return x.i || x.d; }
        const s = minimo(x.d);
        caso = caso || { tipo: 'dos', sucesor: s.v };
        x.v = s.v;
        x.d = rec(x.d, s.v);
        return x;
      };
      const r = rec(raiz, v);
      return { raiz: r, camino, encontrado: true, caso };
    }

    function recorrido(raiz, tipo) {
      const res = [];
      if (tipo === 'niveles') {
        const cola = raiz ? [raiz] : [];
        while (cola.length) {
          const x = cola.shift();
          res.push(x.v);
          if (x.i) cola.push(x.i);
          if (x.d) cola.push(x.d);
        }
        return res;
      }
      const rec = x => {
        if (!x) return;
        if (tipo === 'pre') res.push(x.v);
        rec(x.i);
        if (tipo === 'in') res.push(x.v);
        rec(x.d);
        if (tipo === 'post') res.push(x.v);
      };
      rec(raiz);
      return res;
    }

    function altura(x) {
      return x ? 1 + Math.max(altura(x.i), altura(x.d)) : 0;
    }

    function contar(x) {
      return x ? 1 + contar(x.i) + contar(x.d) : 0;
    }

    function hojas(x) {
      if (!x) return 0;
      if (!x.i && !x.d) return 1;
      return hojas(x.i) + hojas(x.d);
    }

    function esBST(x, lo = -Infinity, hi = Infinity) {
      if (!x) return true;
      if (!(x.v > lo && x.v < hi)) return false;
      return esBST(x.i, lo, x.v) && esBST(x.d, x.v, hi);
    }

    function reconstruir(ino, otro, tipo) {
      if (!ino.length) return { error: 'Escribe al menos un valor en el inorden.' };
      if (ino.length !== otro.length) return { error: `El inorden tiene ${ino.length} valores y el ${tipo === 'pre' ? 'preorden' : 'postorden'} tiene ${otro.length}. Deben tener la misma cantidad.` };
      if (new Set(ino).size !== ino.length) return { error: 'Hay valores repetidos. Para reconstruir el árbol, cada valor debe aparecer una sola vez.' };
      const a = [...ino].sort((x, y) => x - y).join(','), b = [...otro].sort((x, y) => x - y).join(',');
      if (a !== b) return { error: 'Los dos recorridos no tienen los mismos valores.' };
      const pos = new Map(ino.map((v, k) => [v, k]));
      const pasos = [];
      let p = tipo === 'pre' ? 0 : otro.length - 1;
      const rec = (lo, hi, nivel) => {
        if (lo > hi) return null;
        const v = otro[tipo === 'pre' ? p++ : p--];
        const k = pos.get(v);
        if (k < lo || k > hi) throw new Error('inconsistente');
        pasos.push({ v, izq: ino.slice(lo, k), der: ino.slice(k + 1, hi + 1), nivel });
        const x = nuevo(v);
        if (tipo === 'pre') { x.i = rec(lo, k - 1, nivel + 1); x.d = rec(k + 1, hi, nivel + 1); }
        else { x.d = rec(k + 1, hi, nivel + 1); x.i = rec(lo, k - 1, nivel + 1); }
        return x;
      };
      let raiz;
      try { raiz = rec(0, ino.length - 1, 0); } catch (e) { return { error: 'Los recorridos no corresponden a un mismo árbol. Revisa el orden de los valores.' }; }
      if (recorrido(raiz, 'in').join(',') !== ino.join(',') || recorrido(raiz, tipo).join(',') !== otro.join(',')) {
        return { error: 'Los recorridos no corresponden a un mismo árbol. Revisa el orden de los valores.' };
      }
      return { raiz, pasos };
    }

    return { insertar, buscar, eliminar, recorrido, altura, contar, hojas, esBST, reconstruir };
  })();

  return { fmt, lista, asignacion, johnson, transporte, ordenar, Arbol, GRANDE };
})();

if (typeof module !== 'undefined') module.exports = Algoritmos;
