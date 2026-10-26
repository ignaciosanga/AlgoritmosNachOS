const App = (() => {
  const rutas = ['inicio', 'introduccion', 'grafos', 'asignacion', 'johnson'];
  const pantallas = { grafos: () => Grafos, asignacion: () => Asignacion, johnson: () => Johnson };

  function mostrar(ruta) {
    if (!rutas.includes(ruta)) ruta = 'inicio';
    document.querySelectorAll('.vista').forEach(v => v.classList.toggle('visible', v.id === 'v-' + ruta));
    document.querySelectorAll('[data-ruta]').forEach(a => a.classList.toggle('activo', a.dataset.ruta === ruta));
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
    if (tipo === 'grafo') {
      ir('grafos');
      if (Grafos.cargar(obj.grafo || obj)) U.aviso('Grafo abierto: ' + f.nombre);
    } else if (tipo === 'asignacion') {
      ir('asignacion');
      if (Asignacion.cargarArchivo(obj)) U.aviso('Asignación abierta: ' + f.nombre);
    } else if (tipo === 'johnson') {
      ir('johnson');
      if (Johnson.cargarArchivo(obj)) U.aviso('Red abierta: ' + f.nombre);
    } else {
      U.aviso('No se reconoce el formato del archivo');
    }
  }

  function init() {
    Introduccion.init();
    Grafos.init();
    Asignacion.init();
    Johnson.init();
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-ir]');
      if (!a) return;
      e.preventDefault();
      ir(a.dataset.ir);
    });
    window.addEventListener('popstate', () => mostrar(location.hash.slice(1)));
    document.getElementById('anio').textContent = new Date().getFullYear();
    const ruta = location.hash.slice(1);
    mostrar(ruta === 'matrices' ? 'asignacion' : ruta);
  }

  return { init, ir, abrirArchivo };
})();

App.init();
