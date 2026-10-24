// 1. Menú para celulares.
const botonMenu = document.getElementById('boton-menu');
const menu = document.getElementById('menu');

function cerrarMenu() {
    menu.classList.remove('visible');
    botonMenu.setAttribute('aria-expanded', 'false');
}

botonMenu.addEventListener('click', function () {
    const abierto = menu.classList.toggle('visible');
    botonMenu.setAttribute('aria-expanded', abierto);
});

document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && menu.classList.contains('visible')) {
        cerrarMenu();
        botonMenu.focus();
    }
});

document.addEventListener('click', function (evento) {
    if (!evento.target.closest('.navegacion')) {
        cerrarMenu();
    }
});

menu.addEventListener('click', function (evento) {
    if (evento.target.closest('a')) {
        cerrarMenu();
    }
});

// 2. Búsqueda y filtros del catálogo.
// Solo ejecutamos los filtros si estamos en la página Productos.
const buscar = document.getElementById('buscar');
const categoria = document.getElementById('categoria');
function quitarTildes(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function filtrarProductos() {
    const productos = document.querySelectorAll('.producto');
    const texto = quitarTildes(buscar.value.trim());
    let cantidad = 0;
    for (let i = 0; i < productos.length; i++) {
        const nombre = quitarTildes(productos[i].getAttribute('data-nombre'));
        const grupo = productos[i].getAttribute('data-categoria');
        const seMuestra = nombre.includes(texto) && (categoria.value === 'Todas' || categoria.value === grupo);
        productos[i].hidden = !seMuestra;
        if (seMuestra) { cantidad = cantidad + 1; }
    }
    document.getElementById('resultados').textContent = cantidad + ' productos encontrados';
    document.getElementById('sin-resultados').hidden = cantidad !== 0;
}
function elegirCategoria() {
    buscar.value = '';
    document.getElementById('busqueda-tienda').value = '';
    categoria.value = 'Todas';
    if (location.hash === '#cuidado') { categoria.value = 'Cuidado personal'; }
    if (location.hash === '#higiene') { categoria.value = 'Higiene'; }
    if (location.hash === '#auxilios') { categoria.value = 'Primeros auxilios'; }
    filtrarProductos();
}
if (buscar) {
    buscar.addEventListener('input', filtrarProductos);
    categoria.addEventListener('change', filtrarProductos);
    document.getElementById('limpiar').addEventListener('click', function () {
        buscar.value = '';
        document.getElementById('busqueda-tienda').value = '';
        categoria.value = 'Todas';
        filtrarProductos();
    });
    window.addEventListener('hashchange', elegirCategoria);
    elegirCategoria();
    // Recibe la búsqueda realizada desde cualquier página.
    const busquedaEnlace = new URLSearchParams(window.location.search).get('q');
    if (busquedaEnlace) {
        buscar.value = busquedaEnlace.slice(0, 80);
        document.getElementById('busqueda-tienda').value = buscar.value;
        filtrarProductos();
    }
}
// 3. Formulario de contacto (envío de prueba).
const formulario = document.getElementById('formulario-contacto');
if (formulario) {
    const mensaje = document.getElementById('mensaje');
    const campoTelefono = document.getElementById('telefono');
    function revisarCanal() {
        const porTelefono = document.querySelector('input[name="canal"]:checked').value === 'telefono';
        campoTelefono.required = porTelefono;
        document.getElementById('etiqueta-telefono').textContent = porTelefono ? 'Celular (obligatorio)' : 'Celular (opcional)';
    }
    document.querySelectorAll('input[name="canal"]').forEach(function (opcion) {
        opcion.addEventListener('change', revisarCanal);
    });
    revisarCanal();
    formulario.addEventListener('input', function () {
        const respuesta = document.getElementById('respuesta');
        respuesta.textContent = '';
        respuesta.className = 'mt-3';
    });
    mensaje.addEventListener('input', function () {
        document.getElementById('contador').textContent = mensaje.value.length;
    });
    formulario.addEventListener('submit', function (evento) {
        evento.preventDefault(); // Evita navegar o enviar información a un servidor.
        const nombre = document.getElementById('nombre').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const canal = document.querySelector('input[name="canal"]:checked').value;
        const respuesta = document.getElementById('respuesta');
        respuesta.className = 'alert alert-warning mt-3';
        if (nombre.length < 3 || mensaje.value.trim().length < 10) {
            respuesta.textContent = 'Escribe un nombre y un mensaje válidos, sin usar solo espacios.';
            respuesta.focus();
            return;
        }
        if (canal === 'telefono' && telefono.length !== 9) {
            respuesta.textContent = 'Para elegir teléfono, completa un celular de 9 dígitos.';
            document.getElementById('telefono').focus();
            return;
        }
        // textContent muestra texto de forma segura, sin interpretar etiquetas HTML.
        respuesta.className = 'alert alert-success mt-3';
        // Confirmación de prueba: no se envían datos a un servidor.
        respuesta.textContent = '¡Consulta enviada con éxito! Gracias por contactar con VIDAFARMA.';
        formulario.reset();
        revisarCanal();
        document.getElementById('contador').textContent = '0';
        respuesta.focus();
    });
}

// 4. Mensajes de la barra superior: cambian cada cuatro segundos.
const barraMensajes = document.querySelector('.mensajes-barra');
if (barraMensajes && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const mensajesBarra = barraMensajes.querySelectorAll('a');
    const copiaMensaje = mensajesBarra[0].cloneNode(true);
    copiaMensaje.setAttribute('aria-hidden', 'true');
    copiaMensaje.inert = true;
    barraMensajes.appendChild(copiaMensaje);
    let mensajeActual = 0;
    let pausaBarra = false;

    function mostrarMensajeBarra() {
        barraMensajes.style.transform = 'translateX(-' + mensajeActual * 100 + '%)';
        mensajesBarra.forEach(function (enlace, numero) {
            enlace.inert = numero !== mensajeActual;
        });
    }

    mostrarMensajeBarra();
    setInterval(function () {
        if (pausaBarra || document.hidden) { return; }
        mensajeActual = mensajeActual + 1;
        mostrarMensajeBarra();
    }, 4000);
    barraMensajes.addEventListener('transitionend', function (evento) {
        if (evento.propertyName !== 'transform' || mensajeActual < mensajesBarra.length) { return; }
        barraMensajes.style.transition = 'none';
        mensajeActual = 0;
        mostrarMensajeBarra();
        // Reinicia el recorrido sin que se vea un salto hacia atrás.
        void barraMensajes.offsetWidth;
        barraMensajes.style.transition = '';
    });
    barraMensajes.parentElement.addEventListener('mouseenter', function () { pausaBarra = true; });
    barraMensajes.parentElement.addEventListener('mouseleave', function () {
        pausaBarra = barraMensajes.contains(document.activeElement);
    });
    barraMensajes.addEventListener('focusin', function () { pausaBarra = true; });
    barraMensajes.addEventListener('focusout', function (evento) {
        pausaBarra = barraMensajes.contains(evento.relatedTarget);
    });
}
