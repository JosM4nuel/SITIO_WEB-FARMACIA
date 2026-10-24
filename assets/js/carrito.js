
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
                if (!compra) { continue; }
                const productoExiste = buscarProducto(compra.id);
                const cantidadValida = Number.isInteger(compra.cantidad) && compra.cantidad >= 1 && compra.cantidad <= 99;
                const estaRepetido = carrito.some(function (otroProducto) {
                    return otroProducto.id === compra.id;
                });
                if (productoExiste && cantidadValida && !estaRepetido) {
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

// Precios, cantidades y productos seleccionados.
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

// Mostrar el carrito y actualizar sus botones.
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

// Preparar el mensaje del pedido para WhatsApp.
function enlacePedido(productosPedido, metodo) {
    let texto = 'Hola VIDAFARMA, quisiera confirmar disponibilidad y coordinar este pedido:\n';
    let total = 0;
    for (const compra of productosPedido) {
        const producto = buscarProducto(compra.id);
        const subtotal = producto.precio * compra.cantidad;
        texto += compra.cantidad + ' x ' + producto.nombre + ' - ' + mostrarPrecio(subtotal) + '\n';
        total += subtotal;
    }
    texto += '\nTotal de productos: ' + mostrarPrecio(total);
    texto += '\nForma de pago por coordinar: ' + metodo;
    texto += '\nEstado: pendiente de pago y confirmación de la farmacia.';
    return 'https://wa.me/51946817139?text=' + encodeURIComponent(texto);// funcion que prepara el texto para colocarlo dentro de un enlace
}

// Ventana con las opciones para continuar la compra.
const finalizar = document.getElementById('finalizar-compra');
if (finalizar) {
    const ventanaCompra = document.getElementById('confirmar-compra');
    const formularioPago = document.getElementById('formulario-pago');
    const botonPago = document.getElementById('procesar-pago');
    const estadoPago = document.getElementById('estado-pago');
    const enlaceWhatsApp = document.getElementById('enlace-whatsapp');
    let pedido = [];
    let tiempoPago;
    let procesando = false;

    function mostrarMetodo() {
        const metodo = formularioPago.querySelector('input:checked').value;
        const esWhatsApp = metodo === 'WhatsApp';
        document.getElementById('titulo-pago').textContent = esWhatsApp ? '¡Tu pedido está casi listo!' : 'Completa tu compra';
        document.getElementById('introduccion-whatsapp').hidden = !esWhatsApp;
        document.getElementById('gracias-whatsapp').hidden = !esWhatsApp;
        document.getElementById('titular-pago').hidden = metodo === 'Tarjeta' || esWhatsApp;
        botonPago.hidden = esWhatsApp || metodo === 'Tarjeta';
        enlaceWhatsApp.hidden = !esWhatsApp;
        botonPago.textContent = 'Continuar con ' + metodo;
        estadoPago.textContent = '';
        if (esWhatsApp) {
            document.getElementById('instruccion-pago').textContent = 'Revisa tu pedido y envíanos un mensaje para confirmar tu compra.';
            enlaceWhatsApp.href = enlacePedido(pedido, 'A coordinar');
        } else if (metodo === 'Tarjeta') {
            document.getElementById('instruccion-pago').textContent = '¡Pronto tendremos esta opción para ti!\nEstamos trabajando para ofrecerte pagos con tarjeta.';
        } else {
            document.getElementById('instruccion-pago').textContent = 'Elegiste ' + metodo + '. Continúa para probar la confirmación del pago.';
        }
    }

    function cancelarPago() {
        clearTimeout(tiempoPago);
        procesando = false;
        botonPago.disabled = false;
        formularioPago.querySelector('fieldset').disabled = false;
        estadoPago.textContent = '';
    }

    document.getElementById('vaciar-carrito').addEventListener('click', function () {
        carrito = [];
        guardarCarrito();
        document.getElementById('compra-finalizada').hidden = true;
        avisar('Carrito vaciado.');
    });
    finalizar.addEventListener('click', function () {
        if (!carrito.length) { return; }
        pedido = carrito.map(function (compra) { return { id: compra.id, cantidad: compra.cantidad }; });
        const resumen = calcularTotal();
        document.getElementById('detalle-confirmacion').textContent = resumen.unidades + ' unidades · Total: ' + mostrarPrecio(resumen.total);
        document.getElementById('compra-finalizada').hidden = true;
        cancelarPago();
        mostrarMetodo();
        ventanaCompra.showModal();
    });
    formularioPago.addEventListener('change', mostrarMetodo);
    document.getElementById('volver-pago').addEventListener('click', function () { ventanaCompra.close(); });
    ventanaCompra.addEventListener('close', cancelarPago);
    ventanaCompra.addEventListener('cancel', cancelarPago);
    formularioPago.addEventListener('submit', function (evento) {
        evento.preventDefault();
        const metodo = formularioPago.querySelector('input:checked').value;
        if (procesando || metodo === 'WhatsApp' || metodo === 'Tarjeta' || !pedido.length) { return; }
        procesando = true;
        botonPago.disabled = true;
        formularioPago.querySelector('fieldset').disabled = true;
        estadoPago.textContent = 'Procesando pago con ' + metodo + '…';
        tiempoPago = setTimeout(function () {
            const resultado = document.getElementById('compra-finalizada');
            resultado.replaceChildren();
            const titulo = document.createElement('h2');
            titulo.textContent = 'Pago recibido';
            const aviso = document.createElement('p');
            aviso.textContent = 'El pago con ' + metodo + ' terminó correctamente.';
            resultado.appendChild(titulo);
            resultado.appendChild(aviso);
            const lista = document.createElement('ul');
            let total = 0;
            for (const compra of pedido) {
                const producto = buscarProducto(compra.id);
                const subtotal = producto.precio * compra.cantidad;
                total += subtotal;
                const linea = document.createElement('li');
                linea.textContent = compra.cantidad + ' x ' + producto.nombre + ' - ' + mostrarPrecio(subtotal);
                lista.appendChild(linea);
            }
            resultado.appendChild(lista);
            const importe = document.createElement('p');
            importe.textContent = 'Total: ' + mostrarPrecio(total);
            resultado.appendChild(importe);
            const enlace = document.createElement('a');
            enlace.href = enlacePedido(pedido, metodo);
            enlace.target = '_blank';
            enlace.rel = 'noopener';
            enlace.className = 'btn btn-primary';
            enlace.textContent = 'Coordinar pedido real por WhatsApp';
            resultado.appendChild(enlace);
            resultado.hidden = false;
            // La compra terminó: vacía la selección y actualiza el contador.
            carrito = [];
            guardarCarrito();
            ventanaCompra.close();
            resultado.setAttribute('tabindex', '-1');
            resultado.focus();
        }, 1800);
    });
}
// 6. Mantener el carrito actualizado entre pestañas e iniciar la página.
window.addEventListener('storage', function (evento) {
    if (evento.key === nombreCarrito) {
        cargarCarrito();
        actualizarCarrito();
    }
});
cargarCarrito();
actualizarCarrito();
