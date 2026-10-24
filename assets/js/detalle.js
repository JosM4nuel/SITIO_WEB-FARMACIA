// Lee el código del producto que viene en el enlace.
const datosEnlace = new URLSearchParams(window.location.search);
const productoElegido = buscarProducto(datosEnlace.get('id'));
const ficha = document.getElementById('ficha-producto');

if (ficha) {
    if (productoElegido) {
        document.title = productoElegido.nombre + ' | VIDAFARMA';
        document.getElementById('ruta-producto').textContent = productoElegido.nombre;
        document.getElementById('nombre-producto').textContent = productoElegido.nombre;
        document.getElementById('grupo-producto').textContent = productoElegido.categoria;
        document.getElementById('descripcion-producto').textContent = productoElegido.descripcion;
        document.getElementById('presentacion-producto').textContent = productoElegido.presentacion;
        document.getElementById('precio-producto').textContent = mostrarPrecio(productoElegido.precio);
        const foto = document.getElementById('foto-producto');
        foto.src = productoElegido.imagen;
        foto.alt = productoElegido.nombre;
        document.getElementById('consultar-producto').href = 'contacto.html?id=' + productoElegido.id;
        document.getElementById('agregar-detalle').addEventListener('click', function () {
            agregarProducto(productoElegido.id);
        });
        ficha.hidden = false;
    } else {
        document.getElementById('producto-no-encontrado').hidden = false;
    }
}

// Si viene desde una ficha, prepara la consulta sin enviarla.
const consulta = document.getElementById('formulario-contacto');
if (consulta && productoElegido) {
    document.getElementById('motivo').value = 'Información de productos';
    const textoConsulta = document.getElementById('mensaje');
    textoConsulta.value = 'Hola, quisiera consultar sobre ' + productoElegido.nombre + '.';
    document.getElementById('contador').textContent = textoConsulta.value.length;
}
