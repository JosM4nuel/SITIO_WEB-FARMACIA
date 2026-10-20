// JavaScript básico: variables, funciones, condicionales y eventos del DOM.
// El contenido principal está escrito en HTML; no usamos frameworks ni servidor.
const botonMenu = document.getElementById('boton-menu');
const menu = document.getElementById('menu');
botonMenu.addEventListener('click', function () {
    const abierto = menu.classList.toggle('visible');
    botonMenu.setAttribute('aria-expanded', abierto);
});
const botonSubmenu = document.querySelector('.abrir-submenu');
botonSubmenu.addEventListener('click', function () {
    const abierto = botonSubmenu.parentElement.classList.toggle('abierto');
    botonSubmenu.setAttribute('aria-expanded', abierto);
});
// Solo ejecutamos los filtros si estamos en la página Productos.
const buscar = document.getElementById('buscar');
const categoria = document.getElementById('categoria');
function normalizar(texto) {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function filtrarProductos() {
    const productos = document.querySelectorAll('.producto');
    const texto = normalizar(buscar.value.trim());
    let cantidad = 0;
    for (let i = 0; i < productos.length; i++) {
        const nombre = normalizar(productos[i].getAttribute('data-nombre'));
        const grupo = productos[i].getAttribute('data-categoria');
        const coincide = nombre.includes(texto) && (categoria.value === 'Todas' || categoria.value === grupo);
        productos[i].hidden = !coincide;
        if (coincide) { cantidad = cantidad + 1; }
    }
    document.getElementById('resultados').textContent = cantidad + ' productos encontrados';
    document.getElementById('sin-resultados').hidden = cantidad !== 0;
}
function leerCategoria() {
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
        categoria.value = 'Todas';
        filtrarProductos();
    });
    window.addEventListener('hashchange', leerCategoria);
    leerCategoria();
}
// El navegador valida required, email y longitudes antes del evento submit.
const formulario = document.getElementById('formulario-contacto');
if (formulario) {
    const mensaje = document.getElementById('mensaje');
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
            return;
        }
        if (canal === 'telefono' && telefono.length !== 9) {
            respuesta.textContent = 'Para elegir teléfono, completa un celular de 9 dígitos.';
            document.getElementById('telefono').focus();
            return;
        }
        // textContent muestra texto de forma segura, sin interpretar etiquetas HTML.
        respuesta.className = 'alert alert-success mt-3';
        const contenido = 'Consulta para VIDAFARMA\nNombre: ' + nombre + '\nCorreo: ' + document.getElementById('correo').value + '\nTeléfono: ' + telefono + '\nCanal preferido: ' + canal + '\nMotivo: ' + document.getElementById('motivo').value + '\n\n' + mensaje.value.trim();
        const archivo = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'consulta-VIDAFARMA.txt';
        enlace.click();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        respuesta.textContent = 'Tu consulta está preparada. Conserva el archivo descargado para compartirlo.';
        formulario.reset();
        document.getElementById('contador').textContent = '0';
    });
}
