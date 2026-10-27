// Recorre la carpeta "Publicaciones" (sin importar mayúsculas) y genera documentos.json.
// Estructura esperada: Publicaciones/<Sección>/[subcarpeta opcional]/archivo.pdf
// Nombre de archivo recomendado: 2026-03_Titulo_del_documento.pdf (fecha opcional: AAAA, AAAA-MM o AAAA-MM-DD)
const fs = require('fs');
const path = require('path');

const EXTENSIONES = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv']);

const slug = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const raiz = fs.readdirSync('.', { withFileTypes: true })
  .find(e => e.isDirectory() && slug(e.name) === 'publicaciones');

function recorrer(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const ruta = path.join(dir, e.name);
    if (e.isDirectory()) return recorrer(ruta);
    if (!EXTENSIONES.has(path.extname(e.name).toLowerCase())) return [];
    return [{ ruta, tamano: fs.statSync(ruta).size }];
  });
}

function interpretar(base) {
  const m = base.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?[_\s-]+(.+)$/);
  if (m && (!m[2] || (+m[2] >= 1 && +m[2] <= 12)) && (!m[3] || (+m[3] >= 1 && +m[3] <= 31))) {
    return { fecha: [m[1], m[2], m[3]].filter(Boolean).join('-'), titulo: m[4] };
  }
  return { fecha: '', titulo: base };
}

let documentos = [];
if (raiz) {
  documentos = recorrer(raiz.name).map(({ ruta, tamano }) => {
    const partes = path.relative(raiz.name, ruta).split(path.sep);
    const archivo = partes.pop();
    const { fecha, titulo } = interpretar(path.parse(archivo).name);
    return {
      titulo: titulo.replace(/_/g, ' ').trim(),
      ruta: [raiz.name, ...partes, archivo].join('/'),
      seccion: partes.length ? slug(partes[0]) : 'otros',
      subcategoria: partes.slice(1).join(' / '),
      fecha,
      anio: fecha ? Number(fecha.slice(0, 4)) : null,
      tamano,
      tipo: path.extname(archivo).slice(1).toLowerCase(),
    };
  });
} else {
  console.warn('Aviso: no se encontró la carpeta "Publicaciones". Se genera una lista vacía.');
}

fs.writeFileSync('documentos.json', JSON.stringify(documentos, null, 2));
console.log(`${documentos.length} documentos indexados en documentos.json`);

// ---- Eventos pasados: Eventos/Eventos Pasados/<AAAA-MM-DD Título>/ ----
// Cada carpeta de evento contiene: descripcion.txt, fotos (jpg, png, webp...) y, opcionalmente, portada.jpg
const IMAGENES = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const subcarpeta = (dir, nombre) =>
  fs.readdirSync(dir, { withFileTypes: true }).find(e => e.isDirectory() && slug(e.name) === nombre);

const carpetaEventos = subcarpeta('.', 'eventos');
const carpetaPasados = carpetaEventos && subcarpeta(carpetaEventos.name, 'eventos-pasados');
let eventos = [];
if (carpetaPasados) {
  const base = path.join(carpetaEventos.name, carpetaPasados.name);
  eventos = fs.readdirSync(base, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => {
    const dir = path.join(base, e.name);
    const archivos = fs.readdirSync(dir).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
    const imagenes = archivos.filter(f => IMAGENES.has(path.extname(f).toLowerCase()));
    const esPortada = f => slug(path.parse(f).name) === 'portada';
    const fotos = [...imagenes.filter(esPortada), ...imagenes.filter(f => !esPortada(f))]
      .map(f => [carpetaEventos.name, carpetaPasados.name, e.name, f].join('/'));
    const txt = archivos.find(f => slug(f) === 'descripcion-txt');
    const descripcion = txt
      ? fs.readFileSync(path.join(dir, txt), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim()
      : '';
    const { fecha, titulo } = interpretar(e.name);
    return {
      titulo: titulo.replace(/_/g, ' ').trim(),
      fecha,
      anio: fecha ? Number(fecha.slice(0, 4)) : null,
      resumen: descripcion.split(/\n\s*\n/)[0].replace(/\s*\n\s*/g, ' '),
      descripcion,
      fotos,
    };
  });
}
fs.writeFileSync('eventos.json', JSON.stringify(eventos, null, 2));
console.log(`${eventos.length} eventos pasados indexados en eventos.json`);
