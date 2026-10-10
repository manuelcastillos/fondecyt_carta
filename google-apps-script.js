/**
 * SCRIPT PARA CONECTAR EL SITIO WEB CON GOOGLE SHEETS
 * ====================================================
 * Instrucciones de instalación (2 minutos, 100% gratuito):
 * 
 * 1. Crea una hoja de cálculo nueva en Google Drive: https://sheets.new
 * 2. Nómbrala "Adherentes Carta Fondecyt 2027".
 * 3. En la primera fila (encabezados), escribe en las columnas A a H:
 *    A1: Fecha
 *    B1: Nombre
 *    C1: Institución
 *    D1: Correo
 *    E1: Tipo
 *    F1: Concurso
 *    G1: Grupo de Evaluación
 *    H1: Folio
 *    I1: Comentario
 * 
 * 4. Ve al menú superior: Extensiones > Apps Script.
 * 5. Borra todo lo que haya en el editor y pega este código completo.
 * 6. Haz clic en "Guardar" (ícono de disquete).
 * 7. Haz clic en "Implementar" (botón azul arriba a la derecha) > "Nueva implementación".
 * 8. En tipo selecciona "Aplicación web".
 * 9. Configuración:
 *    - Descripción: "API Adherentes Carta Fondecyt"
 *    - Ejecutar como: "Yo" (tu cuenta)
 *    - Quién tiene acceso: "Cualquier usuario" (Anyone)
 * 10. Haz clic en "Implementar", autoriza los permisos requeridos.
 * 11. Copia la URL de la aplicación web generada (termina en /exec) y pégala
 *     en config.js en el campo: googleSheetScriptUrl: "TU_URL_AQUI"
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var rows = [];
  
  // Empezar desde la fila 1 (ignorando encabezados en fila 0)
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row[1]) { // si tiene nombre
      rows.push({
        id: i,
        fecha: row[0],
        nombre: row[1],
        institucion: row[2],
        correo: row[3], // el cliente puede filtrar esto si es público
        tipo: row[4],
        concurso: row[5],
        grupo: row[6],
        folio: row[7],
        comentario: row[8]
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    total: rows.length,
    data: rows
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var body = {};
    
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      body = e.parameter;
    }
    
    var fecha = Utilities.formatDate(new Date(), "America/Santiago", "yyyy-MM-dd HH:mm:ss");
    var nombre = body.nombre || "";
    var institucion = body.institucion || "";
    var correo = body.correo || "";
    var tipo = body.tipo || "Investigador(a) Afectado(a)";
    var concurso = body.concurso || "Regular 2027";
    var grupo = body.grupo || "";
    var folio = body.folio || "";
    var comentario = body.comentario || "";
    
    // Validar duplicados por correo o nombre si se desea
    sheet.appendRow([
      fecha,
      nombre,
      institucion,
      correo,
      tipo,
      concurso,
      grupo,
      folio,
      comentario
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Adhesión registrada exitosamente."
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
