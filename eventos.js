// Sección Eventos: próximos y pasados, con ventana emergente y carrusel de fotos.
// Lee eventos.json (generado por generar-indice.js). Usa $, url, fechaTxt y porFecha de sitio.js.
(() => {
  document.body.insertAdjacentHTML('beforeend', `<dialog class="ev-dlg" id="ev-dlg" aria-label="Detalle del evento">
    <button class="ev-x" id="ev-x" type="button">Cerrar</button>
    <div class="ev-galeria" id="ev-gal">
      <img id="ev-img" alt="">
      <button class="ev-nav ev-prev" id="ev-prev" type="button" aria-label="Foto anterior">‹</button>
      <button class="ev-nav ev-next" id="ev-next" type="button" aria-label="Foto siguiente">›</button>
      <span class="ev-cont" id="ev-cont"></span>
    </div>
    <div class="ev-texto">
      <p class="ev-fecha" id="ev-fecha"></p><h2 id="ev-tit"></h2><p class="ev-desc" id="ev-desc"></p>
      <a class="boton ev-insc" id="ev-insc" target="_blank" rel="noopener noreferrer" hidden>Inscribirse</a>
    </div></dialog>`);
  const g = id => document.getElementById(id);
  const dlg = g('ev-dlg'), img = g('ev-img'), contador = g('ev-cont'), galeria = g('ev-gal');
  let actual = null, pos = 0;

  function mostrar(n) {
    const fotos = actual.fotos;
    pos = (n + fotos.length) % fotos.length;
    img.src = url(fotos[pos]);
    img.alt = `${actual.titulo}, foto ${pos + 1} de ${fotos.length}`;
    contador.textContent = `${pos + 1} / ${fotos.length}`;
    if (fotos.length > 1) new Image().src = url(fotos[(pos + 1) % fotos.length]);
  }
  function abrir(ev) {
    actual = ev;
    g('ev-fecha').textContent = fechaTxt(ev.fecha);
    g('ev-tit').textContent = ev.titulo;
    g('ev-desc').textContent = ev.descripcion || 'Sin descripción.';
    const insc = g('ev-insc'); insc.hidden = !ev.inscripcion; if (ev.inscripcion) insc.href = ev.inscripcion;
    galeria.hidden = !ev.fotos.length;
    g('ev-prev').hidden = g('ev-next').hidden = contador.hidden = ev.fotos.length < 2;
    if (ev.fotos.length) mostrar(0);
    dlg.showModal(); dlg.scrollTop = 0;
  }
  g('ev-x').onclick = () => dlg.close();
  g('ev-prev').onclick = () => mostrar(pos - 1);
  g('ev-next').onclick = () => mostrar(pos + 1);
  dlg.addEventListener('keydown', e => {
    if (!actual || actual.fotos.length < 2) return;
    if (e.key === 'ArrowLeft') mostrar(pos - 1);
    if (e.key === 'ArrowRight') mostrar(pos + 1);
  });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => img.removeAttribute('src'));

  function tarjeta(ev) {
    const b = $('button', 'ev-card'); b.type = 'button';
    let portada;
    if (ev.fotos.length) {
      portada = $('img'); portada.src = url(ev.fotos[0]); portada.alt = ''; portada.loading = 'lazy'; portada.decoding = 'async';
    } else portada = $('span', 'ev-sinfoto');
    const info = $('span', 'ev-info');
    info.append($('span', 'ev-fecha', fechaTxt(ev.fecha)), $('span', 'ev-tit', ev.titulo), $('span', 'ev-res', ev.resumen));
    if (ev.inscripcion) info.append($('span', 'ev-tag', 'Inscripción disponible'));
    b.append(portada, info); b.onclick = () => abrir(ev); return b;
  }

  // Un evento próximo deja de mostrarse cuando su fecha ya pasó (compara según la precisión de la fecha).
  const d = new Date();
  const hoy = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const vigente = e => !e.fecha || e.fecha >= hoy.slice(0, e.fecha.length);
  const masCercano = (a, b) => (!a.fecha !== !b.fecha) ? (a.fecha ? -1 : 1)
    : a.fecha.localeCompare(b.fecha) || a.titulo.localeCompare(b.titulo, 'es');

  const prox = g('proximos'), pas = g('pasados');
  fetch('eventos.json').then(r => { if (!r.ok) throw 0; return r.json(); }).then(datos => {
    prox.replaceChildren(); pas.replaceChildren();

    const proximos = datos.proximos.filter(vigente).sort(masCercano);
    if (!proximos.length) prox.append($('p', 'vacio', 'No hay próximos eventos anunciados por ahora.'));
    else { const r = $('div', 'ev-grid'); proximos.forEach(e => r.append(tarjeta(e))); prox.append(r); }

    if (!datos.pasados.length) return pas.append($('p', 'vacio', 'Todavía no hay eventos pasados publicados.'));
    const grupos = new Map();
    datos.pasados.sort(porFecha).forEach(e => { const k = e.anio || 'Sin fecha'; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(e); });
    grupos.forEach((arr, k) => { const r = $('div', 'ev-grid'); arr.forEach(e => r.append(tarjeta(e))); pas.append($('h3', '', k), r); });
  }).catch(() => {
    const m = () => $('p', 'vacio', 'No se pudo cargar la lista de eventos.');
    prox.replaceChildren(m()); pas.replaceChildren(m());
  });
})();
