// El carrito se conserva en este navegador con localStorage.
// Guardamos el código y la cantidad de cada producto.
const nombreCarrito = 'VIDAFARMA-carrito';
let carrito = [];
let tiempoAviso;

function buscarProducto(id) {
    return catalogo.find(function (producto) { return producto.id === id; });
}

function cargarCarrito() {
    try {
        const carritoGuardado = JSON.parse(localStorage.getItem(nombreCarrito) || '[]');
        carrito = [];
        if (Array.isArray(carritoGuardado)) {
            for (const compra of carritoGuardado) {
                if (compra && buscarProducto(compra.id) && Number.isInteger(compra.cantidad) && compra.cantidad > 0 && compra.cantidad <= 99 && !carrito.some(function (otroProducto) { return otroProducto.id === compra.id; })) {
                    carrito.push({ id: compra.id, cantidad: compra.cantidad });
                }
            }
        }
    } catch (error) { carrito = []; }
}

function avisar(texto) {
    const aviso = document.getElementById('aviso-carrito');
    aviso.textContent = texto;
    aviso.classList.add('mostrar');
    clearTimeout(tiempoAviso);
    tiempoAviso = setTimeout(function () { aviso.classList.remove('mostrar'); }, 3500);
}

function guardarCarrito() {
    try { localStorage.setItem(nombreCarrito, JSON.stringify(carrito)); }
    catch (error) { avisar('El navegador no permite guardar el carrito entre páginas. Habilita el almacenamiento para conservarlo.'); }
    actualizarCarrito();
}

function mostrarPrecio(centimos) { return 'S/ ' + (centimos / 100).toFixed(2); }

function calcularTotal() {
    let unidades = 0;
    let total = 0;
    for (const compra of carrito) {
        unidades += compra.cantidad;
        total += buscarProducto(compra.id).precio * compra.cantidad;
    }
    return { unidades: unidades, total: total };
}

function agregarProducto(id) {
    if (!buscarProducto(id)) { return; }
    const compra = carrito.find(function (producto) { return producto.id === id; });
    if (compra) {
        if (compra.cantidad >= 99) { avisar('Puedes agregar hasta 99 unidades de cada producto.'); return; }
        compra.cantidad += 1;
    } else { carrito.push({ id: id, cantidad: 1 }); }
    avisar(buscarProducto(id).nombre + ' agregado al carrito.');
    guardarCarrito();
}

function cambiarCantidad(id, cantidad) {
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 99) {
        avisar('Elige una cantidad entre 1 y 99.');
        actualizarCarrito();
        return;
    }
    const compra = carrito.find(function (producto) { return producto.id === id; });
    if (compra) { compra.cantidad = cantidad; guardarCarrito(); }
}

function eliminarProducto(id) {
    carrito = carrito.filter(function (producto) { return producto.id !== id; });
    guardarCarrito();
    avisar('Producto eliminado del carrito.');
}

function actualizarCarrito() {
    const resumen = calcularTotal();
    document.querySelectorAll('.cantidad-carrito').forEach(function (contador) { contador.textContent = resumen.unidades; });
    const lista = document.getElementById('lista-carrito');
    if (!lista) { return; }
    document.getElementById('carrito-vacio').hidden = carrito.length !== 0;
    document.getElementById('contenido-carrito').hidden = carrito.length === 0;
    document.getElementById('total-unidades').textContent = resumen.unidades;
    document.getElementById('total-precio').textContent = mostrarPrecio(resumen.total);
    lista.replaceChildren();
    for (const compra of carrito) {
        const producto = buscarProducto(compra.id);
        const fila = document.createElement('article');
        fila.className = 'producto-carrito';
        // Crea una fila para mostrar cada producto del carrito.
        fila.innerHTML = '<img src="' + producto.imagen + '" alt="' + producto.nombre + '" width="110" height="110">' +
            '<div class="detalle-carrito"><h2>' + producto.nombre + '</h2><p>' + mostrarPrecio(producto.precio) + ' por unidad</p>' +
            '<button class="eliminar-producto" type="button">Eliminar</button></div>' +
            '<div class="cantidad-producto"><label for="cantidad-' + compra.id + '">Cantidad</label><div class="botones-cantidad">' +
            '<button class="restar" type="button" aria-label="Restar una unidad de ' + producto.nombre + '">−</button>' +
            '<input id="cantidad-' + compra.id + '" type="number" min="1" max="99" step="1" value="' + compra.cantidad + '">' +
            '<button class="sumar" type="button" aria-label="Sumar una unidad de ' + producto.nombre + '">+</button></div></div>' +
            '<strong class="precio-producto">' + mostrarPrecio(producto.precio * compra.cantidad) + '</strong>';
        fila.querySelector('.eliminar-producto').addEventListener('click', function () { eliminarProducto(compra.id); });
        fila.querySelector('.restar').disabled = compra.cantidad === 1;
        fila.querySelector('.sumar').disabled = compra.cantidad === 99;
        fila.querySelector('.restar').addEventListener('click', function () { cambiarCantidad(compra.id, compra.cantidad - 1); seleccionarBoton(compra.id, '.restar'); });
        fila.querySelector('.sumar').addEventListener('click', function () { cambiarCantidad(compra.id, compra.cantidad + 1); seleccionarBoton(compra.id, '.sumar'); });
        fila.querySelector('input').addEventListener('change', function (evento) { cambiarCantidad(compra.id, Number(evento.target.value)); seleccionarBoton(compra.id, 'input'); });
        lista.appendChild(fila);
    }
}

function seleccionarBoton(id, boton) {
    const campoCantidad = document.getElementById('cantidad-' + id);
    if (campoCantidad) { campoCantidad.closest('article').querySelector(boton).focus(); }
}

document.querySelectorAll('.agregar').forEach(function (boton) {
    boton.addEventListener('click', function () { agregarProducto(boton.dataset.producto); });
});

const finalizar = document.getElementById('finalizar-compra');
if (finalizar) {
    const ventanaCompra = document.getElementById('confirmar-compra');
    document.getElementById('vaciar-carrito').addEventListener('click', function () { carrito = []; guardarCarrito(); avisar('Carrito vaciado.'); });
    finalizar.addEventListener('click', function () {
        if (!carrito.length) { return; }
        const resumen = calcularTotal();
        document.getElementById('detalle-confirmacion').textContent = resumen.unidades + ' unidades · Total: ' + mostrarPrecio(resumen.total);
        ventanaCompra.returnValue = '';
        ventanaCompra.showModal();
    });
    ventanaCompra.addEventListener('close', function () {
        if (ventanaCompra.returnValue !== 'confirmar' || !carrito.length) { return; }
        const resumen = calcularTotal();
        const mensajeCompra = document.getElementById('compra-finalizada');
        mensajeCompra.replaceChildren();
        const titulo = document.createElement('h2'); titulo.textContent = '¡Compra simulada completada!'; mensajeCompra.appendChild(titulo);
        const detalle = document.createElement('p'); detalle.textContent = resumen.unidades + ' unidades · Total: ' + mostrarPrecio(resumen.total) + '. No se ha realizado ningún cobro.'; mensajeCompra.appendChild(detalle);
        const lista = document.createElement('ul');
        for (const compra of carrito) { const linea = document.createElement('li'); linea.textContent = compra.cantidad + ' × ' + buscarProducto(compra.id).nombre + ' — ' + mostrarPrecio(compra.cantidad * buscarProducto(compra.id).precio); lista.appendChild(linea); }
        mensajeCompra.appendChild(lista); mensajeCompra.hidden = false;
        carrito = []; guardarCarrito();
        mensajeCompra.setAttribute('tabindex', '-1'); mensajeCompra.focus();
    });
}
window.addEventListener('storage', function (evento) { if (evento.key === nombreCarrito) { cargarCarrito(); actualizarCarrito(); } });
cargarCarrito();
actualizarCarrito();
