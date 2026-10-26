const U = {
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  letra(i) {
    let s = '';
    i++;
    while (i > 0) {
      const r = (i - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      i = Math.floor((i - 1) / 26);
    }
    return s;
  },

  num(v) {
    const t = String(v ?? '').trim().replace(',', '.');
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : NaN;
  },

  marcar(cont, valor) {
    cont.querySelectorAll('button[data-valor]').forEach(b => b.classList.toggle('activo', b.dataset.valor === valor));
  },

  leerCelda(v, permitirM) {
    const t = String(v ?? '').trim();
    if (t === '' || t === '-' || t === '—') return { v: null };
    if (permitirM && /^(m|x|∞|inf)$/i.test(t)) return { v: Infinity };
    const n = U.num(t);
    return Number.isNaN(n) ? { malo: true } : { v: n };
  },

  nombreArchivo(s, porDefecto) {
    const t = String(s || '').trim().replace(/\.(json|png)$/i, '').replace(/[\\/:*?"<>|]+/g, '-');
    return t || porDefecto;
  },

  aviso(texto) {
    const s = document.getElementById('snackbar');
    s.textContent = texto;
    s.classList.add('visible');
    clearTimeout(U._t);
    U._t = setTimeout(() => s.classList.remove('visible'), 3200);
  },

  descargarBlob(nombre, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  },

  descargarJSON(nombre, obj) {
    U.descargarBlob(nombre, new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
  },

  leerArchivo(accept) {
    return new Promise(resolver => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = accept;
      inp.style.display = 'none';
      inp.addEventListener('change', () => {
        const f = inp.files[0];
        inp.remove();
        if (!f) return;
        const lector = new FileReader();
        lector.onload = () => resolver({ nombre: f.name, texto: String(lector.result) });
        lector.readAsText(f);
      });
      document.body.appendChild(inp);
      inp.click();
    });
  },

  dialogo({ titulo, texto = '', campos = [], aceptar = 'Aceptar', cancelar = 'Cancelar' }) {
    return new Promise(resolver => {
      const fondo = document.getElementById('dialogo');
      const form = document.getElementById('dialogo-form');
      const cont = document.getElementById('dialogo-campos');
      const bAceptar = document.getElementById('dialogo-aceptar');
      const bCancelar = document.getElementById('dialogo-cancelar');
      const pTexto = document.getElementById('dialogo-texto');
      document.getElementById('dialogo-titulo').textContent = titulo;
      pTexto.textContent = texto;
      pTexto.hidden = !texto;
      cont.innerHTML = '';
      cont.hidden = !campos.length;
      campos.forEach(c => {
        const l = document.createElement('label');
        if (c.tipo === 'checkbox') {
          l.className = 'check';
          l.innerHTML = `<input type="checkbox" name="${c.id}" ${c.valor ? 'checked' : ''}><span>${U.esc(c.etiqueta)}</span>`;
        } else if (c.tipo === 'select') {
          l.className = 'campo';
          l.innerHTML = `<span>${U.esc(c.etiqueta)}</span><select name="${c.id}">${c.opciones.map(o => `<option value="${U.esc(o.valor)}" ${o.valor === c.valor ? 'selected' : ''}>${U.esc(o.texto)}</option>`).join('')}</select>`;
        } else {
          l.className = 'campo';
          const extra = c.tipo === 'number' ? 'inputmode="decimal"' : '';
          l.innerHTML = `<span>${U.esc(c.etiqueta)}</span><input name="${c.id}" type="text" ${extra} value="${U.esc(c.valor ?? '')}" autocomplete="off">`;
        }
        cont.appendChild(l);
      });
      bAceptar.textContent = aceptar;
      bCancelar.textContent = cancelar;
      fondo.hidden = false;
      setTimeout(() => {
        const primero = cont.querySelector('input:not([type=checkbox]),select');
        if (primero) {
          primero.focus();
          if (primero.select) primero.select();
        } else bAceptar.focus();
      }, 40);
      const cerrar = valor => {
        fondo.hidden = true;
        form.onsubmit = null;
        bCancelar.onclick = null;
        fondo.onkeydown = null;
        fondo.onpointerdown = null;
        resolver(valor);
      };
      form.onsubmit = e => {
        e.preventDefault();
        const r = {};
        campos.forEach(c => {
          const i = form.querySelector(`[name="${c.id}"]`);
          r[c.id] = c.tipo === 'checkbox' ? i.checked : i.value;
        });
        cerrar(r);
      };
      bCancelar.onclick = () => cerrar(null);
      fondo.onkeydown = e => { if (e.key === 'Escape') cerrar(null); };
      fondo.onpointerdown = e => { if (e.target === fondo) cerrar(null); };
    });
  }
};