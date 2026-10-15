const App = (() => {
  const rutas = ['inicio', 'matrices', 'grafos'];

  function mostrar(ruta) {
    if (!rutas.includes(ruta)) ruta = 'inicio';
    document.querySelectorAll('.vista').forEach(v => v.classList.toggle('visible', v.id === 'v-' + ruta));
    document.querySelectorAll('[data-ruta]').forEach(a => a.classList.toggle('activo', a.dataset.ruta === ruta));
    if (ruta === 'grafos') Grafos.mostrar();
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
    if (Array.isArray(obj)) obj = { tipo: 'matriz', matriz: { valores: obj } };
    if (obj && (obj.tipo === 'grafo' || (Array.isArray(obj.nodos) && Array.isArray(obj.aristas)))) {
      ir('grafos');
      if (Grafos.cargar(obj.grafo || obj)) U.aviso('Grafo abierto: ' + f.nombre);
    } else if (obj && (obj.tipo === 'matriz' || Array.isArray(obj.valores))) {
      ir('matrices');
      if (Matrices.cargar(obj.matriz || obj)) U.aviso('Matriz abierta: ' + f.nombre);
    } else {
      U.aviso('No se reconoce el formato del archivo');
    }
  }

  function init() {
    Matrices.init();
    Grafos.init();
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-ir]');
      if (!a) return;
      e.preventDefault();
      ir(a.dataset.ir);
    });
    window.addEventListener('popstate', () => mostrar(location.hash.slice(1)));
    document.getElementById('anio').textContent = new Date().getFullYear();
    mostrar(location.hash.slice(1));
  }

  return { init, ir, abrirArchivo };
})();

App.init();