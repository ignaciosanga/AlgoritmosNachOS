const Introduccion = (() => {
  const $ = s => document.querySelector(s);
  const TAMANOS = [1, 5, 10, 20, 50, 100, 1000, 10000, 1000000];
  const OPS_SEG = 1e9;
  const EDAD_UNIVERSO = 4.35e17;

  let lista = [7, 3, 9, 2, 5];
  let paso = 0;

  function estados() {
    const e = [];
    let mayor = lista[0], pos = 0, comp = 0;
    e.push({ actual: 0, pos, mayor, comp, texto: `Empezamos suponiendo que el primero, ${lista[0]}, es el mayor.` });
    for (let i = 1; i < lista.length; i++) {
      comp++;
      if (lista[i] > mayor) {
        e.push({ actual: i, pos: i, mayor: lista[i], comp, texto: `Comparamos ${lista[i]} con ${mayor}: ${lista[i]} es más grande, así que ahora el mayor es ${lista[i]}.` });
        mayor = lista[i];
        pos = i;
      } else {
        e.push({ actual: i, pos, mayor, comp, texto: `Comparamos ${lista[i]} con ${mayor}: no es más grande, el mayor sigue siendo ${mayor}.` });
      }
    }
    e.push({ actual: -1, pos, mayor, comp, fin: true, texto: `Terminamos: el mayor es ${mayor}. Para ${lista.length} números hicimos ${comp} comparaciones, es decir, n − 1. Si la lista crece al doble, el trabajo también crece al doble: eso es O(n).` });
    return e;
  }

  function dibujarPasos() {
    const es = estados();
    paso = Math.max(0, Math.min(paso, es.length - 1));
    const e = es[paso];
    $('#i-lista').innerHTML = lista.map((v, i) => {
      const c = [];
      if (i === e.pos) c.push('mayor');
      if (i === e.actual) c.push('actual');
      if (e.fin || i < e.actual || (e.actual === -1)) c.push('visto');
      return `<div class="caja ${c.join(' ')}"><span>${v}</span><small>${i === e.pos ? 'mayor' : i === e.actual ? 'comparando' : ''}</small></div>`;
    }).join('');
    $('#i-texto').textContent = e.texto;
    $('#i-contador').textContent = `Paso ${paso + 1} de ${es.length} · comparaciones: ${e.comp}`;
    $('#i-ant').disabled = paso === 0;
    $('#i-sig').disabled = paso === es.length - 1;
  }

  function miles(v) {
    return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  }

  function sup(n) {
    const m = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
    return String(n).split('').map(c => m[c] || c).join('');
  }

  function numero(log10) {
    if (log10 < 15) {
      return miles(Math.round(Math.pow(10, log10)));
    }
    const e = Math.floor(log10);
    const m = Math.pow(10, log10 - e);
    return `${m.toFixed(1).replace('.', ',')} × 10${sup(e)}`;
  }

  function tiempo(log10) {
    const lseg = log10 - Math.log10(OPS_SEG);
    if (lseg > Math.log10(EDAD_UNIVERSO)) return 'más que la edad del universo';
    const s = Math.pow(10, lseg);
    if (s < 1e-6) return `${Math.max(1, Math.round(s * 1e9))} ns`;
    if (s < 1e-3) return `${Math.round(s * 1e6)} µs`;
    if (s < 1) return `${Math.round(s * 1e3)} ms`;
    if (s < 60) return `${Math.round(s)} s`;
    if (s < 3600) return `${Math.round(s / 60)} min`;
    if (s < 86400) return `${Math.round(s / 3600)} h`;
    if (s < 31557600) return `${Math.round(s / 86400)} días`;
    const anios = s / 31557600;
    return anios < 1e6 ? `${miles(Math.round(anios))} años` : `${numero(Math.log10(anios))} años`;
  }

  function dibujarComplejidad() {
    const n = TAMANOS[+$('#i-n').value];
    $('#i-n-valor').textContent = miles(n);
    const l2 = Math.log2(n);
    const clases = [
      ['O(1)', 'Constante', 0],
      ['O(log n)', 'Logarítmica', Math.log10(Math.max(1, l2))],
      ['O(n)', 'Lineal', Math.log10(n)],
      ['O(n log n)', 'Linealítmica', Math.log10(Math.max(1, n * l2))],
      ['O(n²)', 'Cuadrática', 2 * Math.log10(n)],
      ['O(n³)', 'Cúbica', 3 * Math.log10(n)],
      ['O(2ⁿ)', 'Exponencial', n * Math.log10(2)]
    ];
    const TOPE = 18;
    $('#i-barras').innerHTML = clases.map(([o, nombre, l]) => {
      const ancho = Math.max(1.5, Math.min(100, (l / TOPE) * 100));
      const fuera = l > TOPE;
      return `<div class="barra-fila">
        <div class="barra-etq"><b>${o}</b><span>${nombre}</span></div>
        <div class="barra-pista"><div class="barra-relleno ${fuera ? 'fuera' : ''}" style="width:${ancho}%"></div></div>
        <div class="barra-num"><b>${numero(l)}</b><span>${tiempo(l)}</span></div>
      </div>`;
    }).join('');
  }

  function init() {
    $('#i-ant').addEventListener('click', () => { paso--; dibujarPasos(); });
    $('#i-sig').addEventListener('click', () => { paso++; dibujarPasos(); });
    $('#i-reiniciar').addEventListener('click', () => { paso = 0; dibujarPasos(); });
    $('#i-nuevos').addEventListener('click', () => {
      const k = 5 + Math.floor(Math.random() * 3);
      lista = Array.from({ length: k }, () => 1 + Math.floor(Math.random() * 30));
      paso = 0;
      dibujarPasos();
    });
    $('#i-n').addEventListener('input', dibujarComplejidad);
    document.querySelectorAll('[data-scroll]').forEach(b => b.addEventListener('click', () => {
      const d = document.getElementById(b.dataset.scroll);
      if (d) d.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
    dibujarPasos();
    dibujarComplejidad();
  }

  return { init };
})();
