const Sort = (() => {
  const $ = s => document.querySelector(s);
  const MAXN = 30;
  const INFO = {
    burbuja: {
      nombre: 'Burbuja', idea: 'Compara cada par de vecinos y los intercambia si están al revés. En cada pasada, el más grande «sube» hasta el final, como una burbuja.',
      mejor: 'O(n)', prom: 'O(n²)', peor: 'O(n²)', espacio: 'O(1)', estable: true,
      cuando: 'Para aprender y para listas muy pequeñas o casi ordenadas.'
    },
    seleccion: {
      nombre: 'Selección', idea: 'Busca el menor de toda la parte desordenada y lo pone al principio. Después repite con el resto de la lista.',
      mejor: 'O(n²)', prom: 'O(n²)', peor: 'O(n²)', espacio: 'O(1)', estable: false,
      cuando: 'Cuando mover datos es caro: hace como máximo n − 1 intercambios.'
    },
    insercion: {
      nombre: 'Inserción', idea: 'Como ordenar cartas en la mano: toma el siguiente número y lo desliza hacia la izquierda hasta su lugar dentro de la parte ya ordenada.',
      mejor: 'O(n)', prom: 'O(n²)', peor: 'O(n²)', espacio: 'O(1)', estable: true,
      cuando: 'Listas pequeñas o casi ordenadas: ahí es de los más rápidos.'
    },
    shell: {
      nombre: 'Shell', idea: 'Es una inserción mejorada: primero ordena números separados por una distancia grande (gap) y la va achicando a la mitad hasta llegar a 1.',
      mejor: 'O(n log n)', prom: '≈ O(n^1,5)', peor: 'O(n²)', espacio: 'O(1)', estable: false,
      cuando: 'Listas medianas cuando no se quiere usar memoria extra.'
    },
    merge: {
      nombre: 'Merge (mezcla)', idea: '«Divide y vencerás»: parte la lista por la mitad una y otra vez hasta tener números sueltos, y luego mezcla las mitades en orden.',
      mejor: 'O(n log n)', prom: 'O(n log n)', peor: 'O(n log n)', espacio: 'O(n)', estable: true,
      cuando: 'Listas grandes cuando se necesita un tiempo garantizado.'
    },
    quick: {
      nombre: 'Quick (rápido)', idea: 'Elige un pivote y deja a su izquierda los que van antes y a su derecha los que van después. Luego repite lo mismo en cada lado.',
      mejor: 'O(n log n)', prom: 'O(n log n)', peor: 'O(n²)', espacio: 'O(log n)', estable: false,
      cuando: 'En la práctica es de los más rápidos para listas grandes.'
    }
  };
  let S = null;
  let res = null;
  let rep = null;
  let barras = [];

  const calidad = c => /n²|n\^1/.test(c) ? (c.includes('²') ? 'malo' : 'medio') : (c.includes('log') || c === 'O(n)' || c === 'O(1)' ? 'bueno' : 'medio');

  function aleatorios(n) {
    return Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 99));
  }

  function guardarLocal() {
    try { localStorage.setItem('grafolab.sort', JSON.stringify(S)); } catch (e) {}
  }

  function validar(x) {
    if (!x || !Array.isArray(x.datos)) return null;
    const datos = x.datos.map(Number).filter(Number.isFinite).slice(0, MAXN);
    if (datos.length < 2) return null;
    return { alg: INFO[x.alg] ? x.alg : 'burbuja', orden: x.orden === 'desc' ? 'desc' : 'asc', datos };
  }

  function sincronizar() {
    $('#s-algoritmos').querySelectorAll('button').forEach(b => b.classList.toggle('activo', b.dataset.valor === S.alg));
    U.marcar($('#s-orden'), S.orden);
    $('#s-n').value = S.datos.length;
  }

  function dibujarFicha() {
    const i = INFO[S.alg];
    $('#s-titulo').textContent = i.nombre;
    $('#s-complej').textContent = `Promedio ${i.prom}`;
    $('#s-complej').className = `etiqueta-c ${calidad(i.prom) === 'bueno' ? 'verde' : calidad(i.prom) === 'malo' ? 'rojo' : 'ambar'}`;
    $('#s-idea').textContent = i.idea;
    $('#s-ficha').innerHTML = [
      ['Mejor caso', i.mejor, calidad(i.mejor)],
      ['Caso promedio', i.prom, calidad(i.prom)],
      ['Peor caso', i.peor, calidad(i.peor)],
      ['Memoria extra', i.espacio, i.espacio === 'O(1)' ? 'bueno' : (i.espacio === 'O(n)' ? 'medio' : 'bueno')],
      ['¿Estable?', i.estable ? 'Sí' : 'No', i.estable ? 'bueno' : 'medio'],
      ['Cuándo usarlo', '', '']
    ].map(([t, v, c]) => t === 'Cuándo usarlo'
      ? `<div style="grid-column:1/-1"><small>${t}</small><span style="font-size:14px">${U.esc(i.cuando)}</span></div>`
      : `<div><small>${t}</small><b class="${c}">${v}</b></div>`).join('');
  }

  function dibujarPseudo() {
    $('#s-pseudo').innerHTML = res.pseudo.map((l, k) => `<div data-l="${k}">${U.esc(l)}</div>`).join('');
  }

  function prepararBarras() {
    const n = S.datos.length;
    const cont = $('#s-barras');
    cont.innerHTML = Array.from({ length: n }, () => '<div class="barra-s"><i></i><span></span></div>').join('');
    barras = [...cont.children];
    $('#s-indices').innerHTML = Array.from({ length: n }, (_, k) => `<span>${k + 1}</span>`).join('');
    cont.classList.toggle('muchas', n > 18);
  }

  function mostrarFrame(k) {
    const f = res.frames[k];
    const mn = Math.min(...S.datos), mx = Math.max(...S.datos);
    const ord = new Set(f.ord);
    const muestraNum = S.datos.length <= 22;
    f.a.forEach((v, i) => {
      const b = barras[i];
      const alto = mx === mn ? 60 : 10 + ((v - mn) / (mx - mn)) * 90;
      b.querySelector('i').style.height = `${alto}%`;
      b.querySelector('span').textContent = muestraNum ? Algoritmos.fmt(v) : '';
      b.title = `Posición ${i + 1}: ${Algoritmos.fmt(v)}`;
      const c = [];
      if (f.cambio && f.cambio.includes(i)) c.push('cambio');
      else if (f.comparar && f.comparar.includes(i)) c.push('comparar');
      else if (f.pivote === i) c.push('pivote');
      else if (f.marca === i) c.push('marca');
      else if (ord.has(i) || f.fin) c.push('ord');
      else if (f.parcial && i >= f.parcial[0] && i <= f.parcial[1]) c.push('parcial');
      if (f.rango && (i < f.rango[0] || i > f.rango[1])) c.push('fuera');
      b.className = 'barra-s ' + c.join(' ');
    });
    $('#s-pseudo').querySelectorAll('div').forEach(d => d.classList.toggle('activa', +d.dataset.l === f.linea));
    const nar = $('#s-narracion');
    nar.classList.toggle('fin', !!f.fin);
    nar.innerHTML = `<span class="material-symbols-rounded">${f.fin ? 'check_circle' : 'record_voice_over'}</span><span>${U.esc(f.texto)}</span>`;
    const esMerge = S.alg === 'merge';
    $('#s-contadores').innerHTML = `
      <div class="contador-c ambar"><small>Comparaciones</small><b>${f.comp}</b></div>
      <div class="contador-c rojo"><small>${esMerge ? 'Copias' : 'Intercambios'}</small><b>${f.inter}</b></div>
      <div class="contador-c"><small>Números</small><b>${S.datos.length}</b></div>
      ${f.gap ? `<div class="contador-c"><small>Distancia (gap)</small><b>${f.gap}</b></div>` : ''}`;
  }

  function generar(auto = false) {
    res = Algoritmos.ordenar(S.alg, S.datos, S.orden);
    sincronizar();
    dibujarFicha();
    dibujarPseudo();
    prepararBarras();
    rep.cargar(res.frames.length, 0, auto);
    guardarLocal();
  }

  function cargarManual() {
    const t = $('#s-manual').value.trim();
    if (!t) return U.aviso('Escribe números separados por comas, por ejemplo: 10, 25, 3, 14');
    const partes = t.split(/[\s,;]+/).filter(Boolean);
    const nums = partes.map(x => U.num(x));
    const malo = partes.find((x, k) => nums[k] === null || Number.isNaN(nums[k]));
    if (malo !== undefined) return U.aviso(`«${malo}» no es un número`);
    if (nums.length < 2) return U.aviso('Escribe al menos 2 números');
    if (nums.length > MAXN) return U.aviso(`Máximo ${MAXN} números para poder verlos bien`);
    S.datos = nums;
    generar();
    U.aviso(`${nums.length} números cargados`);
  }

  async function guardarArchivo() {
    const r = await U.dialogo({ titulo: 'Guardar lista', campos: [{ id: 'nombre', etiqueta: 'Nombre del archivo', valor: 'ordenamiento' }], aceptar: 'Descargar' });
    if (!r) return;
    U.descargarJSON(U.nombreArchivo(r.nombre, 'ordenamiento') + '.json', { app: 'GrafoLab', version: 2, tipo: 'sort', sort: S });
  }

  function cargarArchivo(obj) {
    const v = validar(obj.sort || obj);
    if (!v) { U.aviso('El archivo no contiene una lista válida'); return false; }
    S = v;
    generar();
    return true;
  }

  function init() {
    let guardado = null;
    try { guardado = JSON.parse(localStorage.getItem('grafolab.sort')); } catch (e) {}
    S = validar(guardado) || { alg: 'burbuja', orden: 'asc', datos: [38, 12, 74, 5, 51, 29, 90, 17, 63, 44] };
    rep = Reproductor.crear($('#s-repro'), { alMostrar: mostrarFrame, velocidad: 3 });
    $('#s-algoritmos').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.dataset.valor === S.alg) return;
      S.alg = b.dataset.valor;
      generar();
    });
    $('#s-orden').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b || b.dataset.valor === S.orden) return;
      S.orden = b.dataset.valor;
      generar();
    });
    $('#s-aleatorio').addEventListener('click', () => {
      const n = Math.round(Number($('#s-n').value));
      if (!(n >= 2 && n <= MAXN)) return U.aviso(`Elige entre 2 y ${MAXN} números`);
      S.datos = aleatorios(n);
      generar();
    });
    $('#s-n').addEventListener('keydown', e => { if (e.key === 'Enter') $('#s-aleatorio').click(); });
    $('#s-cargar').addEventListener('click', cargarManual);
    $('#s-manual').addEventListener('keydown', e => { if (e.key === 'Enter') cargarManual(); });
    $('#s-guardar').addEventListener('click', guardarArchivo);
    $('#s-abrir').addEventListener('click', () => App.abrirArchivo());
    generar();
  }

  return { init, cargarArchivo, mostrar: () => {} };
})();
