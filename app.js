document.addEventListener("DOMContentLoaded", () => {
  const mostrarNotificacion = (mensaje, tipo) => {
    const notificacion = document.createElement("div");
    notificacion.className = `notificacion ${tipo}`;
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);

    setTimeout(() => {
      notificacion.remove();
    }, 3000);
  };

  class Beat {
    constructor(nombre, precio, genero, imagen, audio) {
      this.nombre = nombre;
      this.precio = precio;
      this.genero = genero;
      this.imagen = imagen || "https://via.placeholder.com/100";
      this.audio = audio || "";
      this.audioElement = null;
    }
  }

  class Carrito {
    constructor() {
      this.items = JSON.parse(localStorage.getItem("carrito")) || [];
    }

    agregarBeat(beat) {
      if (!this.items.some((item) => item.nombre === beat.nombre)) {
        this.items.push(beat);
        this.save();
        return true;
      }
      return false;
    }

    eliminarBeat(nombre) {
      this.items = this.items.filter((item) => item.nombre !== nombre);
      this.save();
    }

    verCarrito() {
      return this.items;
    }

    calcularTotal(impuesto = 0.21) {
      const subtotal = this.items.reduce((suma, beat) => suma + beat.precio, 0);
      return subtotal + subtotal * impuesto;
    }

    limpiarCarrito() {
      this.items = [];
      this.save();
    }

    save() {
      localStorage.setItem("carrito", JSON.stringify(this.items));
    }
  }

  const carrito = new Carrito();
  let beats = [];

  fetch("beats.json")
    .then((response) => response.json())
    .then((data) => {
      beats = data.map(
        (beatData) =>
          new Beat(
            beatData.nombre,
            beatData.precio,
            beatData.genero,
            beatData.imagen,
            beatData.audio
          )
      );
      document.getElementById("bienvenida").style.display = "block";
    })
    .catch((error) =>
      mostrarNotificacion("Error al cargar los datos: " + error, "error")
    );

  const generosSection = document.getElementById("generos");
  const listaGeneros = document.getElementById("listaGeneros");
  const listaBeats = document.getElementById("listaBeats");

  document
    .getElementById("finalizarCompraBtn")
    .addEventListener("click", mostrarCarrito);
  document
    .getElementById("volverAGenerosDesdeBeatsBtn")
    .addEventListener("click", mostrarGeneros);
  document
    .getElementById("volverAGenerosDesdeCarritoBtn")
    .addEventListener("click", mostrarGeneros);

  function mostrarGeneros() {
    generosSection.style.display = "block";
    listaGeneros.innerHTML = "";
    const generos = ["RAP", "ROCK", "R&B", "POP", "JAZZ", "EDM"];
    generos.forEach((genero) => {
      const div = document.createElement("div");
      div.className = "genero";
      div.textContent = genero.charAt(0).toUpperCase() + genero.slice(1);
      div.addEventListener("click", () => mostrarBeats(genero));
      listaGeneros.appendChild(div);
    });

    document.getElementById("beats").style.display = "none";
    document.getElementById("carrito").style.display = "none";
    detenerAudio();
    document.getElementById("volverAPrincipalBtn").style.display = "none";
  }

  function mostrarBeats(genero) {
    const beatsFiltrados = beats.filter(
      (beat) => beat.genero.toLowerCase() === genero.toLowerCase()
    );

    if (beatsFiltrados.length === 0) {
      mostrarNotificacion(
        "No hay beats disponibles para este género.",
        "error"
      );
      return;
    }

    generosSection.style.display = "none";
    document.getElementById("beats").style.display = "block";
    listaBeats.innerHTML = "";

    beatsFiltrados.forEach((beat) => {
      const beatElemento = document.createElement("div");
      beatElemento.className = "itemBeat";
      beatElemento.innerHTML = `
          <img src="${beat.imagen}" class="imagenBeat" alt="${beat.nombre}">
          <div class="infoBeat">
              <h3>${beat.nombre}</h3>
              <p>Precio: $${beat.precio.toFixed(2)}</p>
          </div>
          <div id="botonesBeats">
          <button class="button agregarBtn">Agregar al carrito</button>
          <button class="button reproducirBtn">Reproducir</button>
          <button class="button pausarBtn" style="display: none;">Pausar</button>
          </div>
      `;
      listaBeats.appendChild(beatElemento);

      beatElemento
        .querySelector(".agregarBtn")
        .addEventListener("click", () => {
          if (carrito.agregarBeat(beat)) {
            mostrarNotificacion(
              `${beat.nombre} ha sido agregado al carrito.`,
              "success"
            );
            const button = beatElemento.querySelector(".agregarBtn");
            button.textContent = "Ya en carrito";
            button.style.backgroundColor = "gray";
            button.disabled = true;
          } else {
            mostrarNotificacion("Este beat ya está en el carrito.", "error");
          }
        });

      const reproducirBtn = beatElemento.querySelector(".reproducirBtn");
      const pausarBtn = beatElemento.querySelector(".pausarBtn");

      reproducirBtn.addEventListener("click", () => {
        if (beat.audio) {
          if (beat.audioElement) {
            beat.audioElement.play();
          } else {
            beat.audioElement = new Audio(beat.audio);
            beat.audioElement.play();
            mostrarNotificacion("Reproduciendo...", "success");
            reproducirBtn.style.display = "none";
            pausarBtn.style.display = "inline-block";
          }
        } else {
          mostrarNotificacion(
            "No hay audio disponible para este beat.",
            "error"
          );
        }
      });

      pausarBtn.addEventListener("click", () => {
        if (beat.audioElement) {
          beat.audioElement.pause();
          reproducirBtn.style.display = "inline-block";
          pausarBtn.style.display = "none";
        }
      });
    });
  }

  document.getElementById("iniciarBtn").addEventListener("click", () => {
    const nombre = document.getElementById("nombreUsuario").value;
    if (nombre) {
      Swal.fire({
        title: `¡Hola ${nombre}!`,
        text: "Bienvenido a harmonyQ, la tienda de beats ideal para vos.",
        icon: "success",
        confirmButtonText: "Continuar",
      });
      document.getElementById("bienvenida").style.display = "none";
      mostrarGeneros();
      document.getElementById("volverAPrincipalBtn").style.display = "none";
    } else {
      Swal.fire({
        title: "Error",
        text: "Por favor, ingresa tu nombre.",
        icon: "error",
        confirmButtonText: "Entendido",
      });
    }
  });

  document.getElementById("calcularBtn").addEventListener("click", () => {
    const total = carrito.calcularTotal();
    document.getElementById(
      "montoTotal"
    ).textContent = `Total: $${total.toFixed(2)}`;
    document.getElementById("procederPagoBtn").style.display = "block";

    const cuotas = document.getElementById("cuotas").value;
    if (cuotas) {
      const totalCuotas = total / cuotas;
      document.getElementById(
        "montoCuotas"
      ).textContent = `Monto por cuota: $${totalCuotas.toFixed(2)}`;
    } else {
      document.getElementById("montoCuotas").textContent = "";
    }
  });

  document.getElementById("procederPagoBtn").addEventListener("click", () => {
    Swal.fire({
      title: "Cargando...",
      text: "Te llegará una notificación a tu correo para seguir los pasos.",
      icon: "info",
      allowOutsideClick: false,
    });
  });

  document.getElementById("vaciarCarritoBtn").addEventListener("click", () => {
    carrito.limpiarCarrito();
    document.getElementById("listaCarrito").innerHTML = "";
    document.getElementById("montoTotal").textContent = "";
    document.getElementById("montoCuotas").textContent = "";
    document.getElementById("procederPagoBtn").style.display = "none";
    mostrarNotificacion("Carrito vaciado.", "success");
  });

  document
    .getElementById("volverAPrincipalBtn")
    .addEventListener("click", () => {
      document.getElementById("bienvenida").style.display = "block";
      document.getElementById("generos").style.display = "none";
      document.getElementById("beats").style.display = "none";
      document.getElementById("carrito").style.display = "none";
      document.getElementById("volverAPrincipalBtn").style.display = "none";
    });

  function mostrarCarrito() {
    const items = carrito.verCarrito();
    const listaCarrito = document.getElementById("listaCarrito");
    listaCarrito.innerHTML = "";
    items.forEach((beat) => {
      const li = document.createElement("li");
      li.textContent = `${beat.nombre} - $${beat.precio.toFixed(2)}`;
      const btnEliminar = document.createElement("button");
      btnEliminar.textContent = "Eliminar";
      btnEliminar.addEventListener("click", () => {
        carrito.eliminarBeat(beat.nombre);
        mostrarCarrito();
      });
      li.appendChild(btnEliminar);
      listaCarrito.appendChild(li);
    });

    document.getElementById("montoTotal").textContent = "";
    document.getElementById("procederPagoBtn").style.display = "none";
    document.getElementById("carrito").style.display = "block";
    document.getElementById("beats").style.display = "none";
    document.getElementById("volverAPrincipalBtn").style.display = "block";
  }

  function detenerAudio() {
    beats.forEach((beat) => {
      if (beat.audioElement) {
        beat.audioElement.pause();
        beat.audioElement = null;
      }
    });
  }
});
