// Página de Publicaciones: listado con filtros y subsecciones (#reportes, #investigaciones, ...).
let docs = [], cargado = false, fallo = false;
const app = document.getElementById('app'), main = document.getElementById('contenido');

function listado(base, conSeccion) {
  const caja = $('div'), ctr = $('div', 'ctr'), lista = $('div'), cuenta = $('p', 'cuenta');
  const q = $('input'); q.type = 'search'; q.placeholder = 'Buscar por título'; q.setAttribute('aria-label', 'Buscar por título');
  const sel = (et, ops) => { const s = $('select'); s.setAttribute('aria-label', et); ops.forEach(([v, t]) => s.append(new Option(t, v))); s.onchange = pintar; return s; };
  const anios = [...new Set(base.map(d => d.anio).filter(Boolean))].sort((a, b) => b - a);
  const ys = sel('Año', [['', 'Todos los años'], ...anios.map(a => [a, a])]);
  const ss = conSeccion ? sel('Tipo de publicación', [['', 'Todos los tipos'], ...SECCIONES.map(s => [s.id, s.nombre])]) : null;
  const os = sel('Orden', [['rec', 'Más recientes'], ['ant', 'Más antiguos'], ['az', 'Nombre A–Z']]);
  q.oninput = pintar;
  ctr.append(q, ...(ss ? [ss] : []), ys, os);
  function pintar() {
    const t = q.value.trim().toLowerCase();
    const r = base.filter(d => (!t || d.titulo.toLowerCase().includes(t)) && (!ys.value || String(d.anio) === ys.value) && (!ss || !ss.value || d.seccion === ss.value));
    if (os.value === 'az') r.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es', {numeric: true}));
    else { r.sort(porFecha); if (os.value === 'ant') r.reverse(); }
    cuenta.textContent = r.length === 1 ? '1 documento' : r.length + ' documentos';
    lista.replaceChildren();
    if (!r.length) { lista.append($('p', 'vacio', base.length ? 'Ningún documento coincide con los filtros.' : 'Todavía no hay documentos en esta sección.')); return; }
    const grupos = new Map();
    r.forEach(d => { const k = os.value === 'az' ? '' : (d.anio || 'Sin fecha'); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(d); });
    grupos.forEach((arr, k) => { if (k) lista.append($('h3', '', k)); const ul = $('ul'); arr.forEach(d => ul.append(itemDoc(d, conSeccion))); lista.append(ul); });
  }
  pintar(); caja.append(ctr, cuenta, lista); return caja;
}

function publicaciones(id) {
  const f = document.createDocumentFragment(), sec = SECCIONES.find(s => s.id === id);
  const tabs = $('nav', 'tabs'); tabs.setAttribute('aria-label', 'Secciones de publicaciones');
  [['', 'Todas'], ...SECCIONES.map(s => [s.id, s.nombre])].forEach(([i, n]) => {
    const a = $('a', '', n); a.href = '#' + i;
    if (i === (id || '')) a.setAttribute('aria-current', 'page');
    if (i) a.style.setProperty('--c', color(i)); tabs.append(a);
  });
  f.append(tabs);
  if (id && !sec) { f.append($('h1', '', 'Sección no encontrada'), $('p', 'vacio', 'Elige una sección en el menú de arriba.')); return f; }
  if (!cargado) { f.append($('p', 'vacio', fallo ? 'No se pudo cargar la lista de documentos.' : 'Cargando…')); return f; }
  if (sec) {
    const h = $('div', 'cab-sec'); h.style.setProperty('--c', color(sec.id));
    h.append($('h1', '', sec.nombre), $('p', 'lead', sec.desc)); f.append(h, listado(docs.filter(d => d.seccion === sec.id), false));
  } else {
    f.append($('h1', '', 'Publicaciones'), $('p', 'lead', 'Texto provisional: elige un tipo de publicación o busca en todo el archivo.'));
    const g = $('div', 'tarjetas');
    SECCIONES.forEach(s => {
      const n = docs.filter(d => d.seccion === s.id).length, a = $('a', 'tarjeta'); a.href = '#' + s.id; a.style.setProperty('--c', color(s.id));
      a.append($('b', '', s.nombre), $('span', '', s.desc), $('small', '', n === 1 ? '1 documento' : n + ' documentos')); g.append(a);
    });
    f.append(g, $('h2', '', 'Todas las publicaciones'), listado(docs, true));
  }
  return f;
}

function render() {
  const id = location.hash.replace(/^#/, ''), sec = SECCIONES.find(s => s.id === id);
  document.title = (sec ? sec.nombre : 'Publicaciones') + ' | ' + SITIO;
  app.replaceChildren(publicaciones(id));
}
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); main.focus({preventScroll: true}); });
render();
cargarDocs().then(d => { docs = d; cargado = true; }).catch(() => { fallo = true; }).finally(render);
