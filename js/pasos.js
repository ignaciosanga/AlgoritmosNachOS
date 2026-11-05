const Reproductor = (() => {
  const todos = [];
  const TIEMPOS = [1500, 950, 600, 320, 150];

  function crear(raiz, op = {}) {
    let total = 0;
    let i = 0;
    let timer = null;
    raiz.classList.add('reproductor');
    raiz.innerHTML = `
      <button type="button" class="rb" data-r="inicio" aria-label="Volver al primer paso" title="Primer paso"><span class="material-symbols-rounded">first_page</span></button>
      <button type="button" class="rb" data-r="ant" aria-label="Paso anterior" title="Paso anterior"><span class="material-symbols-rounded">chevron_left</span></button>
      <button type="button" class="rb play" data-r="play" aria-label="Reproducir" title="Reproducir"><span class="material-symbols-rounded">play_arrow</span></button>
      <button type="button" class="rb" data-r="sig" aria-label="Paso siguiente" title="Paso siguiente"><span class="material-symbols-rounded">chevron_right</span></button>
      <button type="button" class="rb" data-r="fin" aria-label="Ir al último paso" title="Último paso"><span class="material-symbols-rounded">last_page</span></button>
      <span class="contador"></span>
      <label class="velocidad"><span class="material-symbols-rounded">speed</span><span>Velocidad</span><input type="range" min="1" max="5" step="1" value="${op.velocidad || 3}" aria-label="Velocidad"></label>
      <div class="progreso"><i></i></div>`;
    const q = s => raiz.querySelector(s);
    const bPlay = q('[data-r=play]');
    const vel = q('input');

    const jugando = () => timer !== null;

    function pintar() {
      q('.contador').textContent = total ? `Paso ${i + 1} de ${total}` : 'Sin pasos';
      q('[data-r=inicio]').disabled = q('[data-r=ant]').disabled = i <= 0 || !total;
      q('[data-r=sig]').disabled = q('[data-r=fin]').disabled = i >= total - 1 || !total;
      bPlay.disabled = total <= 1;
      bPlay.querySelector('.material-symbols-rounded').textContent = jugando() ? 'pause' : (i >= total - 1 && total > 1 ? 'replay' : 'play_arrow');
      bPlay.setAttribute('aria-label', jugando() ? 'Pausar' : 'Reproducir');
      q('.progreso i').style.width = total > 1 ? `${(i / (total - 1)) * 100}%` : '0%';
    }

    function mostrar() {
      if (total && op.alMostrar) op.alMostrar(i);
      pintar();
    }

    function ir(k) {
      i = Math.max(0, Math.min(total - 1, k));
      mostrar();
    }

    function pausar() {
      if (timer) clearTimeout(timer);
      timer = null;
      pintar();
    }

    function paso() {
      timer = setTimeout(() => {
        if (i < total - 1) {
          i++;
          mostrar();
          if (i < total - 1) paso();
          else pausar();
        } else pausar();
      }, TIEMPOS[vel.value - 1]);
      pintar();
    }

    function reproducir() {
      if (total <= 1) return;
      todos.forEach(r => { if (r !== api) r.pausar(); });
      if (i >= total - 1) { i = 0; mostrar(); }
      paso();
    }

    function cargar(n, desde = 0, auto = false) {
      pausar();
      total = n;
      i = Math.max(0, Math.min(n - 1, desde));
      mostrar();
      if (auto) reproducir();
    }

    raiz.addEventListener('click', e => {
      const b = e.target.closest('[data-r]');
      if (!b || b.disabled) return;
      const r = b.dataset.r;
      if (r === 'play') { jugando() ? pausar() : reproducir(); return; }
      pausar();
      if (r === 'inicio') ir(0);
      else if (r === 'ant') ir(i - 1);
      else if (r === 'sig') ir(i + 1);
      else if (r === 'fin') ir(total - 1);
    });

    const api = { cargar, ir, pausar, reproducir, indice: () => i, total: () => total };
    todos.push(api);
    pintar();
    return api;
  }

  return { crear, pausarTodos: () => todos.forEach(r => r.pausar()) };
})();
