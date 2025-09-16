
async function traducirTextoGoogle(texto, target = 'es') {
  if (!texto.trim()) return texto;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(texto)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data[0].map(d => d[0]).join('');
  } catch (e) {
    console.error('Error traduciendo:', texto, e);
    return texto;
  }
}

async function traducirPagina(target = 'es') {
  const elementos = document.querySelectorAll('p, h1, h2, h3, span, a, li, button');

  // Traducir todos en paralelo para mayor velocidad
  const promesas = Array.from(elementos).map(async el => {
    if (el.children.length === 0) {
      el.textContent = await traducirTextoGoogle(el.textContent, target);
    }
  });

  await Promise.all(promesas);
}

// Detecta cambio de idioma
document.getElementById('lang-select').addEventListener('change', async function() {
  const idioma = this.value;
  document.body.style.opacity = 0.5;
  await traducirPagina(idioma);
  document.body.style.opacity = 1;
});

// Traducir automáticamente al cargar la página
window.addEventListener('load', () => {
  setTimeout(() => traducirPagina('es'), 1000); // Espera 1 segundo para cargar contenido
});


// ================================// Configuración de idioma y cache  actual 


// ================================
const LANG_KEY = 'idioma-pagina';
const traduccionesCache = new Map();

// ================================
// Función para traducir texto con cache
// ================================
async function traducirTextoGoogle(texto, target = 'es') {
  if (!texto.trim()) return texto;
  const key = `${texto}::${target}`;
  if (traduccionesCache.has(key)) return traduccionesCache.get(key);
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(texto)}`;
    const res = await fetch(url);
    const data = await res.json();
    const traducido = data[0].map(d => d[0]).join('');
    traduccionesCache.set(key, traducido);
    return traducido;
  } catch (e) {
    console.error('Error traduciendo:', texto, e);
    return texto;
  }
}

// ================================
// Función recursiva para traducir todos los nodos
// ================================
async function traducirNodo(el, target) {
  const nodos = [];

  function extraerNodos(node) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      nodos.push(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Inputs, textareas y selects
      if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
        if (node.placeholder) nodos.push({ tipo: 'placeholder', el: node });
        if (node.value) nodos.push({ tipo: 'value', el: node });
      }
      if (node.tagName === 'SELECT') {
        for (let option of node.options) nodos.push({ tipo: 'option', el: option });
      }
      node.childNodes.forEach(child => extraerNodos(child));
    }
  }

  extraerNodos(el);

  await Promise.all(
    nodos.map(async n => {
      if (n instanceof Text) {
        n.textContent = await traducirTextoGoogle(n.textContent, target);
      } else if (n.tipo === 'placeholder') {
        n.el.placeholder = await traducirTextoGoogle(n.el.placeholder, target);
      } else if (n.tipo === 'value') {
        n.el.value = await traducirTextoGoogle(n.el.value, target);
      } else if (n.tipo === 'option') {
        n.el.text = await traducirTextoGoogle(n.el.text, target);
      }
    })
  );
}

// ================================
// Traducir toda la página
// ================================
async function traducirPagina(target = 'es') {
  await traducirNodo(document.body, target);
}

// ================================
// Cambiar idioma con recarga
// ================================
function cambiarIdiomaConRecarga(target) {
  localStorage.setItem(LANG_KEY, target);
  location.reload(); // recarga para traducir todo desde el inicio
}

// ================================
// Selector de idioma
// ================================
const select = document.getElementById('lang-select');
if (select) {
  const langGuardado = localStorage.getItem(LANG_KEY);
  if (langGuardado) select.value = langGuardado;

  select.addEventListener('change', function () {
    cambiarIdiomaConRecarga(this.value);
  });
}

// ================================
// Observador para contenido dinámico
// ================================
const observer = new MutationObserver(async mutations => {
  const lang = localStorage.getItem(LANG_KEY) || 'es';
  const nodosNuevos = [];

  for (let m of mutations) {
    if (m.addedNodes.length > 0) {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1) nodosNuevos.push(node);
      });
    }
  }

  if (nodosNuevos.length > 0) {
    await Promise.all(nodosNuevos.map(node => traducirNodo(node, lang)));
  }
});
observer.observe(document.body, { childList: true, subtree: true });

// ================================
// Traducción automática al cargar
// ================================
window.addEventListener('load', async () => {
  const lang = localStorage.getItem(LANG_KEY) || 'es';
  if (select) select.value = lang;

  // Traducir TODO el contenido estático, incluyendo <h1-h6> como tus <h2>
  if (lang !== 'es') {
    await traducirPagina(lang);
  }
});




function renderJuegos() {
  const container = document.getElementById("juegos-container");
  container.innerHTML = "";

  juegos.forEach((juego, i) => {
    const imagenes = parseImagenes(juego.imagenes || juego.imagen);

    // Contenedor principal de la tarjeta
    const col = document.createElement("div");
    col.className = "col-md-3 mb-4 text-center elementor-column grow-effect animated fadeInUp";
    col.setAttribute("data-aos", "fade-up");
    col.setAttribute("data-aos-duration", "1000");
    col.setAttribute("data-aos-delay", `${i * 150}`);

    // Tarjeta
    const ticket = document.createElement("div");
    ticket.className = "ticket-cine";
    ticket.setAttribute("data-bs-toggle", "modal");
    ticket.setAttribute("data-bs-target", `#juegoModal${i}`);

    const img = document.createElement("img");
    img.src = imagenes[0];
    img.alt = juego.nombre;
    img.className = "ticket-img rounded-top";

    const icons = document.createElement("div");
    icons.className = "ticket-icons";
    icons.innerHTML = `<i class="fas fa-hiking"></i><i class="fas fa-bicycle"></i><i class="fas fa-mountain"></i>`;

    const name = document.createElement("div");
    name.className = "ticket-name";
    name.innerHTML = `<span>${juego.nombre}</span>`;

    ticket.append(img, icons, name);
    col.appendChild(ticket);

    // Modal
    const modal = document.createElement("div");
    modal.className = "modal fade";
    modal.id = `juegoModal${i}`;
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header p-2">
            <h5 class="modal-title">${juego.nombre}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-2">
            <div id="carouselJuego${i}" class="carousel slide mb-3" data-bs-ride="carousel">
              <div class="carousel-inner">
                ${imagenes.map((img, idx) => `
                  <div class="carousel-item ${idx === 0 ? 'active' : ''}">
                    <img src="${img}" class="d-block w-100 rounded" alt="${juego.nombre}">
                  </div>
                `).join('')}
              </div>
              <button class="carousel-control-prev" type="button" data-bs-target="#carouselJuego${i}" data-bs-slide="prev">
                <span class="carousel-control-prev-icon"></span>
              </button>
              <button class="carousel-control-next" type="button" data-bs-target="#carouselJuego${i}" data-bs-slide="next">
                <span class="carousel-control-next-icon"></span>
              </button>
            </div>
            <p class="mb-1"><strong>Precio:</strong> ${juego.precio ? '$' + juego.precio : 'Consultar'}</p>
            <p class="mb-1"><strong>Duración:</strong> ${juego.duracion || 'N/A'}</p>
            <p class="text-muted">${juego.descripcion_larga || "Próximamente más información."}</p>
          </div>
          <div class="modal-footer p-2">
            <button class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    `;

    col.appendChild(modal);
    container.appendChild(col);
  });

  if (typeof AOS !== 'undefined') AOS.init({ once: true });
}
