const Guia = (() => {
  const datos = {};
  let tour = null;

  const COLOR_TXT = { azul: 'azul', verde: 'verde', ambar: 'ámbar', rojo: 'rojo', violeta: 'violeta', gris: 'gris', negro: 'negro' };

  function registrar(id, d) {
    datos[id] = d;
  }

  function visible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && el.offsetParent !== null;
  }

  function cerrar() {
    document.querySelectorAll('.guia-fondo,.guia-panel').forEach(x => x.remove());
    document.removeEventListener('keydown', teclaPanel);
  }

  function teclaPanel(e) {
    if (e.key === 'Escape') cerrar();
  }

  function abrir(id) {
    const d = datos[id];
    if (!d) return;
    cerrar();
    terminarTour();
    const fondo = document.createElement('div');
    fondo.className = 'guia-fondo';
    const p = document.createElement('aside');
    p.className = 'guia-panel';
    p.setAttribute('role', 'dialog');
    p.setAttribute('aria-label', `Guía de ${d.titulo}`);
    const bloque = (icono, titulo, html) => html ? `<h4><span class="material-symbols-rounded">${icono}</span>${titulo}</h4>${html}` : '';
    p.innerHTML = `
      <div class="guia-cabeza">
        <span class="material-symbols-rounded">${d.icono || 'menu_book'}</span>
        <div><small>Guía</small><h3>${U.esc(d.titulo)}</h3></div>
        <button type="button" class="btn texto" data-cerrar aria-label="Cerrar guía"><span class="material-symbols-rounded">close</span></button>
      </div>
      <div class="guia-cuerpo">
        ${bloque('help', '¿Para qué sirve?', (d.paraQue || []).map(t => `<p>${t}</p>`).join(''))}
        ${d.ejemplo ? `<div class="aviso-c c-info"><span class="material-symbols-rounded">lightbulb</span><div><b>Ejemplo de la vida real</b><p>${d.ejemplo}</p></div></div>` : ''}
        ${bloque('format_list_numbered', 'Cómo se usa', d.pasos ? `<ol class="pasos-lista">${d.pasos.map(t => `<li>${t}</li>`).join('')}</ol>` : '')}
        ${bloque('tune', 'Qué hace cada parte', d.controles ? `<div class="guia-controles">${d.controles.map((c, k) => `
          <div class="guia-control">
            <span class="material-symbols-rounded">${c.icono || 'radio_button_checked'}</span>
            <div><b>${U.esc(c.nombre)}</b><p>${c.texto}</p>${c.sel ? `<button type="button" data-mostrar="${k}"><span class="material-symbols-rounded">my_location</span>Mostrar dónde está</button>` : ''}</div>
          </div>`).join('')}</div>` : '')}
        ${bloque('palette', 'Qué significan los colores', d.colores ? `<div class="leyenda-c" style="flex-direction:column;align-items:flex-start">${d.colores.map(([c, t]) => `<span><i class="sw sw-${c}"></i>${t}</span>`).join('')}</div>` : '')}
        ${(d.consejos || []).map(t => `<div class="aviso-c c-consejo"><span class="material-symbols-rounded">tips_and_updates</span><div><b>Consejo</b><p>${t}</p></div></div>`).join('')}
        ${(d.cuidado || []).map(t => `<div class="aviso-c c-cuidado"><span class="material-symbols-rounded">warning</span><div><b>Cuidado</b><p>${t}</p></div></div>`).join('')}
        ${d.complejidad ? `<div class="aviso-c c-especial"><span class="material-symbols-rounded">speed</span><div><b>Complejidad</b><p>${d.complejidad}</p></div></div>` : ''}
      </div>
      <div class="guia-pie">
        ${d.controles ? '<button type="button" class="btn lleno" data-tour><span class="material-symbols-rounded">tour</span>Recorrido guiado</button>' : ''}
        <button type="button" class="btn tonal" data-cerrar>Entendido</button>
      </div>`;
    document.body.append(fondo, p);
    fondo.addEventListener('click', cerrar);
    p.addEventListener('click', e => {
      if (e.target.closest('[data-cerrar]')) cerrar();
      else if (e.target.closest('[data-tour]')) { cerrar(); recorrido(id); }
      else {
        const b = e.target.closest('[data-mostrar]');
        if (b) { cerrar(); recorrido(id, +b.dataset.mostrar, true); }
      }
    });
    document.addEventListener('keydown', teclaPanel);
    setTimeout(() => p.querySelector('[data-cerrar]').focus(), 50);
  }

  function pasosTour(id) {
    const d = datos[id];
    const lista = [{ titulo: d.titulo, texto: d.resumen || (d.paraQue || [''])[0] }];
    (d.controles || []).forEach((c, k) => { if (c.sel) lista.push({ sel: c.sel, clic: c.clic, titulo: c.nombre, texto: c.texto, k }); });
    lista.push({ titulo: '¡Listo!', texto: 'Ya conoces cada parte. Puedes volver a abrir esta guía cuando quieras con el botón «Guía».' });
    return lista;
  }

  function terminarTour() {
    if (!tour) return;
    tour.nodos.forEach(n => n.remove());
    window.removeEventListener('resize', tour.pos);
    window.removeEventListener('scroll', tour.pos, true);
    document.removeEventListener('keydown', tour.tecla);
    tour = null;
  }

  function recorrido(id, desdeControl = null, solo = false) {
    const d = datos[id];
    if (!d) return;
    terminarTour();
    let pasos = pasosTour(id);
    if (desdeControl !== null) {
      const k = pasos.findIndex(x => x.k === desdeControl);
      pasos = solo && k >= 0 ? [pasos[k]] : pasos;
    }
    const capa = document.createElement('div');
    capa.className = 'tour-capa';
    const foco = document.createElement('div');
    foco.className = 'tour-foco';
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tour-tarjeta';
    tarjeta.setAttribute('role', 'dialog');
    document.body.append(capa, foco, tarjeta);
    let idx = 0;
    let objetivo = null;

    function posicionar() {
      const vw = window.innerWidth, vh = window.innerHeight;
      const tw = tarjeta.offsetWidth, th = tarjeta.offsetHeight;
      if (!objetivo) {
        foco.style.cssText = `top:${vh / 2}px;left:${vw / 2}px;width:0;height:0;box-shadow:0 0 0 9999px rgba(10,10,10,.58)`;
        tarjeta.style.top = `${Math.max(12, (vh - th) / 2)}px`;
        tarjeta.style.left = `${Math.max(12, (vw - tw) / 2)}px`;
        return;
      }
      const r = objetivo.getBoundingClientRect();
      const m = 8;
      const top = Math.max(4, r.top - m), left = Math.max(4, r.left - m);
      const w = Math.min(vw - left - 4, r.width + 2 * m), h = Math.min(vh - top - 4, r.height + 2 * m);
      foco.style.cssText = `top:${top}px;left:${left}px;width:${w}px;height:${h}px`;
      let ty = top + h + 12;
      if (ty + th > vh - 8) ty = top - th - 12;
      if (ty < 8) ty = Math.min(vh - th - 8, Math.max(8, top + 12));
      let tx = Math.min(Math.max(12, left), vw - tw - 12);
      tarjeta.style.top = `${ty}px`;
      tarjeta.style.left = `${tx}px`;
    }

    function mostrar() {
      const s = pasos[idx];
      if (s.clic) {
        const c = document.querySelector(s.clic);
        if (c && !c.classList.contains('activo')) c.click();
      }
      objetivo = s.sel ? document.querySelector(s.sel) : null;
      if (s.sel && !visible(objetivo)) {
        if (idx < pasos.length - 1) { idx++; return mostrar(); }
        objetivo = null;
      }
      if (objetivo) {
        const r = objetivo.getBoundingClientRect();
        if (r.top < 70 || r.bottom > window.innerHeight - 90) objetivo.scrollIntoView({ block: r.height > window.innerHeight * 0.6 ? 'start' : 'center' });
      }
      const puntos = pasos.length > 1 ? `<div class="tour-puntos">${pasos.map((_, k) => `<i class="${k === idx ? 'on' : ''}"></i>`).join('')}</div>` : '';
      tarjeta.innerHTML = `
        <small>${pasos.length > 1 ? `Paso ${idx + 1} de ${pasos.length}` : 'Guía'}</small>
        <h4>${U.esc(s.titulo)}</h4>
        <p>${s.texto}</p>
        ${puntos}
        <div class="tour-botones">
          <button type="button" class="btn texto" data-t="salir">${pasos.length > 1 ? 'Salir' : 'Cerrar'}</button>
          <span class="espacio"></span>
          ${idx > 0 ? '<button type="button" class="btn tonal" data-t="ant"><span class="material-symbols-rounded">chevron_left</span></button>' : ''}
          ${pasos.length > 1 ? `<button type="button" class="btn lleno" data-t="sig">${idx === pasos.length - 1 ? 'Terminar' : 'Siguiente'}${idx === pasos.length - 1 ? '' : '<span class="material-symbols-rounded">chevron_right</span>'}</button>` : ''}
        </div>`;
      requestAnimationFrame(posicionar);
      setTimeout(posicionar, 60);
      const b = tarjeta.querySelector('[data-t=sig]') || tarjeta.querySelector('[data-t=salir]');
      if (b) b.focus({ preventScroll: true });
    }

    tarjeta.addEventListener('click', e => {
      const b = e.target.closest('[data-t]');
      if (!b) return;
      if (b.dataset.t === 'salir') return terminarTour();
      if (b.dataset.t === 'ant') { idx = Math.max(0, idx - 1); return mostrar(); }
      if (idx >= pasos.length - 1) return terminarTour();
      idx++;
      mostrar();
    });
    capa.addEventListener('click', terminarTour);
    let pend = false;
    const pos = () => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; posicionar(); }); };
    const tecla = e => {
      if (e.key === 'Escape') terminarTour();
      else if (e.key === 'ArrowRight' && idx < pasos.length - 1) { idx++; mostrar(); }
      else if (e.key === 'ArrowLeft' && idx > 0) { idx--; mostrar(); }
    };
    window.addEventListener('resize', pos);
    window.addEventListener('scroll', pos, true);
    document.addEventListener('keydown', tecla);
    tour = { nodos: [capa, foco, tarjeta], pos, tecla };
    mostrar();
  }

  function quiz(cont) {
    const d = datos[cont.dataset.quiz];
    if (!d || !d.preguntas) return;
    let bien = 0, hechas = 0;
    const total = d.preguntas.length;
    cont.innerHTML = `
      <div class="quiz-cabeza"><span class="material-symbols-rounded">quiz</span><b>Ponte a prueba</b><span class="puntaje">0 / ${total}</span></div>
      <p class="ayuda" style="margin:0"><span>Responde para comprobar si entendiste. Toca una opción.</span></p>
      ${d.preguntas.map((q, k) => `
        <div class="pregunta" data-k="${k}">
          <p>${k + 1}. ${q.p}</p>
          <div class="opciones-q">${q.o.map((o, j) => `<button type="button" data-j="${j}"><span class="material-symbols-rounded">radio_button_unchecked</span><span>${o}</span></button>`).join('')}</div>
        </div>`).join('')}`;
    cont.addEventListener('click', e => {
      const b = e.target.closest('.opciones-q button');
      if (!b || b.disabled) return;
      const pr = b.closest('.pregunta');
      const q = d.preguntas[+pr.dataset.k];
      const j = +b.dataset.j;
      pr.querySelectorAll('button').forEach(x => {
        x.disabled = true;
        const jj = +x.dataset.j;
        if (jj === q.c) { x.classList.add('bien'); x.querySelector('.material-symbols-rounded').textContent = 'check_circle'; }
        else if (jj === j) { x.classList.add('mal'); x.querySelector('.material-symbols-rounded').textContent = 'cancel'; }
      });
      hechas++;
      if (j === q.c) bien++;
      const ex = document.createElement('p');
      ex.className = 'explica-q';
      ex.innerHTML = `<b style="color:var(--${j === q.c ? 'verde' : 'rojo'}-t)">${j === q.c ? '¡Correcto!' : 'No exactamente.'}</b> ${q.e}`;
      pr.append(ex);
      cont.querySelector('.puntaje').textContent = `${bien} / ${total}${hechas === total ? (bien === total ? ' · ¡perfecto!' : '') : ''}`;
    });
  }

  function recordarAprende() {
    document.querySelectorAll('.vista details.aprende').forEach(d => {
      const clave = 'grafolab.aprende.' + d.closest('.vista').id;
      try { if (localStorage.getItem(clave) === 'cerrado') d.open = false; } catch (e) {}
      d.addEventListener('toggle', () => {
        try { localStorage.setItem(clave, d.open ? 'abierto' : 'cerrado'); } catch (e) {}
      });
    });
  }

  function init() {
    document.querySelectorAll('[data-quiz]').forEach(quiz);
    recordarAprende();
    document.addEventListener('click', e => {
      const g = e.target.closest('[data-guia]');
      if (g) { abrir(g.dataset.guia); return; }
      const t = e.target.closest('[data-recorrido]');
      if (t) { recorrido(t.dataset.recorrido); return; }
      const ag = e.target.closest('[data-abrir-guia]');
      if (ag) { App.ir(ag.dataset.abrirGuia); setTimeout(() => abrir(ag.dataset.abrirGuia), 120); return; }
      const ar = e.target.closest('[data-abrir-recorrido]');
      if (ar) { App.ir(ar.dataset.abrirRecorrido); setTimeout(() => recorrido(ar.dataset.abrirRecorrido), 350); }
    });
  }

  return { registrar, abrir, recorrido, cerrar, terminarTour, init, datos, COLOR_TXT };
})();
