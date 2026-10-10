# 📄 Plataforma Web: Carta Abierta a los Grupos de Evaluación Fondecyt 2027

Esta plataforma web ha sido creada para visibilizar, difundir y reunir adhesiones de la comunidad científica frente a las declaraciones arbitrarias de **"fuera de bases"** en los concursos **Fondecyt Regular 2027** e **Iniciación en Investigación 2027**, originadas por el uso de español en la sección de Justificación de Recursos Solicitados dentro del Sistema de Postulación en Línea (SPL) de la ANID.

---

## 🚀 1. Cómo Probar la Web Inmediatamente en tu Computador

No necesitas instalar Node ni librerías adicionales. Solo necesitas Python (ya instalado en tu sistema):

1. Abre la terminal (PowerShell o CMD).
2. Entra a la carpeta del proyecto:
   ```powershell
   cd D:\Docencia\carta-fondecyt
   ```
3. Ejecuta el servidor:
   ```powershell
   python server.py
   ```
4. Abre tu navegador web en:
   👉 **http://localhost:8000**

El servidor creará automáticamente una base de datos local `firmas.db` (SQLite) con los primeros 3 firmantes del documento y guardará cada nueva firma que ingreses en el formulario.

---

## 🌐 2. Cómo Publicar la Web en Internet Gratuitamente (en 2 minutos)

Para que cualquier investigador o ciudadana pueda acceder a firmar desde su celular o computador, puedes publicarla en cualquiera de estas plataformas 100% gratuitas:

### Opción A: Vercel o Netlify (La más rápida y recomendada)
1. Ve a [Netlify Drop](https://app.netlify.com/drop) o [Vercel](https://vercel.com).
2. Arrastra la carpeta `D:\Docencia\carta-fondecyt` directamente al navegador.
3. ¡Listo! En 10 segundos tendrás un enlace público con certificado de seguridad SSL (https://...).

### Opción B: GitHub Pages
1. Crea un repositorio en GitHub (ej: `carta-fondecyt-2027`).
2. Sube los archivos de la carpeta.
3. Ve a **Settings > Pages** y selecciona la rama `main`.
4. Tu sitio estará publicado en `https://tu-usuario.github.io/carta-fondecyt-2027`.

---

## 📊 3. Conexión con Google Sheets (Para recibir todas las firmas en una hoja de cálculo en vivo)

Si publicas la web de forma estática (en GitHub Pages, Netlify o Vercel), puedes hacer que cada firma se guarde automáticamente en una planilla Google Sheet propia:

1. Crea una hoja en Google Drive: [https://sheets.new](https://sheets.new).
2. En la primera fila pon los encabezados:
   `Fecha | Nombre | Institución | Correo | Tipo | Concurso | Grupo | Folio | Comentario`
3. Ve a **Extensiones > Apps Script**.
4. Borra el código existente y pega el contenido del archivo `google-apps-script.js`.
5. Haz clic en **Implementar > Nueva implementación**.
6. Selecciona tipo **"Aplicación web"**, en *Quién tiene acceso* elige **"Cualquier usuario" (Anyone)**.
7. Copia la URL generada (termina en `/exec`).
8. Pega esa URL en el archivo `config.js` en la variable `googleSheetScriptUrl`:
   ```javascript
   googleSheetScriptUrl: "https://script.google.com/macros/s/TU_ID_AQUI/exec",
   ```
9. ¡Y listo! Todas las firmas se registrarán al instante en tu Google Sheet y se mostrarán en vivo en la web.

---

## 📢 4. Estrategia de Difusión y Visibilidad para Maximizar el Impacto

Para que la ANID y los Grupos de Evaluación atiendan esta grave falta, se recomienda articular la difusión en cuatro frentes:

### 1. Grupos de Evaluación (Los Destinatarios Directos)
- Identificar a los coordinadores e integrantes de los Grupos de Evaluación mencionados en la carta (los listados de miembros de grupos están disponibles en el sitio de ANID).
- Enviarles por correo institucional el enlace a la web y el PDF de la carta antes de que inicien la fase de evaluación técnica.

### 2. Canales Internos y Facultades (WhatsApp y Listas de Correo)
- Utilizar los botones de difusión integrados en la web para compartir el mensaje preformateado en grupos de WhatsApp de departamentos, sociedades científicas y claustros universitarios.
- Solicitar a las Vicerrectorías de Investigación (VRI) y Direcciones de Investigación que apoyen formalmente los recursos de reposición de sus académicos.

### 3. Sociedades Científicas y Asociaciones Gremiales
- Notificar a las directivas de sociedades relevantes (ej. Sociedad Chilena de Biología, Sociedad Chilena de Física, Colegio de Ingenieros, Red de Investigadoras, Asociación de Investigadores de Postgrado, etc.) para que emitan declaraciones públicas de respaldo.

### 4. Medios de Prensa y Opinión Pública
- Enviar el comunicado con el enlace web a medios de divulgación y prensa nacional:
  - **Qué Pasa / La Tercera** (sección Ciencia y Tecnología)
  - **El Mostrador** (sección Cultura y Ciencia)
  - **CIPER Chile**
  - **BioBioChile** y **Cooperativa**
- El sitio web ya cuenta con una sección especial de **Vocería y Contacto de Prensa**.

---

## 📁 Estructura de Archivos

- `index.html`: Página web principal con diseño académico, carta completa, formulario y nómina de adherentes.
- `styles.css`: Estilos visuales personalizados y reglas para impresión limpia en formato PDF.
- `app.js`: Lógica interactiva de adhesión, filtros por grupo e institución, y botones de difusión.
- `config.js`: Archivo de configuración rápida (enlaces, correo de prensa y Google Sheets).
- `server.py`: Servidor local en Python con base de datos SQLite lista para usar.
- `google-apps-script.js`: Código listo para conectar la web con Google Sheets sin costo.
