// Código compartido por todas las páginas: configuración, encabezado, pie, visor de PDF y datos.
// ---- Configuración editable ----
const SITIO = 'CDES UP';
const MENU = [['inicio','Inicio','/'],['nosotros','Nosotros','/nosotros'],['eventos','Eventos','/eventos'],['publicaciones','Publicaciones','/publicaciones']];
const SECCIONES = [ // "id" = nombre de la subcarpeta en minúsculas, sin tildes y con guiones
  {id:'reportes', nombre:'Reportes', desc:'Texto provisional: informes periódicos y documentos de seguimiento.'},
  {id:'investigaciones', nombre:'Investigaciones', desc:'Texto provisional: estudios y análisis de largo aliento.'},
  {id:'noticias', nombre:'Noticias', desc:'Texto provisional: comunicados y novedades del centro.'},
  {id:'propuestas-de-politica', nombre:'Propuestas de política', desc:'Texto provisional: recomendaciones para la toma de decisiones públicas.'},
];
// ---------------------------------
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const $ = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const url = r => r.split('/').map(encodeURIComponent).join('/');
const peso = b => b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1048576).toFixed(1) + ' MB';
const color = id => id && id !== 'otros' ? `var(--${id})` : 'var(--suave)';
const secNombre = id => (SECCIONES.find(s => s.id === id) || {nombre: 'Otros'}).nombre;
const fechaTxt = f => { if (!f) return ''; const [y, m, d] = f.split('-'); return d ? `${+d} de ${MESES[m-1]} de ${y}` : m ? `${MESES[m-1]} de ${y}` : y; };
const porFecha = (a, b) => (!a.fecha !== !b.fecha) ? (a.fecha ? -1 : 1) : (b.fecha || '').localeCompare(a.fecha || '') || a.titulo.localeCompare(b.titulo, 'es', {numeric: true});

// ---- Encabezado, pie y visor (se insertan en todas las páginas) ----
const pagina = document.body.dataset.pagina || '';
document.getElementById('cab').innerHTML = `<div class="ancho">
  <a class="marca" href="/" aria-label="CDES UP, inicio"><img class="logo" src="logo-blanco.png" alt="CDES UP" onerror="this.replaceWith(document.createTextNode('CDES UP'))"></a>
  <nav class="princ" id="nav" aria-label="Principal"></nav></div>`;
MENU.forEach(([i, n, h]) => { const a = $('a', '', n); a.href = h; if (i === pagina) a.setAttribute('aria-current', 'page'); document.getElementById('nav').append(a); });
document.getElementById('pie').innerHTML = `<div class="ancho"><b>CDES UP</b>Círculo de Desarrollo Económico y Social de la Universidad del Pacífico<br>Datos de contacto provisionales.</div>`;
document.body.insertAdjacentHTML('beforeend', `<dialog id="visor" aria-label="Vista previa del documento">
  <header><strong id="v-titulo"></strong><span>
    <a id="v-abrir" target="_blank" rel="noopener">Abrir en pestaña nueva</a>
    <a id="v-bajar" download>Descargar</a>
    <button id="v-cerrar" type="button">Cerrar</button></span></header>
  <iframe id="v-marco" title="Documento"></iframe></dialog>`);

// ---- Datos: lista de documentos generada por generar-indice.js ----
let _docs;
const cargarDocs = () => _docs ||= fetch('documentos.json').then(r => { if (!r.ok) throw 0; return r.json(); });

// ---- Visor de PDF ----
const visor = document.getElementById('visor'), marco = document.getElementById('v-marco');
const puedeVer = d => d.tipo === 'pdf' && navigator.pdfViewerEnabled && matchMedia('(min-width:700px)').matches;
function abrirVisor(d) {
  document.getElementById('v-titulo').textContent = d.titulo;
  document.getElementById('v-abrir').href = document.getElementById('v-bajar').href = url(d.ruta);
  marco.src = url(d.ruta); visor.showModal();
}
document.getElementById('v-cerrar').onclick = () => visor.close();
visor.addEventListener('click', e => { if (e.target === visor) visor.close(); });
visor.addEventListener('close', () => { marco.src = 'about:blank'; });

// ---- Lista de documentos ----
function itemDoc(d, conSeccion) {
  const li = $('li', 'doc'); li.style.setProperty('--c', color(d.seccion));
  const izq = $('div'), a = $('a', 'nombre', d.titulo); a.href = url(d.ruta); a.target = '_blank'; a.rel = 'noopener';
  a.onclick = e => { if (!(e.ctrlKey || e.metaKey || e.shiftKey) && puedeVer(d)) { e.preventDefault(); abrirVisor(d); } };
  const meta = $('div', 'meta');
  if (conSeccion) meta.append($('span', 'chip', secNombre(d.seccion)));
  if (d.subcategoria) meta.append($('span', '', d.subcategoria));
  if (d.fecha) meta.append($('span', '', fechaTxt(d.fecha)));
  meta.append($('span', '', d.tipo.toUpperCase()), $('span', '', peso(d.tamano)));
  izq.append(a, meta);
  const dl = $('a', '', 'Descargar'); dl.href = url(d.ruta); dl.setAttribute('download', '');
  li.append(izq, dl); return li;
}

