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

