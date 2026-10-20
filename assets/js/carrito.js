// El carrito se conserva en este navegador con localStorage.
// Solo guardamos identificadores y cantidades. Los precios vienen del catálogo.
const claveCarrito = 'VIDAFARMA-carrito';
let carrito = [];
let avisoTiempo;

function buscarProducto(id) {
    return catalogo.find(function (producto) { return producto.id === id; });
}

function cargarCarrito() {
    try {
        const guardado = JSON.parse(localStorage.getItem(claveCarrito) || '[]');
        carrito = [];
        if (Array.isArray(guardado)) {
            for (const item of guardado) {
                if (item && buscarProducto(item.id) && Number.isInteger(item.cantidad) && item.cantidad > 0 && item.cantidad <= 99 && !carrito.some(function (otro) { return otro.id === item.id; })) {
                    carrito.push({ id: item.id, cantidad: item.cantidad });
                }
            }
        }
    } catch (error) { carrito = []; }
}

function avisar(texto) {
    const aviso = document.getElementById('aviso-carrito');
    aviso.textContent = texto;
    aviso.classList.add('mostrar');
    clearTimeout(avisoTiempo);
    avisoTiempo = setTimeout(function () { aviso.classList.remove('mostrar'); }, 3500);
}

function guardarCarrito() {
    try { localStorage.setItem(claveCarrito, JSON.stringify(carrito)); }
    catch (error) { avisar('El navegador no permite guardar el carrito entre páginas. Habilita el almacenamiento para conservarlo.'); }
    actualizarCarrito();
}

function moneda(centimos) { return 'S/ ' + (centimos / 100).toFixed(2); }

function totales() {
    let unidades = 0;
    let total = 0;
    for (const item of carrito) {
        unidades += item.cantidad;
        total += buscarProducto(item.id).precio * item.cantidad;
    }
    return { unidades: unidades, total: total };
}

function agregarProducto(id) {
    if (!buscarProducto(id)) { return; }
    const item = carrito.find(function (producto) { return producto.id === id; });
    if (item) {
        if (item.cantidad >= 99) { avisar('Puedes agregar hasta 99 unidades de cada producto.'); return; }
        item.cantidad += 1;
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
    const item = carrito.find(function (producto) { return producto.id === id; });
    if (item) { item.cantidad = cantidad; guardarCarrito(); }
}

function eliminarProducto(id) {
    carrito = carrito.filter(function (producto) { return producto.id !== id; });
    guardarCarrito();
    avisar('Producto eliminado del carrito.');
}

function actualizarCarrito() {
    const resumen = totales();
    document.querySelectorAll('.cantidad-carrito').forEach(function (contador) { contador.textContent = resumen.unidades; });
    const lista = document.getElementById('lista-carrito');
    if (!lista) { return; }
    document.getElementById('carrito-vacio').hidden = carrito.length !== 0;
    document.getElementById('contenido-carrito').hidden = carrito.length === 0;
    document.getElementById('total-unidades').textContent = resumen.unidades;
    document.getElementById('total-precio').textContent = moneda(resumen.total);
    lista.replaceChildren();
    for (const item of carrito) {
        const producto = buscarProducto(item.id);
        const fila = document.createElement('article');
        fila.className = 'item-carrito';
        // La plantilla usa únicamente los productos definidos en productos.js.
        fila.innerHTML = '<img src="' + producto.imagen + '" alt="' + producto.nombre + '" width="110" height="110">' +
            '<div class="detalle-carrito"><h2>' + producto.nombre + '</h2><p>' + moneda(producto.precio) + ' por unidad</p>' +
            '<button class="eliminar-producto" type="button">Eliminar</button></div>' +
            '<div class="cantidad-control"><label for="cantidad-' + item.id + '">Cantidad</label><div class="ajuste-cantidad">' +
            '<button class="restar" type="button" aria-label="Restar una unidad de ' + producto.nombre + '">−</button>' +
            '<input id="cantidad-' + item.id + '" type="number" min="1" max="99" step="1" value="' + item.cantidad + '">' +
            '<button class="sumar" type="button" aria-label="Sumar una unidad de ' + producto.nombre + '">+</button></div></div>' +
            '<strong class="subtotal-item">' + moneda(producto.precio * item.cantidad) + '</strong>';
        fila.querySelector('.eliminar-producto').addEventListener('click', function () { eliminarProducto(item.id); });
        fila.querySelector('.restar').disabled = item.cantidad === 1;
        fila.querySelector('.sumar').disabled = item.cantidad === 99;
        fila.querySelector('.restar').addEventListener('click', function () { cambiarCantidad(item.id, item.cantidad - 1); restaurarFoco(item.id, '.restar'); });
        fila.querySelector('.sumar').addEventListener('click', function () { cambiarCantidad(item.id, item.cantidad + 1); restaurarFoco(item.id, '.sumar'); });
        fila.querySelector('input').addEventListener('change', function (evento) { cambiarCantidad(item.id, Number(evento.target.value)); restaurarFoco(item.id, 'input'); });
        lista.appendChild(fila);
    }
}

function restaurarFoco(id, selector) {
    const input = document.getElementById('cantidad-' + id);
    if (input) { input.closest('article').querySelector(selector).focus(); }
}

document.querySelectorAll('.agregar').forEach(function (boton) {
    boton.addEventListener('click', function () { agregarProducto(boton.dataset.producto); });
});

const finalizar = document.getElementById('finalizar-compra');
if (finalizar) {
    const dialogo = document.getElementById('confirmar-compra');
    document.getElementById('vaciar-carrito').addEventListener('click', function () { carrito = []; guardarCarrito(); avisar('Carrito vaciado.'); });
    finalizar.addEventListener('click', function () {
        if (!carrito.length) { return; }
        const resumen = totales();
        document.getElementById('detalle-confirmacion').textContent = resumen.unidades + ' unidades · Total: ' + moneda(resumen.total);
        dialogo.returnValue = '';
        dialogo.showModal();
    });
    dialogo.addEventListener('close', function () {
        if (dialogo.returnValue !== 'confirmar' || !carrito.length) { return; }
        const resumen = totales();
        const panel = document.getElementById('compra-finalizada');
        panel.replaceChildren();
        const titulo = document.createElement('h2'); titulo.textContent = '¡Compra simulada completada!'; panel.appendChild(titulo);
        const detalle = document.createElement('p'); detalle.textContent = resumen.unidades + ' unidades · Total: ' + moneda(resumen.total) + '. No se ha realizado ningún cobro.'; panel.appendChild(detalle);
        const lista = document.createElement('ul');
        for (const item of carrito) { const linea = document.createElement('li'); linea.textContent = item.cantidad + ' × ' + buscarProducto(item.id).nombre + ' — ' + moneda(item.cantidad * buscarProducto(item.id).precio); lista.appendChild(linea); }
        panel.appendChild(lista); panel.hidden = false;
        carrito = []; guardarCarrito();
        panel.setAttribute('tabindex', '-1'); panel.focus();
    });
}
window.addEventListener('storage', function (evento) { if (evento.key === claveCarrito) { cargarCarrito(); actualizarCarrito(); } });
cargarCarrito();
actualizarCarrito();
