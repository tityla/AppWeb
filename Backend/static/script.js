
document.addEventListener("DOMContentLoaded", function () {
  // Este evento se ejecuta cuando TODO el HTML ya fue cargado.
  // Es importante porque muchos elementos aún no existen si este
  // script se ejecuta antes que el DOM esté listo.
  console.log("DOM completamente cargado.");

  /* 1.REFERENCIAS A ELEMENTOS DEL DOM
     Aquí obtenemos los elementos que vamos a manipular.*/

  //  Elementos de LOGIN y APP 
  var loginForm = document.getElementById("loginForm");
  var loginMessage = document.getElementById("loginMessage");
  var loginSection = document.getElementById("loginSection");
  var appContent = document.getElementById("appContent");
  var logoutBtn = document.getElementById("logoutBtn");

  // Formulario principal donde el alumno ingresa datos.
  var gradeForm = document.getElementById("gradeForm");

  // Área donde se muestran mensajes de éxito o error.
  var formMessage = document.getElementById("formMessage");

  // Botón para reiniciar todos los campos.
  var clearBtn = document.getElementById("clearBtn");

  // Inputs para los nombres de materias (editable por el usuario).
  var subject1NameInput = document.getElementById("subject1Name");
  var subject2NameInput = document.getElementById("subject2Name");
  var subject3NameInput = document.getElementById("subject3Name");

  // Etiquetas visibles en la tabla de captura (lado izquierdo).
  var labelSubject1 = document.getElementById("labelSubject1");
  var labelSubject2 = document.getElementById("labelSubject2");
  var labelSubject3 = document.getElementById("labelSubject3");

  // Etiquetas visibles en los resultados (lado derecho).
  var resSubject1 = document.getElementById("resSubject1");
  var resSubject2 = document.getElementById("resSubject2");
  var resSubject3 = document.getElementById("resSubject3");

  // Resultados de promedios por materia.
  var avgSubject1 = document.getElementById("avgSubject1");
  var avgSubject2 = document.getElementById("avgSubject2");
  var avgSubject3 = document.getElementById("avgSubject3");

  // Pronósticos por materia.
  var forecastSubject1 = document.getElementById("forecastSubject1");
  var forecastSubject2 = document.getElementById("forecastSubject2");
  var forecastSubject3 = document.getElementById("forecastSubject3");

  // Resultados globales.
  var globalAverage = document.getElementById("globalAverage");
  var globalForecast = document.getElementById("globalForecast");

  // Menú desplegable para filtrar materias en la tabla.
  var filterSubject = document.getElementById("filterSubject");

  // Elementos para manejar el menú hamburger en móviles.
  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");

  console.log("Elementos del DOM almacenados para uso posterior.");

  /* 2.MENÚ RESPONSIVE (Abrir/Cerrar)
     Para pantallas pequeñas*/

  navToggle.addEventListener("click", function () {
    console.log(" Click en el botón de menú responsive.");

    // Si la clase "open" ya existe, se cierra el menú
    if (nav.classList.contains("open")) {
      console.log("Cerrando menú responsive.");
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    } else {
      // Si no existe, se abre el menú
      console.log(" Abriendo menú responsive.");
      nav.classList.add("open");
      navToggle.setAttribute("aria-expanded", "true");
    }
  });

  // Cierra el menú si el usuario hace clic en un enlace dentro del menú
  nav.addEventListener("click", function (event) {
    if (event.target.tagName === "A" && nav.classList.contains("open")) {
      console.log("Clic en enlace del menú, cerrando menú automáticamente.");
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  /* 3. SINCRONIZAR LOS NOMBRES DE MATERIAS
     Cada vez que el usuario cambie un nombre, se actualiza
     el panel de captura y el panel de resultados*/

  function syncSubjectLabels() {
    console.log("Sincronizando nombres de materias…");

    // Si el nombre está vacío, aparece uno genérico
    var name1 = subject1NameInput.value || "Materia 1";
    var name2 = subject2NameInput.value || "Materia 2";
    var name3 = subject3NameInput.value || "Materia 3";

    // Actualizar nombres en el formulario
    labelSubject1.textContent = name1;
    labelSubject2.textContent = name2;
    labelSubject3.textContent = name3;

    // Actualizar nombres en la tabla de resultados
    resSubject1.textContent = name1;
    resSubject2.textContent = name2;
    resSubject3.textContent = name3;

    console.log("Materias renombradas a:", name1, name2, name3);
  }

  // Escuchar cambios en los tres inputs de nombres.
  subject1NameInput.addEventListener("input", syncSubjectLabels);
  subject2NameInput.addEventListener("input", syncSubjectLabels);
  subject3NameInput.addEventListener("input", syncSubjectLabels);

  // Actualizar una vez al inicio
  syncSubjectLabels();

  /* 4.FUNCIONES PARA MOSTRAR MENSAJES DE ERROR Y ÉXITO
     Estas funciones actualizan el texto visible
     debajo del formulario con retroalimentación clara.
 */

  function showError(message) {
    console.log("ERROR:", message);
    formMessage.textContent = message;
    formMessage.classList.add("error");
    formMessage.classList.remove("success");
  }

  function showSuccess(message) {
    console.log("ÉXITO:", message);
    formMessage.textContent = message;
    formMessage.classList.add("success");
    formMessage.classList.remove("error");
  }

  /* 5. VALIDACIÓN BÁSICA DEL FORMULARIO
     - Que el nombre no esté vacío
     - Que el email sea válido
     - Que todas las calificaciones estén completas
       y dentro del rango 0–10 */

  function validateForm() {
    console.log(" Iniciando validación del formulario…");

    var nameInput = document.getElementById("studentName");
    var gradeInputs = document.querySelectorAll(".grade-input");

    // Validar nombre vacío
    if (nameInput.value.trim() === "") {
      showError("Por favor, ingresa el nombre del estudiante.");
      return false;
    }

    // Validar cada calificación individualmente
    for (var i = 0; i < gradeInputs.length; i++) {
      var value = gradeInputs[i].value.trim();
      var num = parseFloat(value);

      if (value === "" || isNaN(num) || num < 0 || num > 10) {
        console.log(" Calificación inválida encontrada:", value);
        gradeInputs[i].classList.add("invalid");
        showError("Las calificaciones deben estar entre 0 y 10.");
        return false;
      } else {
        gradeInputs[i].classList.remove("invalid");
      }
    }

    console.log("Formulario válido.");
    return true;
  }

  /* 6. FUNCIÓN PARA LEER CALIFICACIONES DE UNA MATERIA
     Se usa data-subject="1", "2" o "3" para identificarlas */

  function getSubjectGrades(subjectIndex) {
    var selector = '.grade-input[data-subject="' + subjectIndex + '"]';
    var inputs = document.querySelectorAll(selector);
    var grades = [];

    // Recorrer cada input y obtener su valor numérico.
    for (var i = 0; i < inputs.length; i++) {
      grades.push(parseFloat(inputs[i].value));
    }

    console.log("Calificaciones capturadas para materia", subjectIndex + ":", grades);
    return grades;
  }

  /* 7. FUNCIONES AUXILIARES DE FORMATEO 
     Presentación de los datos devueltos por el backend */

  function formatNumber(value) {
    return (value === null || value === undefined || isNaN(value))
      ? "-"
      : Number(value).toFixed(1);
  }

  function updateResultsFromServer(data) {
    console.log("Actualizando resultados con datos del servidor:", data);

    // Datos por materia
    if (data.subjects && data.subjects.length) {
      for (var i = 0; i < data.subjects.length; i++) {
        var subj = data.subjects[i];
        var index = i + 1; // 1, 2, 3

        // Actualizar promedios
        if (index === 1) {
          avgSubject1.textContent = formatNumber(subj.average);
          forecastSubject1.textContent = formatNumber(subj.forecast);
        } else if (index === 2) {
          avgSubject2.textContent = formatNumber(subj.average);
          forecastSubject2.textContent = formatNumber(subj.forecast);
        } else if (index === 3) {
          avgSubject3.textContent = formatNumber(subj.average);
          forecastSubject3.textContent = formatNumber(subj.forecast);
        }
      }
    }

    // Datos globales
    globalAverage.textContent = formatNumber(data.global_average);
    globalForecast.textContent = formatNumber(data.global_forecast);
  }

  /* 8. EVENTO SUBMIT (cuando se presiona “Calcular promedios”)
     Lógica para backend:
     - Se validan datos en el navegador
     - Construye un objeto JSON
     - Envía al backend Flask (POST /calculate)
     - Recibe promedios y pronósticos desde el servidor
  */

  gradeForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Evita recarga de página
    console.log("Botón CALCULAR presionado");

    // Ejecutar validación básica
    if (!validateForm()) {
      return;
    }

    // Mantener nombres de materias actualizados
    syncSubjectLabels();

    // Obtener calificaciones de las tres materias.
    var s1 = getSubjectGrades(1);
    var s2 = getSubjectGrades(2);
    var s3 = getSubjectGrades(3);

    // Obtener nombres de materias 
    var name1 = labelSubject1.textContent || "Materia 1";
    var name2 = labelSubject2.textContent || "Materia 2";
    var name3 = labelSubject3.textContent || "Materia 3";

    // Datos generales del estudiante
    var studentName = document.getElementById("studentName").value.trim();

    // Construir el payload para el backend
    var payload = {
      student_name: studentName,
      subjects: [
        { name: name1, grades: s1 },
        { name: name2, grades: s2 },
        { name: name3, grades: s3 }
      ]
    };

    console.log("Enviando datos al backend Flask:", payload);

    // Solicitud fetch al backend para realizar los cálculos
    fetch("/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Enviar cookie de sesión
      body: JSON.stringify(payload)
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.error) {
          showError("Error desde el servidor: " + data.error);
          return;
        }

        // Actualizar resultados con datos procesados en el backend
        updateResultsFromServer(data);

        console.log("Resultados finales del cálculo (servidor):", data);
        showSuccess("Cálculos realizados correctamente.");
      })
      .catch(function (err) {
        console.error("Error en la petición al servidor:", err);
        showError("Ocurrió un error al comunicarse con el servidor.");
      });
  });

  /* 9. BOTÓN “LIMPIAR DATOS”
     Restablece el formulario y limpia todos los resultados.*/

  clearBtn.addEventListener("click", function () {
    console.log("🧹 Botón LIMPIAR presionado. Reiniciando todo…");

    gradeForm.reset(); // Limpia inputs del formulario
    syncSubjectLabels(); // Restaura nombres

    // Reiniciar resultados de pantalla.
    avgSubject1.textContent = "-";
    avgSubject2.textContent = "-";
    avgSubject3.textContent = "-";

    forecastSubject1.textContent = "-";
    forecastSubject2.textContent = "-";
    forecastSubject3.textContent = "-";

    globalAverage.textContent = "-";
    globalForecast.textContent = "-";

    formMessage.textContent = "";
    formMessage.className = "";

    console.log(" Todo reiniciado correctamente.");
  });

  /* 10. FILTRO DE MATERIAS EN LA TABLA
     Muestra solo la materia seleccionada o todas.*/

  filterSubject.addEventListener("change", function () {
    console.log(" Filtro seleccionado:", filterSubject.value);

    var rows = document.querySelectorAll("[data-subject-row]");
    var value = filterSubject.value;

    // Mostrar u ocultar filas según el filtro.
    for (var i = 0; i < rows.length; i++) {
      var index = rows[i].getAttribute("data-subject-row");

      if (value === "all" || value === index) {
        rows[i].style.display = "";
      } else {
        rows[i].style.display = "none";
      }
    }
  });
});
