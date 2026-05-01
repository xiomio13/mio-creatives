// 1. VARIABLES GLOBALES Y CONFIGURACIÓN
let servicios = [];
let presupuesto = JSON.parse(localStorage.getItem("presupuesto")) || [];
let descuentoPorcentaje = 0;

const cuponesValidos = {
    "CODER20": 0.20,
    "CREATIVO10": 0.10
};

// 2. FUNCIONES DE CARGA DE DATOS (FETCH)
const cargarServicios = async () => {
    try {
        const response = await fetch('./data/data.json');
        servicios = await response.json();
        renderizarServicios(servicios);
        // Al cargar, verificamos qué servicios ya estaban en el presupuesto para marcarlos
        actualizarEstadoTarjetas();
    } catch (error) {
        Swal.fire('Error', 'No se pudieron cargar los servicios.', 'error');
    }
};

// 3. FUNCIONES DE RENDERIZADO (DOM)

const renderizarServicios = (datos) => {
    const contenedor = document.getElementById("contenedor-servicios");
    contenedor.innerHTML = "";
    
    datos.forEach(servicio => {
        const divCol = document.createElement("div");
        divCol.classList.add("col-md-6"); 
        
        // Añadimos un ID al card-container para poder manipularlo visualmente
        divCol.innerHTML = `
            <div class="card h-100 shadow-sm border-0 overflow-hidden" id="card-${servicio.id}">
                <div class="img-container">
                    <img src="${servicio.imagen}" class="transition-img" alt="${servicio.nombre}">
                </div>
                <div class="card-body d-flex flex-column p-4">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title fw-bold text-dark m-0">${servicio.nombre}</h5>
                        <span class="badge bg-light text-primary border border-primary-subtle">${servicio.categoria}</span>
                    </div>
                    <p class="text-muted small">${servicio.descripcion}</p>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <p class="card-text fs-3 fw-bold text-primary mb-0">S/${servicio.precio}</p>
                        <button class="btn btn-primary rounded-pill px-4 shadow-sm" id="btn-${servicio.id}">
                            Seleccionar
                        </button>
                    </div>
                </div>
            </div>
        `;
        contenedor.appendChild(divCol);
        
        const boton = divCol.querySelector(`#btn-${servicio.id}`);
        boton.addEventListener("click", () => agregarAlPresupuesto(servicio.id));
    });
};

const renderizarPresupuesto = () => {
    const listaCarrito = document.getElementById("lista-carrito");
    listaCarrito.innerHTML = ""; 
    let acumulado = 0;

    presupuesto.forEach((item, index) => {
        acumulado += item.precio;
        const divItem = document.createElement("div");
        // Estilo más limpio para los items del carrito
        divItem.className = "d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded";
        divItem.innerHTML = `
            <span class="small fw-semibold">${item.nombre}</span>
            <div>
                <span class="fw-bold me-2">S/${item.precio}</span>
                <button class="btn btn-sm p-0 border-0" onclick="eliminarDelPresupuesto(${index})">❌</button>
            </div>
        `;
        listaCarrito.appendChild(divItem);
    });

    let montoDescuento = acumulado * descuentoPorcentaje;
    let totalFinalCalculado = acumulado - montoDescuento;

    document.getElementById("subtotal").innerText = acumulado.toFixed(2);
    document.getElementById("descuento-monto").innerText = montoDescuento.toFixed(2);
    document.getElementById("total-final").innerText = totalFinalCalculado.toFixed(2);
    
    // Cada vez que el presupuesto cambia, actualizamos el look de las tarjetas
    actualizarEstadoTarjetas();
};

// 4. LÓGICA DE NEGOCIO

// Función para añadir/quitar clases visuales (Feedback UX)
const actualizarEstadoTarjetas = () => {
    servicios.forEach(s => {
        const tarjeta = document.getElementById(`card-${s.id}`);
        const boton = document.getElementById(`btn-${s.id}`);
        if (tarjeta && boton) {
            const estaEnPresupuesto = presupuesto.some(item => item.id === s.id);
            if (estaEnPresupuesto) {
                tarjeta.classList.add("card-selected");
                boton.innerText = "Agregado";
                boton.classList.replace("btn-primary", "btn-success");
            } else {
                tarjeta.classList.remove("card-selected");
                boton.innerText = "Seleccionar";
                boton.classList.replace("btn-success", "btn-primary");
            }
        }
    });
};

const agregarAlPresupuesto = (id) => {
    const servicio = servicios.find(s => s.id === id);
    
    // Evitamos duplicados si lo deseas, o simplemente permitimos múltiples clics
    presupuesto.push(servicio);
    localStorage.setItem("presupuesto", JSON.stringify(presupuesto));
    renderizarPresupuesto();
    
    Swal.fire({
        title: '¡Agregado!',
        text: `${servicio.nombre} se sumó a tu cotización.`,
        icon: 'success',
        timer: 1000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
    });
};

const eliminarDelPresupuesto = (index) => {
    presupuesto.splice(index, 1);
    
    // Si ya no hay items, reiniciamos el descuento
    if (presupuesto.length === 0) {
        descuentoPorcentaje = 0;
        const inputCupon = document.getElementById("input-cupon");
        if(inputCupon) inputCupon.value = "";
    }
    
    localStorage.setItem("presupuesto", JSON.stringify(presupuesto));
    renderizarPresupuesto();
};

const aplicarCupon = () => {
    const input = document.getElementById("input-cupon");
    const codigo = input.value.trim().toUpperCase();

    if (cuponesValidos[codigo]) {
        descuentoPorcentaje = cuponesValidos[codigo];
        Swal.fire('¡Cupón aceptado!', `Tienes un ${descuentoPorcentaje * 100}% de descuento`, 'success');
        renderizarPresupuesto();
    } else {
        Swal.fire('Error', 'Código no válido', 'error');
    }
};

const finalizarPresupuesto = () => {
    const nombre = document.getElementById("nombre-cliente").value;
    const email = document.getElementById("email-cliente").value;
    const total = document.getElementById("total-final").innerText;

    if (!nombre || !email || presupuesto.length === 0) {
        Swal.fire('Atención', 'Completa tus datos y selecciona servicios.', 'warning');
        return;
    }

    const serviciosListados = presupuesto.map(s => s.nombre).join(", ");
    const params = {
        to_name: nombre,
        to_email: email,
        total_presupuesto: total,
        servicios: serviciosListados
    };

    emailjs.send("service_7ak3484", "template_zizb2qk", params)
        .then(() => {
            Swal.fire('¡Enviado!', `Hola ${nombre}, enviamos el presupuesto a ${email}`, 'success');
            presupuesto = [];
            localStorage.removeItem("presupuesto");
            descuentoPorcentaje = 0;
            document.getElementById("nombre-cliente").value = "";
            document.getElementById("email-cliente").value = "";
            document.getElementById("input-cupon").value = "";
            renderizarPresupuesto();
        })
        .catch(() => {
            Swal.fire('Error', 'No pudimos enviar el correo. Verifica tu configuración de EmailJS.', 'error');
        });
};

// 5. EVENTOS E INICIALIZACIÓN
document.getElementById("btn-cupon").addEventListener("click", aplicarCupon);
document.getElementById("btn-finalizar").addEventListener("click", finalizarPresupuesto);

// Arrancamos la aplicación
cargarServicios();
renderizarPresupuesto();

// Función para filtrar los servicios
const filtrarServicios = (categoria) => {
    // Si es "Todos", pasamos el array completo; si no, filtramos por la propiedad 'categoria' del JSON
    const serviciosFiltrados = categoria === "Todos" 
        ? servicios 
        : servicios.filter(s => s.categoria === categoria);
    
    renderizarServicios(serviciosFiltrados);
    actualizarEstadoTarjetas(); // Para mantener el feedback de "Agregado"
};

// Evento para los botones de filtro
document.getElementById("contenedor-filtros").addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
        // Quitar clase 'active' de todos y ponerla al seleccionado
        document.querySelectorAll("#contenedor-filtros .btn").forEach(btn => btn.classList.remove("active"));
        e.target.classList.add("active");

        // Ejecutar el filtrado
        const categoriaSeleccionada = e.target.getAttribute("data-categoria");
        filtrarServicios(categoriaSeleccionada);
    }
});

// Función para generar el PDF con el estilo de Mio Creatives
const descargarPDF = () => {
    const elementoParaConvertir = document.getElementById("resumen-presupuesto");

    if (presupuesto.length === 0) {
        Swal.fire('Atención', 'Agrega servicios antes de descargar el PDF.', 'warning');
        return;
    }

    const opciones = {
        margin: 0.5,
        filename: 'Presupuesto_Mio_Creatives.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 3, // Alta calidad para tu logo azul
            letterRendering: true,
            useCORS: true,
            scrollY: 0,
            backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opciones).from(elementoParaConvertir).save();
};

// VINCULACIÓN DEL BOTÓN: Asegúrate de que este ID coincida con tu HTML
const botonPDF = document.getElementById("btn-pdf");
if (botonPDF) {
    botonPDF.addEventListener("click", descargarPDF);
}

