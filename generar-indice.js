// Recorre la carpeta "documentos" y genera documentos.json para la página.
// Uso: node generar-indice.js
const fs = require('fs');
const path = require('path');

const CARPETA = 'documentos';
const EXTENSIONES = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv',
]);

function recorrer(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entrada => {
    const ruta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) return recorrer(ruta);
    if (!EXTENSIONES.has(path.extname(entrada.name).toLowerCase())) return [];
    return [{ ruta, tamano: fs.statSync(ruta).size }];
  });
}

let documentos = [];
if (fs.existsSync(CARPETA)) {
  documentos = recorrer(CARPETA).map(({ ruta, tamano }) => {
    const partes = path.relative(CARPETA, ruta).split(path.sep);
    const archivo = partes.pop();
    return {
      nombre: path.parse(archivo).name.replace(/_/g, ' '),
      ruta: [CARPETA, ...partes, archivo].join('/'),
      categoria: partes.join(' / ') || 'General',
      tamano,
      tipo: path.extname(archivo).slice(1).toLowerCase(),
    };
  });
} else {
  console.warn(`Aviso: no existe la carpeta "${CARPETA}". Se genera una lista vacía.`);
}

fs.writeFileSync('documentos.json', JSON.stringify(documentos, null, 2));
console.log(`${documentos.length} documentos indexados en documentos.json`);
