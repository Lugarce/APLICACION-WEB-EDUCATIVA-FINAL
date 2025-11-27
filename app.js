/* ============================================================
   MATIENZO — JS PRINCIPAL MEJORADO
   - Control unificado del modo oscuro/claro
   - Sidebar consistente en todas las páginas
   - Gestión mejorada de flashcards y progreso
=============================================================== */

/* ------------------------------------------------------------
   CONSTANTES Y CONFIGURACIÓN
------------------------------------------------------------ */
const KEY_LAST_OPENED = "matienzo_last_opened";
const KEY_STUDIED = "matienzo_studied";
const KEY_FLASH = "matienzo_flashcards";
const KEY_THEME = "matienzo-theme";

let temasCache = null;

/* ------------------------------------------------------------
   1. INICIALIZACIÓN PRINCIPAL
------------------------------------------------------------ */
async function initApp() {
  inicializarModoOscuro();
  inicializarResetDatos();
  initNavActive();
  animateMain();
  initBuscarIfPresent();
  await fetchTemas();
  await renderProgressAndStudied();
  await updateResume();
}

/* ------------------------------------------------------------
   2. MODO OSCURO UNIFICADO
------------------------------------------------------------ */
function inicializarModoOscuro() {
  const toggleBtn = document.getElementById("toggle-theme");
  const modoBox = document.getElementById("modo-oscuro-box");
  const body = document.body;

  // Cargar preferencia guardada
  const storedTheme = localStorage.getItem(KEY_THEME);
  if (storedTheme === "dark") {
    body.classList.add("dark");
  }

  // Event listeners unificados
  if (modoBox) {
    modoBox.addEventListener("click", toggleTema);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", function(e) {
      e.stopPropagation();
      toggleTema();
    });
  }

  function toggleTema() {
    body.classList.toggle("dark");
    localStorage.setItem(KEY_THEME, body.classList.contains("dark") ? "dark" : "light");
  }
}

/* ------------------------------------------------------------
   3. RESET DE DATOS UNIFICADO
------------------------------------------------------------ */
function inicializarResetDatos() {
  const resetBox = document.getElementById("reset-datos");
  
  if (resetBox) {
    resetBox.addEventListener("click", function() {
      if (confirm("¿Estás seguro de que quieres reiniciar todos tus datos? Se perderá tu progreso, flashcards y configuraciones.")) {
        // Guardar tema actual antes de limpiar
        const currentTheme = document.body.classList.contains("dark") ? "dark" : "light";
        
        // Limpiar localStorage
        localStorage.clear();
        
        // Restaurar tema
        localStorage.setItem(KEY_THEME, currentTheme);
        
        alert("Datos reiniciados correctamente.");
        setTimeout(() => {
          location.reload();
        }, 1000);
      }
    });
  }
}

/* ------------------------------------------------------------
   4. NAVEGACIÓN ACTIVA MEJORADA
------------------------------------------------------------ */
function initNavActive() {
  const navItems = document.querySelectorAll(".nav-item");
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  
  navItems.forEach(item => {
    const href = item.getAttribute("href");
    if (href) {
      const linkPage = href.split("/").pop();
      if (linkPage === currentPage) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    }
    
    // Comportamiento UX al click
    item.addEventListener("click", function() {
      navItems.forEach(i => i.classList.remove("active"));
      this.classList.add("active");
    });
  });
}

/* ------------------------------------------------------------
   5. ANIMACIONES SUAVES
------------------------------------------------------------ */
function animateMain() {
  const main = document.querySelector(".main");
  if (!main) return;
  
  main.style.opacity = "0";
  main.style.transform = "translateY(10px)";
  
  setTimeout(() => {
    main.style.transition = "0.35s ease";
    main.style.opacity = "1";
    main.style.transform = "translateY(0)";
  }, 10);
}

/* ------------------------------------------------------------
   6. GESTIÓN DE TEMAS (DATA)
------------------------------------------------------------ */
async function fetchTemas() {
  if (temasCache) return temasCache;
  
  try {
    const response = await fetch("temas.json");
    if (!response.ok) throw new Error("No se pudo cargar temas.json");
    const data = await response.json();
    temasCache = data.temas || [];
    return temasCache;
  } catch (error) {
    console.warn("Error cargando temas:", error);
    temasCache = [];
    return temasCache;
  }
}

/* ------------------------------------------------------------
   7. GESTIÓN DE PROGRESO Y REANUDAR
------------------------------------------------------------ */
async function updateResume() {
  const resumeBtn = document.getElementById("resumeBtn");
  const lastTemaTitle = document.getElementById("lastTemaTitle");
  
  if (!resumeBtn || !lastTemaTitle) return;

  const lastOpened = localStorage.getItem(KEY_LAST_OPENED);
  
  if (!lastOpened) {
    lastTemaTitle.textContent = "—";
    resumeBtn.href = "#";
    resumeBtn.textContent = "Reanudar";
    resumeBtn.style.opacity = "0.7";
    resumeBtn.style.pointerEvents = "none";
    return;
  }

  const temas = await fetchTemas();
  const tema = temas.find(t => t.id === lastOpened);
  
  if (!tema) {
    lastTemaTitle.textContent = "—";
    resumeBtn.href = "#";
    resumeBtn.textContent = "Reanudar";
    resumeBtn.style.opacity = "0.7";
    resumeBtn.style.pointerEvents = "none";
    return;
  }

  lastTemaTitle.textContent = tema.titulo;
  resumeBtn.href = `ver-tema.html?id=${encodeURIComponent(tema.id)}`;
  resumeBtn.textContent = "Reanudar";
  resumeBtn.style.opacity = "1";
  resumeBtn.style.pointerEvents = "auto";
}

function addStudied(temaId) {
  if (!temaId) return;
  
  try {
    const estudiados = getStudied();
    if (!estudiados.includes(temaId)) {
      estudiados.push(temaId);
      localStorage.setItem(KEY_STUDIED, JSON.stringify(estudiados));
    }
  } catch (error) {
    console.warn("Error añadiendo tema estudiado:", error);
  }
  
  renderProgressAndStudied();
}

function getStudied() {
  return JSON.parse(localStorage.getItem(KEY_STUDIED) || "[]");
}

async function renderProgressAndStudied() {
  const temas = await fetchTemas();
  const estudiados = getStudied();
  const totalTemas = temas.length;
  const temasEstudiados = estudiados.length;
  const porcentaje = totalTemas === 0 ? 0 : Math.round((temasEstudiados / totalTemas) * 100);

  // Actualizar círculo de progreso
  const progressCircle = document.getElementById("progressCircle");
  if (progressCircle) {
    progressCircle.textContent = `${porcentaje}%`;
  }

  // Actualizar tarjeta de temas estudiados
  const studiedCard = document.getElementById("studiedCard");
  if (studiedCard) {
    if (temasEstudiados === 0) {
      studiedCard.innerHTML = `
        <h2>Temas estudiados</h2>
        <p style="color:var(--clr-text-muted);">Aún no has marcado temas como estudiados.</p>
      `;
    } else {
      const temasMap = {};
      temas.forEach(t => { temasMap[t.id] = t; });
      
      const listaHTML = estudiados.map(id => {
        const tema = temasMap[id];
        if (tema) {
          return `<a href="ver-tema.html?id=${encodeURIComponent(id)}" class="topic-card" style="display:block; margin-top:8px;">
                    ${tema.curso} — ${tema.titulo}
                  </a>`;
        }
        return `<div class="topic-card" style="display:block; margin-top:8px;">${id}</div>`;
      }).join("");
      
      studiedCard.innerHTML = `<h2>Temas estudiados</h2>${listaHTML}`;
    }
  }
}

/* ------------------------------------------------------------
   8. BÚSQUEDA MEJORADA
------------------------------------------------------------ */
async function initBuscarIfPresent() {
  const resultados = document.getElementById("resultados");
  if (!resultados) return;

  const input = document.getElementById("buscarInput");
  const filtroAnio = document.getElementById("filtroAnio");
  const filtroCurso = document.getElementById("filtroCurso");
  const temas = await fetchTemas();

  function renderResultados(lista) {
    resultados.innerHTML = "";
    
    if (!lista || lista.length === 0) {
      resultados.innerHTML = "<div class='card'><h2>No se encontraron temas.</h2></div>";
      return;
    }

    lista.forEach(tema => {
      const enlace = document.createElement("a");
      enlace.className = "topic-card";
      enlace.href = `ver-tema.html?id=${encodeURIComponent(tema.id)}`;
      enlace.style.cssText = "display:block; margin-top:12px;";
      enlace.textContent = `${tema.curso} — ${tema.titulo}`;
      resultados.appendChild(enlace);
    });
  }

  function filtrarTemas() {
    const query = input.value.trim().toLowerCase();
    let temasFiltrados = temas.filter(tema =>
      tema.titulo.toLowerCase().includes(query) || 
      tema.curso.toLowerCase().includes(query)
    );

    if (filtroAnio && filtroAnio.value) {
      temasFiltrados = temasFiltrados.filter(tema => String(tema.anio) === filtroAnio.value);
    }

    if (filtroCurso && filtroCurso.value) {
      temasFiltrados = temasFiltrados.filter(tema => tema.curso === filtroCurso.value);
    }

    renderResultados(temasFiltrados);
  }

  // Aplicar clases para modo oscuro
  if (input) {
    input.classList.add('search-input');
    input.addEventListener("input", filtrarTemas);
  }

  if (filtroAnio) {
    filtroAnio.classList.add('filter-select');
    filtroAnio.addEventListener("change", filtrarTemas);
  }

  if (filtroCurso) {
    filtroCurso.classList.add('filter-select');
    filtroCurso.addEventListener("change", filtrarTemas);
  }

  // Render inicial
  renderResultados(temas);
}

/* ------------------------------------------------------------
   9. GESTIÓN DE FLASHCARDS MEJORADA
------------------------------------------------------------ */
function saveFlashcardsRaw(arrTextos) {
  try {
    const existentes = JSON.parse(localStorage.getItem(KEY_FLASH) || "[]");
    const combinados = Array.from(new Set([...existentes, ...arrTextos]));
    localStorage.setItem(KEY_FLASH, JSON.stringify(combinados));
    return true;
  } catch (error) {
    console.warn("Error guardando flashcards:", error);
    return false;
  }
}

function getFlashcards() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY_FLASH) || "[]");
    return raw.map(item => {
      const partes = item.split("::");
      return {
        temaId: partes[0] || "",
        front: partes[1] || "",
        back: partes.slice(2).join("::") || item
      };
    });
  } catch (error) {
    console.warn("Error obteniendo flashcards:", error);
    return [];
  }
}

/* ------------------------------------------------------------
   10. UTILIDADES GLOBALES
------------------------------------------------------------ */
function escapeHtml(texto) {
  if (!texto) return "";
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

/* ------------------------------------------------------------
   11. API GLOBAL PARA OTRAS PÁGINAS
------------------------------------------------------------ */
window.matienzo = {
  addStudied,
  saveFlashcardsRaw,
  getFlashcards,
  fetchTemas,
  escapeHtml,
  getStudied,
  KEY_LAST_OPENED,
  KEY_STUDIED,
  KEY_FLASH
};

/* ------------------------------------------------------------
   12. INICIALIZACIÓN AUTOMÁTICA
------------------------------------------------------------ */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}