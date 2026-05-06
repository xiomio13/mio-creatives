const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// VARIABLES GLOBALES Y CONFIGURACIÓN
let servicios = [];
let presupuesto = JSON.parse(localStorage.getItem("presupuesto")) || [];
let descuentoPorcentaje = 0;

const cuponesValidos = {
    "CODER20": 0.20,
    "CREATIVO10": 0.10
};

// FUNCIONES DE CARGA DE DATOS (FETCH)
const cargarServicios = async () => {
    try {
        const response = await fetch('./data/data.json');
        if (!response.ok) throw new Error("Error al cargar el archivo"); 
        servicios = await response.json();
        renderizarServicios(servicios);
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No pudimos conectar con la base de datos.', 'error');
    } finally {
        actualizarEstadoTarjetas();
    }
};

// FUNCIONES DE RENDERIZADO (DOM)

const renderizarServicios = (datos) => {
    const contenedor = document.getElementById("contenedor-servicios");
    contenedor.innerHTML = "";
    
    datos.forEach(servicio => {
        const { id, nombre, precio, imagen, categoria, descripcion } = servicio; 
    
    const divCol = document.createElement("div");
    divCol.classList.add("col-md-6"); 
    divCol.innerHTML = `
        <div class="card h-100 shadow-sm border-0 overflow-hidden" id="card-${id}">
            <div class="img-container">
                <img src="${imagen}" class="transition-img" alt="${nombre}">
            </div>
            <div class="card-body d-flex flex-column p-4">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title fw-bold text-dark m-0">${nombre}</h5>
                    <span class="badge bg-light text-primary border border-primary-subtle">${categoria}</span>
                </div>
                <p class="text-muted small">${descripcion}</p>
                <div class="mt-auto d-flex justify-content-between align-items-center">
                    <p class="card-text fs-3 fw-bold text-primary mb-0">S/${precio}</p>
                    <button class="btn btn-primary rounded-pill px-4 shadow-sm" id="btn-${id}">
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
        divItem.className = "d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded";
        divItem.innerHTML = `
            <span class="small fw-semibold">${item.nombre}</span>
            <div>
                <span class="fw-bold me-2">S/${item.precio.toFixed(2)}</span>
                <button class="btn btn-sm p-0 border-0" onclick="eliminarDelPresupuesto(${index})">❌</button>
            </div>
        `;
        listaCarrito.appendChild(divItem);
    });

    if (acumulado >= 400 && descuentoPorcentaje === 0) {
        Swal.fire({
                title: '¡Beneficio Disponible! 🎁',
                icon: 'info',
                html: `
                    <p>Tu proyecto califica para un 10% OFF.</p>
                    <div class="d-grid gap-2">
                        <button class="btn btn-outline-primary btn-sm fw-bold" 
                                onclick="navigator.clipboard.writeText('CREATIVO10'); this.innerText='¡Copiado!'">
                            Copiar Código: CREATIVO10
                        </button>
                    </div>
                `,
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 15000, 
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });
        }

    let montoDescuento = acumulado * descuentoPorcentaje;
    let valorNeto = acumulado - montoDescuento; 
    let igv = valorNeto * 0.18;
    let totalFinalCalculado = valorNeto + igv; 

    document.getElementById("subtotal").innerText = acumulado.toFixed(2);
    document.getElementById("descuento-monto").innerText = montoDescuento.toFixed(2);
    
    const elementoIGV = document.getElementById("igv-monto");
    if (elementoIGV) {
        elementoIGV.innerText = igv.toFixed(2);
    }

    document.getElementById("total-final").innerText = totalFinalCalculado.toFixed(2);
    
    actualizarEstadoTarjetas();
    localStorage.setItem("presupuesto", JSON.stringify(presupuesto));
};


const actualizarEstadoTarjetas = () => {
    servicios.forEach(s => {
        const tarjeta = document.getElementById(`card-${s.id}`);
        const boton = document.getElementById(`btn-${s.id}`);
        
        if (tarjeta && boton) {
            const estaEnPresupuesto = presupuesto.some(item => item.id === s.id);
            
            tarjeta.classList.toggle("card-selected", estaEnPresupuesto);
            boton.innerText = estaEnPresupuesto ? "Agregado" : "Seleccionar";
            
            estaEnPresupuesto 
                ? boton.classList.replace("btn-primary", "btn-success") 
                : boton.classList.replace("btn-success", "btn-primary");
        }
    });
};

const agregarAlPresupuesto = (id) => {
    const servicio = servicios.find(s => s.id === id);
    presupuesto.push(servicio);
    localStorage.setItem("presupuesto", JSON.stringify(presupuesto));
    
    const totalActual = presupuesto.reduce((acc, s) => acc + s.precio, 0);

    renderizarPresupuesto();

    if (totalActual < 400 || descuentoPorcentaje > 0) {
        Swal.fire({
            title: '¡Agregado!',
            text: `${servicio.nombre} sumado.`,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    }
};

const eliminarDelPresupuesto = (index) => {
    presupuesto.splice(index, 1);
    
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

    if (!nombre || !regexEmail.test(email) || presupuesto.length === 0) {
        Swal.fire('Atención', 'Por favor, ingresa un nombre y un email válido.', 'warning');
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



// EVENTOS E INICIALIZACIÓN

const inputNombre = document.getElementById("nombre-cliente");
const errorNombre = document.getElementById("error-nombre");

const inputEmail = document.getElementById("email-cliente");
const errorEmail = document.getElementById("error-email");

inputNombre.addEventListener("input", () => {
    const valor = inputNombre.value.trim();

    if (valor === "") {
        errorNombre.innerText = "El nombre es obligatorio.";
        inputNombre.classList.add("is-invalid");
    } else if (valor.length < 3) {
        errorNombre.innerText = "Mínimo 3 caracteres.";
        inputNombre.classList.add("is-invalid");
    } else {
        errorNombre.innerText = "";
        inputNombre.classList.remove("is-invalid");
        inputNombre.classList.add("is-valid"); // Feedback positivo
    }
});

inputEmail.addEventListener("input", () => {
    const emailValue = inputEmail.value.trim();

    if (!regexEmail.test(emailValue)) {
        errorEmail.innerText = "Ingresa un correo válido.";
        inputEmail.classList.add("is-invalid");
    } else {
        errorEmail.innerText = "";
        inputEmail.classList.remove("is-invalid");
        inputEmail.classList.add("is-valid");
    }
});

document.getElementById("btn-cupon").addEventListener("click", aplicarCupon);
document.getElementById("btn-finalizar").addEventListener("click", finalizarPresupuesto);

cargarServicios();
renderizarPresupuesto();

const filtrarServicios = (categoria) => {
    const serviciosFiltrados = categoria === "Todos" 
        ? servicios 
        : servicios.filter(s => s.categoria === categoria);
    
    renderizarServicios(serviciosFiltrados);
    actualizarEstadoTarjetas();
};

document.getElementById("contenedor-filtros").addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
        document.querySelectorAll("#contenedor-filtros .btn").forEach(btn => btn.classList.remove("active"));
        e.target.classList.add("active");

        const categoriaSeleccionada = e.target.getAttribute("data-categoria");
        filtrarServicios(categoriaSeleccionada);
    }
});

// Función para generar el PDF
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
            scale: 3, 
            letterRendering: true,
            useCORS: true,
            scrollY: 0,
            backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opciones).from(elementoParaConvertir).save();
};

const botonPDF = document.getElementById("btn-pdf");
if (botonPDF) {
    botonPDF.addEventListener("click", descargarPDF);
}

document.getElementById("btn-desbloquear-cupon").addEventListener("click", () => {
    Swal.fire({
        title: '¡Aquí tienes tu regalo! 🎁',
        html: `
            <p>Usa este código en el cotizador para obtener tu descuento:</p>
            <div class="p-3 bg-light border rounded-3 mb-3">
                <h3 class="fw-bold text-primary mb-0" id="codigo-texto">CODER20</h3>
            </div>
        `,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: '<i class="bi bi-clipboard"></i> Copiar código',
        cancelButtonText: 'Cerrar',
        confirmButtonColor: '#0d6efd',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            navigator.clipboard.writeText("CODER20");
            Swal.fire({
                title: '¡Copiado!',
                text: 'El código CODER20 ya está en tu portapapeles.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }
    });
});

const copiarAlPortapapeles = (texto) => {
    navigator.clipboard.writeText(texto);
    Swal.showValidationMessage(`¡Código ${texto} copiado!`);
};