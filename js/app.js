const App = (() => {
  const rutas = ['inicio', 'introduccion', 'grafos', 'asignacion', 'johnson', 'northwest', 'sort', 'arboles'];
  const algoritmos = ['asignacion', 'johnson', 'northwest', 'sort', 'arboles'];
  const pantallas = {
    grafos: () => Grafos, asignacion: () => Asignacion, johnson: () => Johnson,
    northwest: () => Northwest, sort: () => Sort, arboles: () => Arboles
  };
  const hoja = () => document.getElementById('menu-hoja');

  function cerrarMenu() {
    hoja().classList.remove('abierta');
  }

  function mostrar(ruta) {
    if (!rutas.includes(ruta)) ruta = 'inicio';
    Reproductor.pausarTodos();
    Guia.terminarTour();
    Guia.cerrar();
    cerrarMenu();
    document.querySelectorAll('.vista').forEach(v => v.classList.toggle('visible', v.id === 'v-' + ruta));
    document.querySelectorAll('[data-ruta]').forEach(a => a.classList.toggle('activo', a.dataset.ruta === ruta));
    document.getElementById('boton-algoritmos').classList.toggle('activo', algoritmos.includes(ruta));
    if (pantallas[ruta]) pantallas[ruta]().mostrar();
  }

  function ir(ruta) {
    if (location.hash !== '#' + ruta) history.pushState(null, '', '#' + ruta);
    mostrar(ruta);
    window.scrollTo(0, 0);
  }

  async function abrirArchivo() {
    const f = await U.leerArchivo('.json,application/json');
    let obj;
    try { obj = JSON.parse(f.texto); } catch (e) { U.aviso('El archivo no es un JSON válido'); return; }
    if (Array.isArray(obj)) obj = { tipo: 'asignacion', asignacion: { valores: obj } };
    if (!obj || typeof obj !== 'object') return U.aviso('No se reconoce el formato del archivo');
    let tipo = obj.tipo;
    if (tipo === 'matriz') tipo = obj.matriz && obj.matriz.algoritmo === 'johnson' ? 'johnson' : 'asignacion';
    if (!tipo && Array.isArray(obj.nodos) && Array.isArray(obj.aristas)) tipo = 'grafo';
    if (!tipo && Array.isArray(obj.valores)) tipo = 'asignacion';
    if (!tipo && Array.isArray(obj.datos)) tipo = 'sort';
    if (!tipo && obj.raiz !== undefined) tipo = 'arbol';
    if (!tipo && Array.isArray(obj.costos)) tipo = 'northwest';
    const destinos = {
      grafo: ['grafos', () => Grafos.cargar(obj.grafo || obj), 'Grafo abierto'],
      asignacion: ['asignacion', () => Asignacion.cargarArchivo(obj), 'Asignación abierta'],
      johnson: ['johnson', () => Johnson.cargarArchivo(obj), 'Red abierta'],
      northwest: ['northwest', () => Northwest.cargarArchivo(obj), 'Problema de transporte abierto'],
      sort: ['sort', () => Sort.cargarArchivo(obj), 'Lista abierta'],
      arbol: ['arboles', () => Arboles.cargarArchivo(obj), 'Árbol abierto']
    };
    const d = destinos[tipo];
    if (!d) return U.aviso('No se reconoce el formato del archivo');
    ir(d[0]);
    if (d[1]()) U.aviso(`${d[2]}: ${f.nombre}`);
  }

  function init() {
    Guia.init();
    Introduccion.init();
    Grafos.init();
    Asignacion.init();
    Johnson.init();
    Northwest.init();
    Sort.init();
    Arboles.init();
    document.addEventListener('click', e => {
      if (e.target.closest('[data-menu]')) { hoja().classList.toggle('abierta'); return; }
      if (e.target === hoja()) { cerrarMenu(); return; }
      const a = e.target.closest('[data-ir]');
      if (!a) return;
      e.preventDefault();
      ir(a.dataset.ir);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarMenu(); });
    window.addEventListener('popstate', () => mostrar(location.hash.slice(1)));
    document.getElementById('anio').textContent = new Date().getFullYear();
    const ruta = location.hash.slice(1);
    mostrar(ruta === 'matrices' ? 'asignacion' : ruta);
  }

  return { init, ir, abrirArchivo };
})();

App.init();
