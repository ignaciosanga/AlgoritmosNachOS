const Northwest = (() => {
  const $ = s => document.querySelector(s);
  const F = v => Algoritmos.fmt(v);
  const MAXF = 8, MAXC = 8;
  const EJEMPLOS = [
    {
      nota: 'Ejemplo balanceado: 3 fábricas (O1, O2, O3) envían a 4 ciudades (D1 a D4). Cada celda es el costo de enviar una unidad.',
      filas: ['O1', 'O2', 'O3'], columnas: ['D1', 'D2', 'D3', 'D4'],
      costos: [[8, 6, 10, 9], [9, 12, 13, 7], [14, 9, 16, 5]], oferta: [35, 50, 40], demanda: [45, 20, 30, 30]
    },
    {
      nota: 'Ejemplo desbalanceado: se ofrecen 235 unidades pero solo se piden 215. Al resolver se agrega un destino ficticio que recibe las 20 que sobran.',
      filas: ['F1', 'F2', 'F3'], columnas: ['T1', 'T2', 'T3'],
      costos: [[4, 8, 8], [16, 24, 16], [8, 16, 24]], oferta: [76, 82, 77], demanda: [72, 102, 41]
    }
  ];
  let N = null;
  let sol = null;
  let rep = null;
  let frames = [];
  let ejemploActual = 0;

  const str = x => x.map(v => Array.isArray(v) ? v.map(String) : String(v));

  function desdeEjemplo(k, objetivo = 'min') {
    const e = EJEMPLOS[k];
    return { objetivo, filas: e.filas.slice(), columnas: e.columnas.slice(), costos: str(e.costos), oferta: str(e.oferta), demanda: str(e.demanda) };
  }

  function validar(x) {
    if (!x || !Array.isArray(x.costos) || !x.costos.length || !Array.isArray(x.costos[0])) return null;
    const f = Math.min(MAXF, x.costos.length), c = Math.min(MAXC, Math.max(...x.costos.map(r => Array.isArray(r) ? r.length : 0)));
    if (!c) return null;
    const val = v => v === null || v === undefined ? '' : String(v);
    return {
      objetivo: x.objetivo === 'max' ? 'max' : 'min',
      filas: Array.from({ length: f }, (_, i) => (x.filas && x.filas[i] != null && String(x.filas[i]).trim()) ? String(x.filas[i]) : `O${i + 1}`),
      columnas: Array.from({ length: c }, (_, j) => (x.columnas && x.columnas[j] != null && String(x.columnas[j]).trim()) ? String(x.columnas[j]) : `D${j + 1}`),
      costos: Array.from({ length: f }, (_, i) => Array.from({ length: c }, (_, j) => val(x.costos[i] && x.costos[i][j]))),
      oferta: Array.from({ length: f }, (_, i) => val(x.oferta && x.oferta[i])),
      demanda: Array.from({ length: c }, (_, j) => val(x.demanda && x.demanda[j]))
    };
  }

  function guardarLocal() {
    try { localStorage.setItem('grafolab.northwest', JSON.stringify(N)); } catch (e) {}
  }

  function nota(t) {
    const p = $('#n-nota');
    p.hidden = !t;
    p.innerHTML = t ? `<span class="material-symbols-rounded">tips_and_updates</span><span>${t}</span>` : '';
  }

  function obsoleto() {
    if (!sol) return;
    sol = null;
    rep.pausar();
    $('#n-resultado').classList.add('obsoleto');
  }

  function sumaTxt(lista) {
    let t = 0;
    for (const v of lista) { const x = U.num(v); if (Number.isFinite(x)) t += x; }
    return t;
  }

  function balance() {
    const tO = sumaTxt(N.oferta), tD = sumaTxt(N.demanda);
    const tot = $('#n-total');
    if (tot) {
      tot.textContent = tO === tD ? F(tO) : `${F(tO)} / ${F(tD)}`;
      tot.className = `total-c ${tO === tD ? 'ok' : 'no'}`;
      tot.title = 'Oferta total / demanda total';
    }
    let html;
    if (tO === tD) html = `<div class="aviso-c c-clave"><span class="material-symbols-rounded">balance</span><div><b>Problema balanceado</b><p>Oferta total = demanda total = <b>${F(tO)}</b>. Se puede resolver directamente.</p></div></div>`;
    else {
      const sobra = tO > tD;
      html = `<div class="aviso-c c-especial"><span class="material-symbols-rounded">balance</span><div><b>Problema desbalanceado</b><p>Oferta total <b>${F(tO)}</b> ${sobra ? '>' : '<'} demanda total <b>${F(tD)}</b>. Al resolver se agrega ${sobra ? 'un <b>destino ficticio</b>' : 'un <b>origen ficticio</b>'} con ${F(Math.abs(tO - tD))} unidades y costo 0 para equilibrar.</p></div></div>`;
    }
    $('#n-balance').innerHTML = html;
  }

  function sincronizar() {
    U.marcar($('#n-objetivo'), N.objetivo);
    $('#n-filas').value = N.filas.length;
    $('#n-columnas').value = N.columnas.length;
  }

  function dibujarTabla() {
    let h = '<thead><tr><th class="esquina" style="font-size:11px;color:var(--texto-3)">origen · destino</th>';
    N.columnas.forEach((c, j) => { h += `<th><input class="etq" data-col="${j}" value="${U.esc(c)}" maxlength="10" aria-label="Nombre del destino ${j + 1}"></th>`; });
    h += '<th class="cab-ofd">Oferta</th></tr></thead><tbody>';
    N.costos.forEach((fila, i) => {
      h += `<tr><th><input class="etq" data-fila="${i}" value="${U.esc(N.filas[i])}" maxlength="10" aria-label="Nombre del origen ${i + 1}"></th>`;
      fila.forEach((v, j) => { h += `<td><input class="celda" data-i="${i}" data-j="${j}" value="${U.esc(v)}" placeholder="0" inputmode="decimal" autocomplete="off" aria-label="Costo de ${U.esc(N.filas[i])} a ${U.esc(N.columnas[j])}"></td>`; });
      h += `<td><input class="ofd" data-of="${i}" value="${U.esc(N.oferta[i])}" inputmode="decimal" autocomplete="off" aria-label="Oferta de ${U.esc(N.filas[i])}"></td></tr>`;
    });
    h += '<tr><th class="cab-ofd">Demanda</th>';
    N.demanda.forEach((v, j) => { h += `<td><input class="ofd" data-de="${j}" value="${U.esc(v)}" inputmode="decimal" autocomplete="off" aria-label="Demanda de ${U.esc(N.columnas[j])}"></td>`; });
    h += '<td><span class="total-c" id="n-total"></span></td></tr></tbody>';
    $('#n-tabla').innerHTML = h;
    balance();
  }

  function dibujar() {
    sincronizar();
    dibujarTabla();
  }

  function cambio() {
    balance();
    obsoleto();
    guardarLocal();
  }

  function redimensionar() {
    const f = Math.max(1, Math.min(MAXF, Math.round(Number($('#n-filas').value)) || 1));
    const c = Math.max(1, Math.min(MAXC, Math.round(Number($('#n-columnas').value)) || 1));
    N.costos = Array.from({ length: f }, (_, i) => Array.from({ length: c }, (_, j) => N.costos[i]?.[j] ?? ''));
    N.oferta = Array.from({ length: f }, (_, i) => N.oferta[i] ?? '');
    N.demanda = Array.from({ length: c }, (_, j) => N.demanda[j] ?? '');
    N.filas = Array.from({ length: f }, (_, i) => N.filas[i] ?? `O${i + 1}`);
    N.columnas = Array.from({ length: c }, (_, j) => N.columnas[j] ?? `D${j + 1}`);
    nota('');
    dibujar();
    cambio();
  }

  function aleatorio() {
    const f = N.filas.length, c = N.columnas.length;
    N.costos = N.costos.map(r => r.map(() => String(1 + Math.floor(Math.random() * 20))));
    N.oferta = N.oferta.map(() => String(10 * (2 + Math.floor(Math.random() * 7))));
    const total = N.oferta.reduce((s, v) => s + Number(v), 0);
    const pesos = Array.from({ length: c }, () => 1 + Math.random());
    const sp = pesos.reduce((s, v) => s + v, 0);
    const dem = pesos.map(p => Math.max(5, Math.round((p / sp) * total / 5) * 5));
    dem[c - 1] += total - dem.reduce((s, v) => s + v, 0);
    if (dem[c - 1] <= 0) dem[c - 1] = 5;
    N.demanda = dem.map(String);
    nota(`Datos aleatorios: ${f} orígenes y ${c} destinos, balanceados.`);
    dibujarTabla();
    cambio();
  }

  function limpiar() {
    N.costos = N.costos.map(r => r.map(() => ''));
    N.oferta = N.oferta.map(() => '');
    N.demanda = N.demanda.map(() => '');
    nota('');
    dibujarTabla();
    cambio();
  }

  function ejemplo() {
    N = desdeEjemplo(ejemploActual, N.objetivo);
    nota(EJEMPLOS[ejemploActual].nota + (EJEMPLOS.length > 1 ? ' Presiona «Ejemplo» otra vez para ver el otro.' : ''));
    ejemploActual = (ejemploActual + 1) % EJEMPLOS.length;
    dibujar();
    cambio();
  }

  function leer() {
    const errores = [];
    const num = (v, que, positivo) => {
      const x = U.num(v);
      if (x === null) return 0;
      if (Number.isNaN(x)) { errores.push(`«${v}» en ${que} no es un número`); return 0; }
      if (positivo && x < 0) { errores.push(`${que} no puede ser negativa`); return 0; }
      return x;
    };
    const C = N.costos.map((r, i) => r.map((v, j) => num(v, `el costo ${N.filas[i]} → ${N.columnas[j]}`, false)));
    const of = N.oferta.map((v, i) => num(v, `la oferta de ${N.filas[i]}`, true));
    const de = N.demanda.map((v, j) => num(v, `la demanda de ${N.columnas[j]}`, true));
    return { C, of, de, error: errores[0] };
  }

  function error(texto) {
    sol = null;
    const res = $('#n-resultado');
    res.classList.remove('obsoleto');
    res.innerHTML = `<div class="tarjeta aviso-error"><span class="material-symbols-rounded">error</span><div><h3>No se pudo resolver</h3><p>${U.esc(texto)}</p></div></div>`;
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function celda(r, X, i, j, o = {}) {
    const fic = i === r.ficF || j === r.ficC;
    const v = X[i][j];
    const c = ['nw-celda'];
    let contenido = '';
    if (v !== null && v !== undefined) {
      c.push(v > 0 ? 'asig' : 'cero');
      contenido = F(v);
    } else if (o.R && o.R[i][j] !== null) {
      const d = o.R[i][j];
      const mejora = r.objetivo === 'max' ? d > 1e-9 : d < -1e-9;
      c.push(mejora ? 'rd-mejora' : 'rd-no');
      contenido = `<span class="rd">${d > 0 ? '+' : ''}${F(d)}</span>`;
    } else if (o.agotada && o.agotada(i, j)) c.push('agotada');
    if (fic) c.push('fic');
    if (o.actual && o.actual.i === i && o.actual.j === j) c.push('actual');
    let signo = '';
    if (o.ciclo) {
      const k = o.ciclo.findIndex(x => x.i === i && x.j === j);
      if (k >= 0) { c.push(k % 2 === 0 ? 'mas' : 'menos'); signo = `<span class="signo">${k % 2 === 0 ? '+' : '−'}</span>`; }
      if (k === 0) c.push('entra');
    }
    if (o.sale && o.sale.i === i && o.sale.j === j) c.push('sale');
    return `<td><div class="${c.join(' ')}" title="Costo ${F(r.C[i][j])}"><small>${F(r.C[i][j])}</small>${contenido}${signo}</div></td>`;
  }

  function tablaAnim(r, f) {
    const m = r.filas.length, n = r.cols.length;
    let h = '<div class="tabla-scroll"><table class="tabla-nw"><thead><tr><th></th>';
    r.cols.forEach((c, j) => { h += `<th class="${j === r.ficC ? 'th-fic' : ''}">${U.esc(c)}</th>`; });
    h += '<th class="cab-ofd">Oferta que queda</th></tr></thead><tbody>';
    for (let i = 0; i < m; i++) {
      h += `<tr><th class="${i === r.ficF ? 'th-fic' : ''}">${U.esc(r.filas[i])}</th>`;
      for (let j = 0; j < n; j++) h += celda(r, f.X, i, j, { actual: f.actual, agotada: (a, b) => f.s[a] === 0 || f.d[b] === 0 });
      h += `<td><div class="nw-resto ${f.s[i] === 0 ? 'cero' : ''}">${F(f.s[i])}</div></td></tr>`;
    }
    h += '<tr><th class="cab-ofd">Demanda que queda</th>';
    for (let j = 0; j < n; j++) h += `<td><div class="nw-resto ${f.d[j] === 0 ? 'cero' : ''}">${F(f.d[j])}</div></td>`;
    return h + '<td></td></tr></tbody></table></div>';
  }

  function tablaModi(r, it) {
    const m = r.filas.length, n = r.cols.length;
    let h = '<div class="tabla-scroll"><table class="tabla-nw"><thead><tr><th></th>';
    r.cols.forEach((c, j) => { h += `<th class="${j === r.ficC ? 'th-fic' : ''}">${U.esc(c)}</th>`; });
    h += '<th class="uv">u</th></tr></thead><tbody>';
    for (let i = 0; i < m; i++) {
      h += `<tr><th class="${i === r.ficF ? 'th-fic' : ''}">${U.esc(r.filas[i])}</th>`;
      for (let j = 0; j < n; j++) h += celda(r, it.X, i, j, { R: it.R, ciclo: it.ciclo, sale: it.sale });
      h += `<td class="uv">u${i + 1} = ${F(it.u[i])}</td></tr>`;
    }
    h += '<tr><th class="uv">v</th>';
    for (let j = 0; j < n; j++) h += `<td class="uv" style="text-align:center">v${j + 1} = ${F(it.v[j])}</td>`;
    return h + '<td></td></tr></tbody></table></div>';
  }

  function formulaCosto(r, X) {
    const partes = [];
    let t = 0;
    X.forEach((fila, i) => fila.forEach((v, j) => {
      if (v) { partes.push(`${F(v)}×${F(r.C[i][j])}`); t += v * r.C[i][j]; }
    }));
    return `${partes.join(' + ')} = <b>${F(t)}</b>`;
  }

  function mostrarFrame(k) {
    const f = frames[k];
    $('#n-anim').innerHTML = tablaAnim(sol, f);
    const nar = $('#n-narr');
    nar.classList.toggle('fin', !!f.fin);
    nar.innerHTML = `<span class="material-symbols-rounded">${f.fin ? 'check_circle' : 'record_voice_over'}</span><span>${f.texto}</span>`;
  }

  function construirFrames(r) {
    const m = r.filas.length, n = r.cols.length;
    const vacio = Array.from({ length: m }, () => new Array(n).fill(null));
    const lista = [{ X: vacio, s: r.oferta.slice(), d: r.demanda.slice(), actual: { i: 0, j: 0 }, texto: `Empezamos en la <b>esquina noroeste</b> (arriba a la izquierda): ${U.esc(r.filas[0])} → ${U.esc(r.cols[0])}. El método no mira los costos: solo reparte la oferta en orden, de izquierda a derecha y de arriba hacia abajo.` }];
    r.pasos.forEach(p => lista.push({ X: p.X, s: p.s, d: p.d, actual: { i: p.i, j: p.j }, texto: U.esc(p.texto) }));
    const basicas = r.inicial.flat().filter(v => v !== null).length;
    lista.push({ X: r.inicial, s: r.oferta.map(() => 0), d: r.demanda.map(() => 0), fin: true, texto: `Solución inicial lista. ${r.objetivo === 'max' ? 'Ganancia' : 'Costo'} = ${formulaCosto(r, r.inicial)}. Tiene ${basicas} celdas con envío (m + n − 1 = ${m} + ${n} − 1 = ${m + n - 1}), como pide el método.` });
    return lista;
  }

  function htmlResultado(r) {
    const max = r.objetivo === 'max';
    const palabra = max ? 'Ganancia' : 'Costo';
    const dif = r.costoFinal - r.costoInicial;
    const pct = r.costoInicial ? Math.abs(dif) / Math.abs(r.costoInicial) * 100 : 0;
    const envios = [];
    r.final.forEach((fila, i) => fila.forEach((v, j) => {
      if (!v) return;
      const fic = i === r.ficF || j === r.ficC;
      envios.push(`<span class="chip ${fic ? 'violeta' : 'azul'}">${U.esc(r.filas[i])} → ${U.esc(r.cols[j])}: <b>${F(v)}</b>${fic ? ' (no se envía)' : ` × ${F(r.C[i][j])}`}</span>`);
    }));
    const its = r.iteraciones;
    const mejoras = its.length - 1;
    const bal = r.balanceo.tipo
      ? `<div class="aviso-c c-especial"><span class="material-symbols-rounded">auto_awesome</span><div><b>Se agregó ${r.balanceo.tipo === 'columna' ? 'un destino' : 'un origen'} ficticio</b><p>La oferta total (${F(r.balanceo.tO)}) y la demanda total (${F(r.balanceo.tD)}) no eran iguales. ${r.balanceo.tipo === 'columna' ? 'El destino ficticio recibe' : 'El origen ficticio entrega'} las ${F(r.balanceo.cantidad)} unidades de diferencia con costo 0: en la realidad, esas unidades ${r.balanceo.tipo === 'columna' ? 'se quedan sin enviar' : 'nadie las entrega'}.</p></div></div>`
      : '';
    const iteracionesHtml = its.map((it, k) => {
      let texto;
      if (it.optimo) {
        texto = k === 0
          ? `Todos los costos reducidos de las celdas vacías son ${max ? '≤ 0' : '≥ 0'}: ninguna celda nueva mejora el ${palabra.toLowerCase()}. <b>La solución de la esquina noroeste ya era óptima.</b>`
          : `Ahora todos los costos reducidos son ${max ? '≤ 0' : '≥ 0'}: ya no hay ninguna celda que mejore el resultado. <b>Esta es la solución óptima</b>, con ${palabra.toLowerCase()} ${F(it.costo)}.`;
      } else {
        const e = it.entra;
        const sig = its[k + 1];
        const ciclo = it.ciclo.map((c, q) => `${U.esc(r.filas[c.i])}→${U.esc(r.cols[c.j])} (${q % 2 === 0 ? '+' : '−'})`).join(', ');
        texto = `${max ? 'La celda con el costo reducido más positivo' : 'La celda con el costo reducido más negativo'} es <b>${U.esc(r.filas[e.i])} → ${U.esc(r.cols[e.j])}</b> (${e.r > 0 ? '+' : ''}${F(e.r)}): por cada unidad que se mande ahí, el ${palabra.toLowerCase()} ${max ? 'sube' : 'baja'} ${F(Math.abs(e.r))}. Se arma el ciclo ${ciclo}. θ = <b>${F(it.theta)}</b> (el menor de las celdas con −). Sale ${U.esc(r.filas[it.sale.i])} → ${U.esc(r.cols[it.sale.j])}. El ${palabra.toLowerCase()} pasa de ${F(it.costo)} a <b>${F(sig.costo)}</b>.`;
      }
      return `<div class="paso">
        <h4><span class="num">${k + 1}</span>${it.optimo ? 'Comprobación final' : `Iteración ${k + 1}`} · ${palabra.toLowerCase()} ${F(it.costo)} ${it.optimo ? '<span class="etiqueta-c verde">óptima</span>' : ''}</h4>
        <p>${texto}</p>
        ${tablaModi(r, it)}
      </div>`;
    }).join('');
    return `
      <div class="tarjeta">
        <div class="resultado-cabecera">
          <div>
            <div class="etiqueta-cifra">${max ? 'Ganancia máxima' : 'Costo mínimo'}</div>
            <div class="cifra verde">${F(r.costoFinal)}</div>
          </div>
          <span class="insignia verde"><span class="material-symbols-rounded">check</span>${mejoras ? `Óptimo en ${mejoras} ${mejoras === 1 ? 'mejora' : 'mejoras'}` : 'La inicial ya era óptima'}</span>
        </div>
        <div class="contadores">
          <div class="contador-c ambar"><small>Esquina noroeste</small><b>${F(r.costoInicial)}</b></div>
          <div class="contador-c" style="background:var(--verde-s)"><small>Después de optimizar</small><b style="color:var(--verde-t)">${F(r.costoFinal)}</b></div>
          ${dif ? `<div class="contador-c"><small>${max ? 'Ganancia extra' : 'Ahorro'}</small><b>${F(Math.abs(dif))} <span style="font-size:13px;color:var(--texto-2)">(${pct.toFixed(1).replace('.', ',')} %)</span></b></div>` : ''}
        </div>
        ${bal}
        <h3>Envíos de la solución óptima</h3>
        <div class="chips">${envios.join('')}</div>
        <p class="explicacion">${palabra} total = ${formulaCosto(r, r.final)}</p>
      </div>
      <div class="tarjeta">
        <span class="sobretitulo">Paso 1</span>
        <h2>Solución inicial: esquina noroeste</h2>
        <p class="lead">Se reparte la oferta empezando arriba a la izquierda. En cada celda se manda lo máximo posible (el menor entre lo que queda de oferta y de demanda) y se avanza: a la derecha si se cubrió la demanda, hacia abajo si se acabó la oferta.</p>
        <div class="leyenda-c">
          <span><i class="sw sw-ambar"></i>Celda actual</span>
          <span><i class="sw sw-azul"></i>Con envío</span>
          <span><i class="sw sw-violeta"></i>0 por degeneración</span>
          <span><i class="sw sw-trama"></i>Fila o columna agotada</span>
          ${r.balanceo.tipo ? '<span><i class="sw sw-violeta-borde"></i>Ficticia</span>' : ''}
        </div>
        <div id="n-anim"></div>
        <div id="n-repro"></div>
        <div class="narracion" id="n-narr"></div>
      </div>
      <div class="tarjeta">
        <span class="sobretitulo">Paso 2</span>
        <h2>Mejorar la solución: método MODI</h2>
        <p class="lead">La esquina noroeste da una solución válida, pero casi nunca la mejor, porque no mira los costos. El método MODI (de los multiplicadores u y v) la va mejorando hasta llegar al ${max ? 'máximo' : 'mínimo'}.</p>
        <ol class="pasos-lista">
          <li>En cada celda con envío se cumple <b>costo = u + v</b>. Con u1 = 0 se despejan todos los u (filas) y v (columnas).</li>
          <li>En cada celda vacía se calcula el <b>costo reducido = costo − u − v</b>: cuánto cambia el ${palabra.toLowerCase()} por cada unidad que se mande ahí.</li>
          <li>Si ningún costo reducido es ${max ? 'positivo' : 'negativo'}, la solución es óptima. Si no, <b>entra</b> la celda ${max ? 'más positiva' : 'más negativa'}.</li>
          <li>Se arma un <b>ciclo</b> que alterna + y −, se mueve la cantidad θ (el menor de las celdas −) y una celda queda vacía (<b>sale</b>). Se repite.</li>
        </ol>
        <div class="leyenda-c">
          <span><i class="sw sw-azul"></i>Con envío</span>
          <span><i class="sw sw-verde-s"></i>Costo reducido que mejora</span>
          <span><i class="sw sw-verde"></i>Celda que entra</span>
          <span><i class="sw" style="background:#fff;box-shadow:0 0 0 2px var(--rojo)"></i>Celda que sale</span>
          <span><b style="color:var(--verde-t)">+</b> / <b style="color:var(--rojo-t)">−</b> Ciclo</span>
        </div>
        ${iteracionesHtml}
      </div>`;
  }

  function resolver() {
    const { C, of, de, error: e } = leer();
    if (e) return error(e);
    const r = Algoritmos.transporte(C, of, de, N.objetivo, N.filas, N.columnas);
    if (r.error) return error(r.error);
    sol = r;
    const res = $('#n-resultado');
    res.classList.remove('obsoleto');
    res.innerHTML = htmlResultado(r);
    frames = construirFrames(r);
    rep = Reproductor.crear($('#n-repro'), { alMostrar: mostrarFrame, velocidad: 2 });
    rep.cargar(frames.length, 0, false);
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function guardarArchivo() {
    const r = await U.dialogo({ titulo: 'Guardar problema', campos: [{ id: 'nombre', etiqueta: 'Nombre del archivo', valor: 'northwest' }], aceptar: 'Descargar' });
    if (!r) return;
    U.descargarJSON(U.nombreArchivo(r.nombre, 'northwest') + '.json', { app: 'GrafoLab', version: 2, tipo: 'northwest', northwest: N });
  }

  function cargarArchivo(obj) {
    const v = validar(obj.northwest || obj);
    if (!v) { U.aviso('El archivo no contiene un problema de transporte válido'); return false; }
    N = v;
    sol = null;
    nota('');
    $('#n-resultado').innerHTML = '';
    $('#n-resultado').classList.remove('obsoleto');
    dibujar();
    guardarLocal();
    return true;
  }

  function init() {
    let g = null;
    try { g = JSON.parse(localStorage.getItem('grafolab.northwest')); } catch (e) {}
    N = validar(g) || desdeEjemplo(0);
    if (!g) ejemploActual = 1;
    rep = { pausar: () => {} };
    $('#n-objetivo').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.dataset.valor === N.objetivo) return;
      N.objetivo = b.dataset.valor;
      sincronizar();
      cambio();
    });
    $('#n-aplicar-tam').addEventListener('click', redimensionar);
    ['#n-filas', '#n-columnas'].forEach(s => $(s).addEventListener('keydown', e => { if (e.key === 'Enter') redimensionar(); }));
    $('#n-ejemplo').addEventListener('click', ejemplo);
    $('#n-aleatorio').addEventListener('click', aleatorio);
    $('#n-limpiar').addEventListener('click', limpiar);
    $('#n-resolver').addEventListener('click', resolver);
    $('#n-guardar').addEventListener('click', guardarArchivo);
    $('#n-abrir').addEventListener('click', () => App.abrirArchivo());
    const t = $('#n-tabla');
    t.addEventListener('input', e => {
      const x = e.target;
      if (x.classList.contains('celda')) N.costos[+x.dataset.i][+x.dataset.j] = x.value;
      else if (x.dataset.of !== undefined) N.oferta[+x.dataset.of] = x.value;
      else if (x.dataset.de !== undefined) N.demanda[+x.dataset.de] = x.value;
      else if (x.dataset.fila !== undefined) N.filas[+x.dataset.fila] = x.value;
      else if (x.dataset.col !== undefined) N.columnas[+x.dataset.col] = x.value;
      cambio();
    });
    t.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || !e.target.matches('.celda,.ofd')) return;
      e.preventDefault();
      const celdas = [...t.querySelectorAll('.celda,.ofd')];
      const sig = celdas[celdas.indexOf(e.target) + 1] || celdas[0];
      sig.focus();
      sig.select();
    });
    t.addEventListener('focusin', e => { if (e.target.matches('.celda,.ofd')) e.target.select(); });
    dibujar();
  }

  return { init, cargarArchivo, mostrar: () => {} };
})();
