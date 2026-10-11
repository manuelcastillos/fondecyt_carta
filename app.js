// Lógica de cliente para la campaña Carta Fondecyt 2027

// Firmantes iniciales fundacionales del documento original de Google Docs
const FIRMANTES_BASE = [
  {
    id: 1,
    fecha: "2026-10-09 10:00:00",
    nombre: "Manuel Castillo Silva",
    institucion: "Universidad de Valparaíso",
    correo: "",
    tipo: "Investigador(a) Afectado(a)",
    concurso: "Regular 2027",
    grupo: "Ciencias de la Tierra",
    folio: "",
    comentario: "Convocante. Afectado por exclusión de justificación de recursos en plataforma SPL."
  },
  {
    id: 2,
    fecha: "2026-10-09 10:05:00",
    nombre: "Angélica Escobar Maldonado",
    institucion: "Universidad de Valparaíso",
    correo: "",
    tipo: "Investigador(a) Afectado(a)",
    concurso: "Regular 2027",
    grupo: "Biología 3",
    folio: "1272708",
    comentario: "Postulación desestimada por redacción en español en justificación de recursos."
  },
  {
    id: 3,
    fecha: "2026-10-09 10:10:00",
    nombre: "Daniel Ramírez Ruiz",
    institucion: "Universidad de Valparaíso",
    correo: "",
    tipo: "Investigador(a) Afectado(a)",
    concurso: "Regular 2027",
    grupo: "Ingeniería 1",
    folio: "1271540",
    comentario: "Formulación técnica y científica presentada 100% en inglés."
  },
  {
    id: 4,
    fecha: "2026-10-09 10:15:00",
    nombre: "Jonathan Martínez Pinto",
    institucion: "Universidad de Valparaíso",
    correo: "",
    tipo: "Investigador(a) Afectado(a)",
    concurso: "Regular 2027",
    grupo: "Inter-Trans Disciplinario",
    folio: "1272745",
    comentario: "Exclusión desproporcionada generada por ambigüedad del sistema SPL."
  },
  {
    id: 5,
    fecha: "2026-10-09 10:20:00",
    nombre: "Evandro Ferrada Poblete",
    institucion: "Universidad de Valparaíso",
    correo: "",
    tipo: "Investigador(a) Afectado(a)",
    concurso: "Regular 2027",
    grupo: "Biología 1",
    folio: "1271725",
    comentario: "Formulación técnica y científica presentada íntegramente en inglés."
  }
];

let adherentesData = [];
let backendType = "local"; // "api", "google_sheets", o "local"

document.addEventListener("DOMContentLoaded", () => {
  aplicarConfiguracion();
  cargarAdherentes();
  inicializarFiltroGrupos();

  // Escuchar envío del formulario
  const form = document.getElementById("adhesion-form");
  if (form) {
    form.addEventListener("submit", manejarEnvioFormulario);
  }
});

// Aplica enlaces y valores definidos en config.js
function aplicarConfiguracion() {
  if (typeof CONFIG !== "undefined") {
    if (CONFIG.googleDocUrl) {
      const btnDoc = document.getElementById("btn-google-doc");
      const footerDoc = document.getElementById("footer-google-doc");
      if (btnDoc) btnDoc.href = CONFIG.googleDocUrl;
      if (footerDoc) footerDoc.href = CONFIG.googleDocUrl;
    }
    if (CONFIG.contactEmail) {
      const linkEmail = document.getElementById("link-contact-email");
      if (linkEmail) {
        linkEmail.href = `mailto:${CONFIG.contactEmail}`;
        linkEmail.textContent = CONFIG.contactEmail;
      }
    }
  }
}

// Cargar lista de adherentes según el entorno disponible
async function cargarAdherentes() {
  // 1. Intentar API local si existe (servidor Python)
  try {
    const res = await fetch("/api/adherentes", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json && json.data) {
        adherentesData = json.data;
        backendType = "api";
        actualizarVista();
        return;
      }
    }
  } catch (e) {
    // No hay servidor Python local activo, continuar al siguiente
  }

  // 2. Si hay Google Sheets Web App configurado en config.js
  if (typeof CONFIG !== "undefined" && CONFIG.googleSheetScriptUrl && CONFIG.googleSheetScriptUrl.startsWith("http")) {
    try {
      const res = await fetch(CONFIG.googleSheetScriptUrl);
      if (res.ok) {
        const json = await res.json();
        if (json && json.data && json.data.length > 0) {
          // Combinar con base
          adherentesData = combinarAdherentes(FIRMANTES_BASE, json.data);
          backendType = "google_sheets";
          actualizarVista();
          return;
        }
      }
    } catch (e) {
      console.warn("No se pudo cargar desde Google Sheets:", e);
    }
  }

  // 3. Fallback: LocalStorage + Firmantes Base
  const almacenados = localStorage.getItem("fondecyt_adherentes_2027");
  if (almacenados) {
    try {
      let parsed = JSON.parse(almacenados);
      let corregido = false;
      // Corregir o remover entradas con "Manue Castillo"
      parsed = parsed.filter(item => {
        const nom = (item.nombre || "").trim().toLowerCase();
        if (nom.startsWith("manue castillo") || nom === "manue castillo silva") {
          corregido = true;
          return false; // se excluye porque ya está en FIRMANTES_BASE corregido
        }
        return true;
      });
      if (corregido) {
        localStorage.setItem("fondecyt_adherentes_2027", JSON.stringify(parsed));
      }
      adherentesData = combinarAdherentes(FIRMANTES_BASE, parsed);
    } catch (e) {
      adherentesData = [...FIRMANTES_BASE];
    }
  } else {
    adherentesData = [...FIRMANTES_BASE];
  }
  
  backendType = "local";
  actualizarVista();
}

// Combina listas evitando duplicados por nombre exacto y corrigiendo erratas
function combinarAdherentes(base, extras) {
  const map = new Map();
  
  // Función para normalizar nombres y corregir erratas comunes
  const normalizarNombre = (nombre) => {
    let n = (nombre || "").trim();
    if (n.toLowerCase().startsWith("manue castillo")) {
      return "Manuel Castillo Silva";
    }
    return n;
  };

  base.forEach(item => {
    item.nombre = normalizarNombre(item.nombre);
    map.set(item.nombre.toLowerCase(), item);
  });

  extras.forEach(item => {
    item.nombre = normalizarNombre(item.nombre);
    const key = item.nombre.toLowerCase();
    if (key && !map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values());
}

// Actualizar tabla, métricas y filtros
function actualizarVista() {
  renderizarTabla(adherentesData);
  actualizarEstadisticas();
  if (window.lucide) {
    lucide.createIcons();
  }
}

// Renderizar filas en la tabla
function renderizarTabla(lista) {
  const tbody = document.getElementById("tbody-adherentes");
  const conteoEl = document.getElementById("conteo-firmas");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (conteoEl) {
    conteoEl.textContent = `Mostrando ${lista.length} de ${adherentesData.length} adherentes registrados`;
  }

  if (lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-8 text-slate-400 text-sm">
          No se encontraron adherentes que coincidan con los filtros de búsqueda.
        </td>
      </tr>
    `;
    return;
  }

  lista.forEach((adherente, index) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50/80 transition-colors row-animate";

    // Badge según tipo
    let tipoBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">${adherente.tipo || 'Adherente'}</span>`;
    if ((adherente.tipo || '').includes("Afectado")) {
      tipoBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-800">Afectado(a)</span>`;
    } else if ((adherente.tipo || '').includes("Evaluador")) {
      tipoBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">Evaluador(a)</span>`;
    } else if ((adherente.tipo || '').includes("Solidario")) {
      tipoBadge = `<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">Solidario(a)</span>`;
    }

    const folioText = adherente.folio ? `<span class="font-mono text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">${adherente.folio}</span>` : `<span class="text-slate-300">-</span>`;

    tr.innerHTML = `
      <td class="py-3 px-4 text-center text-xs font-mono text-slate-400">${index + 1}</td>
      <td class="py-3 px-4 font-semibold text-slate-900">
        <div>${escapeHtml(adherente.nombre)}</div>
        ${adherente.comentario ? `<div class="text-[11px] text-slate-500 font-normal italic mt-0.5 max-w-xs truncate" title="${escapeHtml(adherente.comentario)}">"${escapeHtml(adherente.comentario)}"</div>` : ''}
      </td>
      <td class="py-3 px-4 text-slate-700 text-xs sm:text-sm">${escapeHtml(adherente.institucion)}</td>
      <td class="py-3 px-4">
        <div class="flex flex-col gap-1 items-start">
          ${tipoBadge}
          <span class="text-[11px] text-slate-500">${escapeHtml(adherente.concurso || '')}</span>
        </div>
      </td>
      <td class="py-3 px-4 text-xs sm:text-sm font-medium text-slate-800">${escapeHtml(adherente.grupo || 'No especificado')}</td>
      <td class="py-3 px-4 text-center">${folioText}</td>
    `;

    tbody.appendChild(tr);
  });
}

// Calcular y mostrar estadísticas en las tarjetas de Hero
function actualizarEstadisticas() {
  const statTotal = document.getElementById("stat-total");
  const statAfectados = document.getElementById("stat-afectados");
  const statInstituciones = document.getElementById("stat-instituciones");
  const statGrupos = document.getElementById("stat-grupos");

  const total = adherentesData.length;
  const afectados = adherentesData.filter(a => (a.tipo || '').includes("Afectado")).length;
  
  const institucionesUnicas = new Set(
    adherentesData.map(a => (a.institucion || '').trim().toLowerCase()).filter(Boolean)
  ).size;

  const gruposUnicos = new Set(
    adherentesData.map(a => (a.grupo || '').trim()).filter(g => g && g !== 'Otro' && g !== 'No especificado')
  ).size;

  if (statTotal) statTotal.textContent = total;
  if (statAfectados) statAfectados.textContent = afectados;
  if (statInstituciones) statInstituciones.textContent = institucionesUnicas;
  if (statGrupos) statGrupos.textContent = gruposUnicos;
}

// Rellenar dinámicamente opciones del filtro de Grupos de Evaluación
function inicializarFiltroGrupos() {
  const selectFiltro = document.getElementById("filtro-grupo");
  const selectForm = document.getElementById("input-grupo");
  if (!selectFiltro || !selectForm) return;

  const grupos = Array.from(selectForm.options)
    .map(opt => opt.value)
    .filter(val => val && val !== "Otro");

  grupos.forEach(grupo => {
    const opt = document.createElement("option");
    opt.value = grupo;
    opt.textContent = grupo;
    selectFiltro.appendChild(opt);
  });
}

// Filtrar en tiempo real tabla de adherentes
function filtrarAdherentes() {
  const q = (document.getElementById("filtro-busqueda")?.value || "").toLowerCase().trim();
  const filtroTipo = document.getElementById("filtro-tipo")?.value || "todos";
  const filtroGrupo = document.getElementById("filtro-grupo")?.value || "todos";

  const filtrados = adherentesData.filter(item => {
    // Texto de búsqueda
    const coincideTexto = !q || 
      (item.nombre || "").toLowerCase().includes(q) ||
      (item.institucion || "").toLowerCase().includes(q) ||
      (item.comentario || "").toLowerCase().includes(q) ||
      (item.folio || "").includes(q);

    // Tipo
    let coincideTipo = true;
    if (filtroTipo !== "todos") {
      coincideTipo = (item.tipo || "").toLowerCase().includes(filtroTipo.toLowerCase());
    }

    // Grupo
    let coincideGrupo = true;
    if (filtroGrupo !== "todos") {
      coincideGrupo = (item.grupo || "") === filtroGrupo;
    }

    return coincideTexto && coincideTipo && coincideGrupo;
  });

  renderizarTabla(filtrados);
}

// Ajustar campos visibles del formulario según el rol
function toggleFormFields() {
  const tipoSeleccionado = document.querySelector('input[name="tipo"]:checked')?.value || "";
  const wrapperFolio = document.getElementById("wrapper-folio");
  const inputConcurso = document.getElementById("input-concurso");

  if (wrapperFolio) {
    if (tipoSeleccionado.includes("Afectado")) {
      wrapperFolio.classList.remove("hidden");
    } else {
      wrapperFolio.classList.add("hidden");
    }
  }

  if (inputConcurso && tipoSeleccionado.includes("Solidario")) {
    inputConcurso.value = "Comunidad Científica";
  }
}

// Manejar registro de nueva firma
async function manejarEnvioFormulario(e) {
  e.preventDefault();

  const btnSubmit = document.getElementById("btn-submit");
  const btnSubmitText = document.getElementById("btn-submit-text");
  const alertSuccess = document.getElementById("form-alert-success");
  const alertError = document.getElementById("form-alert-error");

  const nombre = document.getElementById("input-nombre").value.trim();
  const institucion = document.getElementById("input-institucion").value.trim();
  const correo = document.getElementById("input-correo").value.trim();
  const tipo = document.querySelector('input[name="tipo"]:checked')?.value || "Investigador(a) Afectado(a)";
  const concurso = document.getElementById("input-concurso").value;
  const grupo = document.getElementById("input-grupo").value;
  const folio = document.getElementById("input-folio")?.value.trim() || "";
  const comentario = document.getElementById("input-comentario")?.value.trim() || "";
  const consentimiento = document.getElementById("check-consentimiento").checked;

  if (!nombre || !institucion || !correo) {
    mostrarError("Por favor completa Nombre, Institución y Correo electrónico.");
    return;
  }

  if (!consentimiento) {
    mostrarError("Debes aceptar la autorización de publicación de tu nombre e institución.");
    return;
  }

  // Bloquear botón con spinner
  btnSubmit.disabled = true;
  btnSubmitText.textContent = "Procesando adhesión...";

  const nuevoAdherente = {
    id: Date.now(),
    fecha: new Date().toISOString().replace("T", " ").substring(0, 19),
    nombre,
    institucion,
    correo,
    tipo,
    concurso,
    grupo,
    folio,
    comentario
  };

  try {
    let enviado = false;

    // 1. Enviar a servidor Python local si está disponible
    if (backendType === "api" || window.location.protocol.startsWith("http")) {
      try {
        const res = await fetch("/api/adherentes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nuevoAdherente)
        });
        if (res.ok) {
          enviado = true;
        } else if (res.status === 409) {
          mostrarError("Ya existe una adhesión registrada con este nombre e institución.");
          btnSubmit.disabled = false;
          btnSubmitText.textContent = "Enviar y Adherir a la Carta";
          return;
        }
      } catch (err) {
        // Continuar a otros métodos
      }
    }

    // 2. Enviar a Google Apps Script si está configurado
    if (!enviado && typeof CONFIG !== "undefined" && CONFIG.googleSheetScriptUrl && CONFIG.googleSheetScriptUrl.startsWith("http")) {
      try {
        await fetch(CONFIG.googleSheetScriptUrl, {
          method: "POST",
          mode: "no-cors", // Google Apps Script Web App soporta no-cors
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nuevoAdherente)
        });
        enviado = true;
      } catch (err) {
        console.warn("Fallo al enviar a Google Apps Script:", err);
      }
    }

    // 3. Guardar en memoria y LocalStorage
    const existe = adherentesData.some(a => a.nombre.toLowerCase() === nombre.toLowerCase() && a.institucion.toLowerCase() === institucion.toLowerCase());
    if (!existe) {
      adherentesData.unshift(nuevoAdherente);
      try {
        localStorage.setItem("fondecyt_adherentes_2027", JSON.stringify(adherentesData));
      } catch (e) {}
    }

    // Éxito: mostrar mensaje y resetear formulario
    alertError.classList.add("hidden");
    alertSuccess.classList.remove("hidden");
    document.getElementById("adhesion-form").reset();
    toggleFormFields();
    actualizarVista();

    // Scroll suave hacia la nómina o hacia la confirmación
    alertSuccess.scrollIntoView({ behavior: "smooth", block: "center" });

  } catch (error) {
    mostrarError("Hubo un problema al procesar tu adhesión. Por favor intenta de nuevo.");
  } finally {
    btnSubmit.disabled = false;
    btnSubmitText.textContent = "Enviar y Adherir a la Carta";
  }
}

function mostrarError(mensaje) {
  const alertError = document.getElementById("form-alert-error");
  const msgEl = document.getElementById("form-alert-error-msg");
  if (alertError && msgEl) {
    msgEl.textContent = mensaje;
    alertError.classList.remove("hidden");
    alertError.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// DIFUSIÓN: WhatsApp
function shareOnWhatsApp() {
  const url = window.location.href.split("#")[0];
  const mensajeBase = (typeof CONFIG !== "undefined" && CONFIG.shareMessages?.whatsapp) 
    ? CONFIG.shareMessages.whatsapp 
    : "⚠️ URGENTE COMUNIDAD CIENTÍFICA: Investigadores de Chile declarados fuera de bases en Fondecyt 2027 por tecnicismo en la plataforma SPL de ANID (Justificación de recursos en español mientras 100% científico en inglés). Firma la carta aquí: ";

  const textoCompleto = encodeURIComponent(mensajeBase + url);
  window.open(`https://api.whatsapp.com/send?text=${textoCompleto}`, "_blank");
}

// DIFUSIÓN: X / Twitter
function shareOnTwitter() {
  const url = window.location.href.split("#")[0];
  const tweetText = (typeof CONFIG !== "undefined" && CONFIG.shareMessages?.twitter)
    ? CONFIG.shareMessages.twitter
    : "Investigadores de Chile piden a los Grupos de Evaluación Fondecyt no avalar exclusiones injustas de la @ANIDChile en Fondecyt 2027 por tecnicismo de idioma. ¡Apoya la carta abierta! #Fondecyt2027 #CienciaChilena";

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`;
  window.open(twitterUrl, "_blank");
}

// DIFUSIÓN: LinkedIn
function shareOnLinkedIn() {
  const url = window.location.href.split("#")[0];
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  window.open(linkedinUrl, "_blank");
}

// Copiar enlace general
function copyShareLink() {
  const url = window.location.href.split("#")[0];
  navigator.clipboard.writeText(url).then(() => {
    alert("¡Enlace copiado al portapapeles! Ya puedes pegarlo y compartirlo.");
  }).catch(() => {
    prompt("Copia el siguiente enlace:", url);
  });
}

// Copiar texto sugerido para grupos de WhatsApp
function copyPredefinedText() {
  const p = document.getElementById("whatsapp-sample-text");
  const url = window.location.href.split("#")[0];
  const texto = p ? `${p.innerText} ${url}` : url;
  
  navigator.clipboard.writeText(texto).then(() => {
    alert("¡Texto para WhatsApp copiado al portapapeles! Puedes pegarlo en tus grupos de facultad o departamento.");
  }).catch(() => {
    prompt("Copia este mensaje:", texto);
  });
}

// EXPORTAR A CSV (Excel)
function exportToCSV() {
  if (!adherentesData || adherentesData.length === 0) {
    alert("No hay adherentes registrados para exportar.");
    return;
  }

  const encabezados = ["ID", "Fecha", "Nombre", "Institución", "Tipo", "Concurso", "Grupo de Evaluación", "Folio", "Comentario"];
  const filas = adherentesData.map((a, i) => [
    i + 1,
    `"${(a.fecha || '').replace(/"/g, '""')}"`,
    `"${(a.nombre || '').replace(/"/g, '""')}"`,
    `"${(a.institucion || '').replace(/"/g, '""')}"`,
    `"${(a.tipo || '').replace(/"/g, '""')}"`,
    `"${(a.concurso || '').replace(/"/g, '""')}"`,
    `"${(a.grupo || '').replace(/"/g, '""')}"`,
    `"${(a.folio || '').replace(/"/g, '""')}"`,
    `"${(a.comentario || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = "\uFEFF" + [encabezados.join(";"), ...filas.map(f => f.join(";"))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `adherentes_carta_fondecyt_2027_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Función auxiliar de escape HTML contra inyecciones XSS
function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
