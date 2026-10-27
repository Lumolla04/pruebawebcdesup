// Sección Eventos: tarjetas de eventos pasados + ventana emergente con carrusel de fotos.
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
    const varias = ev.fotos.length > 1;
    galeria.hidden = !ev.fotos.length;
    g('ev-prev').hidden = g('ev-next').hidden = contador.hidden = !varias;
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
    b.append(portada, info); b.onclick = () => abrir(ev); return b;
  }

  const cont = g('pasados');
  fetch('eventos.json').then(r => { if (!r.ok) throw 0; return r.json(); }).then(lista => {
    cont.replaceChildren();
    if (!lista.length) return cont.append($('p', 'vacio', 'Todavía no hay eventos pasados publicados.'));
    const grupos = new Map();
    lista.sort(porFecha).forEach(e => { const k = e.anio || 'Sin fecha'; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(e); });
    grupos.forEach((arr, k) => { const r = $('div', 'ev-grid'); arr.forEach(e => r.append(tarjeta(e))); cont.append($('h3', '', k), r); });
  }).catch(() => cont.replaceChildren($('p', 'vacio', 'No se pudo cargar la lista de eventos.')));
})();
