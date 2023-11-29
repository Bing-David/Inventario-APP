"use strict";

//--comunicar este archivo de reder con electron
const { app } = require('electron');
const { ipcRenderer } = window.require('electron');


// Función para abrir la conexión con la base de datos
let activeTab = "prestados";
const DB_NAME = 'EQUIPOS';
const DB_VERSION = 1;
let db;


// Función para abrir la conexión con la base de datos
function openDatabase() {
  const request = window.indexedDB.open(DB_NAME, DB_VERSION);

  request.onerror = () => {
    console.log('Error opening database');
    mostrarNotificacion("Error en la base de datos")
  };

  request.onsuccess = () => {
    db = request.result;
    displayPrestados();
    displayHistorial();
    console.log('Database opened successfully');
    console.log('DB creada correctamente');
    mostrarNotificacion("base de datos cargada")
  };

  request.onupgradeneeded = (event) => {
    const db = event.target.result;

    // Tabla de equipos prestados
    const prestadosStore = db.createObjectStore('prestados', { keyPath: 'placa' });
    prestadosStore.createIndex('cedula', 'cedula',{ unique: false });

    // Tabla de equipos entregados
    const entregadosStore = db.createObjectStore('entregados', { keyPath: 'id',autoIncrement: true });
    entregadosStore.createIndex('cedula', 'cedula', { unique: false });

    // Tabla de historial
    const historialStore = db.createObjectStore('historial', { keyPath: 'id', autoIncrement: true });
    historialStore.createIndex('placa', 'placa', { unique: false });
  };
  
  // Ajustar el límite de almacenamiento a 20 GB
  request.addEventListener('upgradeneeded', (event) => {
    const db = event.target.result;
    
    if (db.objectStoreNames.contains('prestados')) {
      const prestadosStore = event.currentTarget.transaction.objectStore('prestados');
      prestadosStore.requestSize = 20 * 1024 * 1024 * 1024; // 20 GB
    }
    
    if (db.objectStoreNames.contains('entregados')) {
      const entregadosStore = event.currentTarget.transaction.objectStore('entregados');
      entregadosStore.requestSize = 20 * 1024 * 1024 * 1024; // 20 GB
    }
    
    if (db.objectStoreNames.contains('historial')) {
      const historialStore = event.currentTarget.transaction.objectStore('historial');
      historialStore.requestSize = 20 * 1024 * 1024 * 1024; // 20 GB
    }
  });

  

  
// Obtén los elementos de filtro del DOM
const filtroFechaInput = document.getElementById('filtroFecha');
const filtroHoraInput = document.getElementById('filtroHora');
const filtroMesInput = document.getElementById('filtroMes');
const filtroAnioInput = document.getElementById('filtroAnio');

// Botón para filtrar por fecha
document.getElementById('filtrarPorFecha').addEventListener('click', () => {
  const filtroFecha = filtroFechaInput.value;
  displayEntregados(filtroFecha, null, null, null);
});

// Botón para filtrar por hora
document.getElementById('filtrarPorHora').addEventListener('click', () => {
  const filtroHora = filtroHoraInput.value;
  displayEntregados(null, filtroHora, null, null);
});

// Botón para filtrar por mes
document.getElementById('filtrarPorMes').addEventListener('click', () => {
  const filtroMes = filtroMesInput.value;
  displayEntregados(null, null, filtroMes, null);
});

// Botón para filtrar por año
document.getElementById('filtrarPorAnio').addEventListener('click', () => {
  const filtroAnio = filtroAnioInput.value;
  displayEntregados(null, null, null, filtroAnio);
});



//Historial filtro
 // Obtén los elementos de filtro del DOM para el historial
 const filtroFechaHistorialInput = document.getElementById('filtroFechaHistorial');
 const filtroHoraHistorialInput = document.getElementById('filtroHoraHistorial');
 const filtroMesHistorialInput = document.getElementById('filtroMesHistorial');
 const filtroAnioHistorialInput = document.getElementById('filtroAnioHistorial');

 // Botón para filtrar por fecha en el historial
 document.getElementById('filtrarPorFechaHistorial').addEventListener('click', () => {
   const filtroFecha = filtroFechaHistorialInput.value;
   displayHistorial(filtroFecha, null, null, null);
 });

 // Botón para filtrar por hora en el historial
 document.getElementById('filtrarPorHoraHistorial').addEventListener('click', () => {
   const filtroHora = filtroHoraHistorialInput.value;
   displayHistorial(null, filtroHora, null, null);
 });

 // Botón para filtrar por mes en el historial
 document.getElementById('filtrarPorMesHistorial').addEventListener('click', () => {
   const filtroMes = filtroMesHistorialInput.value;
   displayHistorial(null, null, filtroMes, null);
 });

 // Botón para filtrar por año en el historial
 document.getElementById('filtrarPorAnioHistorial').addEventListener('click', () => {
   const filtroAnio = filtroAnioHistorialInput.value;
   displayHistorial(null, null, null, filtroAnio);
 });





}


//minimize maximize window
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('minimizeBtn').addEventListener('click', () => {
    ipcRenderer.send('minimize');
  });

  document.getElementById('closeBtn').addEventListener('click', () => {
    ipcRenderer.send('close');
  });
});



// Función para obtener la fecha actual de los prestamos
function getCurrentDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  let month = currentDate.getMonth() + 1;
  month = month < 10 ? '0' + month : month;
  let day = currentDate.getDate();
  day = day < 10 ? '0' + day : day;

  return `${year}-${month}-${day}`;
}

// Función para obtener la hora actual en formato de 24h
function getCurrentTime() {
  const currentDate = new Date();
  let hours = currentDate.getHours();
  hours = hours < 10 ? '0' + hours : hours;
  let minutes = currentDate.getMinutes();
  minutes = minutes < 10 ? '0' + minutes : minutes;

  return `${hours}:${minutes}`;
}


//Funcion para controlar notificaciones |Errores| tareas listas|
function mostrarNotificacion(texto) {
  const notificacion = document.getElementById("notificacion");
  notificacion.textContent = texto;
  notificacion.classList.add("visible");

  setTimeout(() => {
    notificacion.classList.remove("visible");
  }, 2005);
}

// Función para agregar un equipo prestado a la base de datos
function addPrestado(placa, nombre, cedula, equipo) {
  const transaction = db.transaction(['prestados'], 'readwrite');
  const store = transaction.objectStore('prestados');
  
  const getRequest = store.get(placa); // Obtener el elemento con la placa especificada

  getRequest.onsuccess = (event) => {
    const existingItem = event.target.result;
    
    if (existingItem) {
      // Si el elemento ya existe, mostrar una notificación y salir de la función
      mostrarNotificacion("El equipo ya ha sido prestado");
      return;
    }

    const request = store.add({
      placa: placa,
      nombre: nombre,
      cedula: cedula,
      equipo: equipo,
      fecha: getCurrentDate(),
      hora: getCurrentTime()
    });

    request.onsuccess = () => {
      displayPrestados();
      mostrarNotificacion("Equipo añadido");
    };

    request.onerror = () => {
      mostrarNotificacion("No se puede añadir");
    };
  };

  getRequest.onerror = () => {
    mostrarNotificacion("Error al buscar el elemento");
  };
}

//funcion  para calcular duracion del prestamo
function calcularDuracion(fechaInicio, horaInicio, fechaFin, horaFin) {
  if (!fechaInicio || !horaInicio || !fechaFin || !horaFin) {
    return 'En Curso';
  }

  const fechaInicioObj = new Date(fechaInicio + ' ' + horaInicio);
  const fechaFinObj = new Date(fechaFin + ' ' + horaFin);
  const duracionMs = fechaFinObj - fechaInicioObj;

  const segundos = Math.floor((duracionMs / 1000) % 60);
  const minutos = Math.floor((duracionMs / (1000 * 60)) % 60);
  const horas = Math.floor(duracionMs / (1000 * 60 * 60));

  return `${horas}h ${minutos}m ${segundos}s`;
}

// Función para devolver un equipo prestado
function devolverEquipo(placa) {
  const transaction = db.transaction(['prestados', 'entregados', 'historial'], 'readwrite');
  const prestadosStore = transaction.objectStore('prestados');
  const entregadosStore = transaction.objectStore('entregados');
  const historialStore = transaction.objectStore('historial');

  const getPrestadoRequest = prestadosStore.get(placa);

  getPrestadoRequest.onsuccess = (event) => {
    const equipoPrestado = event.target.result;

    if (equipoPrestado) {
      const { placa,nombre,cedula ,equipo, fecha, hora } = equipoPrestado;
      const equipoEntregado = { placa, nombre,cedula,equipo,fecha, hora, horaEntrega: getCurrentTime(), fechaEntrega: getCurrentDate() };

      const addEntregadoRequest = entregadosStore.add(equipoEntregado);

      addEntregadoRequest.onsuccess = () => {
        prestadosStore.delete(placa);
        historialStore.add(equipoEntregado);
        displayPrestados();
        displayEntregados();
        console.log('Equipment returned');
      };
    }
  };
  mostrarNotificacion("!Equipo Devuelto!")
}




//----------------------------------------------------------------
//Funciones para mostrar el contenido de equipos prestados en tablas o modales
function displayPrestados() {
  const tableBody = document.querySelector('#prestados-table tbody');
  tableBody.innerHTML = '';

  const transaction = db.transaction(['prestados'], 'readonly');
  const store = transaction.objectStore('prestados');
  const request = store.openCursor();

  request.onsuccess = (event) => {
    const cursor = event.target.result;

    if (cursor) {
      const { placa, nombre,cedula,equipo,fecha, hora } = cursor.value;
      const row = createTableRow(placa,nombre,cedula,equipo,fecha, hora);
      const actionsCell = createActionsCell(placa);
      row.appendChild(actionsCell);
      tableBody.appendChild(row);
      cursor.continue();
    }
  };
}

function displayEntregados(filtroFecha, filtroHora, filtroMes, filtroAnio) {
  const tableBody = document.querySelector('#entregados-table tbody');
  tableBody.innerHTML = '';

  const transaction = db.transaction(['entregados'], 'readonly');
  const store = transaction.objectStore('entregados');
  const request = store.openCursor();

  request.onsuccess = (event) => {
    const cursor = event.target.result;

    if (cursor) {
      const { placa, nombre, cedula, equipo, fecha, hora, fechaEntrega, horaEntrega } = cursor.value;

      // Filtrar por fecha, hora, mes y año si se especifica un filtro
      if (
        (!filtroFecha || fecha === filtroFecha) &&
        (!filtroHora || hora === filtroHora) &&
        (!filtroMes || fecha.startsWith(filtroMes)) &&
        (!filtroAnio || fecha.startsWith(filtroAnio))
      ) {
        const row = createTableRow(placa, nombre, cedula, equipo, fecha, hora, fechaEntrega, horaEntrega);
        tableBody.appendChild(row);
      }

      cursor.continue();
    }
  };
}

function displayHistorial(filtroFecha, filtroHora, filtroMes, filtroAnio) {
  const tableBody = document.querySelector('#historial-table tbody');
  tableBody.innerHTML = '';

  const transaction = db.transaction(['historial'], 'readonly');
  const store = transaction.objectStore('historial');
  const request = store.openCursor();

  request.onsuccess = (event) => {
    const cursor = event.target.result;

    if (cursor) {
      const { placa, nombre, cedula, equipo, fecha, hora, fechaEntrega, horaEntrega } = cursor.value;

      // Filtrar por fecha, hora, mes y año si se especifica un filtro
      if (
        (!filtroFecha || fecha === filtroFecha) &&
        (!filtroHora || hora === filtroHora) &&
        (!filtroMes || fecha.startsWith(filtroMes)) &&
        (!filtroAnio || fecha.startsWith(filtroAnio))
      ) {
        const row = createTableRow(placa, nombre, cedula, equipo, fecha, hora, fechaEntrega, horaEntrega);
        tableBody.appendChild(row);
      }

      cursor.continue();
    }
  };
}

function displayEventos() {
  const tableBody = document.querySelector('#eventos-table tbody');
  tableBody.innerHTML = '';

  const transaction = db.transaction(['historial'], 'readonly');
  const store = transaction.objectStore('historial');
  const request = store.openCursor();

  const eventos = {}; // Objeto para almacenar la información de los eventos

  request.onsuccess = (event) => {
    const cursor = event.target.result;

    if (cursor) {
      const { placa, nombre, cedula, equipo, fecha, hora, fechaEntrega, horaEntrega } = cursor.value;

      // Verificar si ya se ha registrado un evento para esta placa
      if (!eventos.hasOwnProperty(placa)) {
        eventos[placa] = {
          numeroPrestadas: 0,
          personas: []
        };
      }

      // Incrementar el contador de veces prestadas para esta placa
      eventos[placa].numeroPrestadas++;

      // Agregar la persona al arreglo de personas para esta placa
      eventos[placa].personas.push({
        cedula: cedula,
        nombre: nombre,
        duracion: calcularDuracion(fecha, hora, fechaEntrega, horaEntrega),
        fecha: fecha,
        hora: hora,
        fechaEntrega: fechaEntrega,
        horaEntrega: horaEntrega
      });

      cursor.continue();
    } else {
      // Todos los eventos han sido procesados, mostrar la información en la tabla
      for (const placa in eventos) {
        if (eventos.hasOwnProperty(placa)) {
          const { numeroPrestadas, personas } = eventos[placa];

          const row = createEventosTableRow(placa, numeroPrestadas, personas);
          tableBody.appendChild(row);
        }
      }
    }
  };
}

function displayPersonas() {
  //Esta funcion almacena en la DB, la información de las personas, junto a los equipos que han sido prestados a ellos
  const tableBody = document.querySelector('#personas-table tbody');
  tableBody.innerHTML = '';

  const transaction = db.transaction(['historial'], 'readonly');
  const store = transaction.objectStore('historial');
  const request = store.openCursor();

  const personas = {}; // Objeto para almacenar la información de las personas y sus equipos prestados

  request.onsuccess = (event) => {
    const cursor = event.target.result;

    if (cursor) {
      const { cedula, nombre } = cursor.value;

      // Verificar si ya se ha registrado una persona con esta cédula
      if (!personas.hasOwnProperty(cedula)) {
        personas[cedula] = {
          nombre: nombre,
          numeroEquiposPrestados: 0,
          equiposPrestados: []
        };
      }

      // Incrementar el contador de equipos prestados para esta persona
      personas[cedula].numeroEquiposPrestados++;

      // Agregar el equipo prestado al arreglo de equipos prestados para esta persona
      personas[cedula].equiposPrestados.push(cursor.value);

      cursor.continue();
    } else {
      // Todas las personas y equipos prestados han sido procesados, mostrar la información en la tabla
      for (const cedula in personas) {
        if (personas.hasOwnProperty(cedula)) {
          const { nombre, numeroEquiposPrestados, equiposPrestados } = personas[cedula];

          const row = createPersonasTableRow(cedula, nombre, numeroEquiposPrestados, equiposPrestados);
          tableBody.appendChild(row);
        }
      }
    }
  };
}

function mostrarEquiposPrestados(equiposPrestados) {
  //--Esta funcion muestra en una tabla los equipos en un modal, perteceiente a la seccion de "PERSONAS"
  const modal = document.getElementById('modal1');
  const modalContent = document.querySelector('.modal-content');
  const equiposContainer = document.getElementById('equipos-container');

  // Limpiar el contenido anterior del modal
  equiposContainer.innerHTML = '';

  // Crear los elementos HTML para mostrar la información de los equipos prestados
  for (const equipo of equiposPrestados) {
    const equipoInfo = document.createElement('ul');
    equipoInfo.innerHTML = `
      <li><strong>Placa:</strong> ${equipo.placa}</li>
      <li><strong>FICHA:</strong> ${equipo.equipo}</li>
      <li><strong>Fecha:</strong> ${equipo.fecha}</li>
      <li><strong>Hora Prestado:</strong> ${equipo.hora}</li>
      <li><strong>Hora de Entrega:</strong> ${equipo.horaEntrega}</li>
    </ul>
    `;
    equiposContainer.appendChild(equipoInfo);
  }

  // Mostrar el modal con la información de los equipos prestados
  modal.style.display = 'block';
  
}

function mostrarPersonas(personas) {
  const modal = document.getElementById('modal2');
  const modalContent = document.querySelector('.modal-content2');
  const personasContainer = document.getElementById('personas-container');

  // Limpiar el contenido anterior del modal
  personasContainer.innerHTML = '';

  // Crear los elementos HTML para mostrar la información de las personas
  for (const persona of personas) {
    const personaInfo = document.createElement('ul');
    personaInfo.innerHTML = `
      <li><strong>Cédula:</strong> ${persona.cedula}</li>
      <li><strong>Nombre:</strong> ${persona.nombre}</li>
      <li><strong>Duración:</strong> ${persona.duracion}</li> 
      <li><strong>Fecha:</strong> ${persona.fecha}</li>
      <li><strong>Hora:</strong> ${persona.hora}</li>
      <li><strong>Fecha de Entrega:</strong> ${persona.fechaEntrega}</li>
      <li><strong>Hora de Entrega:</strong> ${persona.horaEntrega}</li>
    `;

    personasContainer.appendChild(personaInfo);
  }

  // Mostrar el modal
  modal.style.display = 'block';


}

function createEventosTableRow(placa, numeroPrestadas, personas) {
// Función para crear una fila de la tabla de eventos
  const row = document.createElement('tr');

  const placaCell = document.createElement('td');
  placaCell.textContent = placa;
  row.appendChild(placaCell);

  const numeroPrestadasCell = document.createElement('td');
  numeroPrestadasCell.textContent = numeroPrestadas;
  row.appendChild(numeroPrestadasCell);

  const personasCell = document.createElement('td');

  const mostrarPersonasButton = document.createElement('button');
  mostrarPersonasButton.textContent = 'Mostrar personas';
  mostrarPersonasButton.addEventListener('click', () => {
    mostrarPersonas(personas);
  });
  personasCell.appendChild(mostrarPersonasButton);

  row.appendChild(personasCell);

  return row;
}
function createPersonasTableRow(cedula, nombre, numeroEquiposPrestados, equiposPrestados) {
// Función para crear una fila de la tabla de personas

  const row = document.createElement('tr');

  const cedulaCell = document.createElement('td');
  cedulaCell.textContent = cedula;
  row.appendChild(cedulaCell);

  const nombreCell = document.createElement('td');
  nombreCell.textContent = nombre;
  row.appendChild(nombreCell);

  const numeroEquiposPrestadosCell = document.createElement('td');
  numeroEquiposPrestadosCell.textContent = numeroEquiposPrestados;
  row.appendChild(numeroEquiposPrestadosCell);

  const equiposPrestadosCell = document.createElement('td');

  const mostrarEquiposButton = document.createElement('button');
  mostrarEquiposButton.textContent = 'Mostrar equipos';
  mostrarEquiposButton.addEventListener('click', () => {
    mostrarEquiposPrestados(equiposPrestados);
  });
  equiposPrestadosCell.appendChild(mostrarEquiposButton);

  row.appendChild(equiposPrestadosCell);

  return row;
}

function createTableRow(placa,nombre,cedula,equipo,fecha, hora, fechaEntrega, horaEntrega) {
  const row = document.createElement('tr');

  const placaCell = document.createElement('td');
  placaCell.textContent = placa;
  row.appendChild(placaCell);

  const nombreCell = document.createElement('td');
  nombreCell.textContent = nombre;
  row.appendChild(nombreCell);


  const cedulaCell = document.createElement('td');
  cedulaCell.textContent = cedula;
  row.appendChild(cedulaCell)


  const equipoCell = document.createElement('td');
  equipoCell.textContent = equipo;
  row.appendChild(equipoCell);

  const duracionCell = document.createElement('td');
  duracionCell.textContent = calcularDuracion(fecha, hora, fechaEntrega, horaEntrega);
  row.appendChild(duracionCell);
  

;

  const fechaCell = document.createElement('td');
  fechaCell.textContent = fecha;
  row.appendChild(fechaCell);

  const horaCell = document.createElement('td');
  horaCell.textContent = hora;
  row.appendChild(horaCell);

  if (fechaEntrega && horaEntrega) {
    const fechaEntregaCell = document.createElement('td');
    fechaEntregaCell.textContent = fechaEntrega;
    row.appendChild(fechaEntregaCell);

    const horaEntregaCell = document.createElement('td');
    horaEntregaCell.textContent = horaEntrega;
    row.appendChild(horaEntregaCell);
  }

  return row;
}

function createActionsCell(placa) {
  const actionsCell = document.createElement('td');

  const editarBtn = document.createElement('button');  
  editarBtn.textContent = 'Editar ';
  editarBtn.classList.add('edit-btn');
  editarBtn.addEventListener('click', () => {
    editEquipment(placa);
  });
  actionsCell.appendChild(editarBtn);

  const borrarBtn = document.createElement('button');
  borrarBtn.textContent = 'Borrar';
  borrarBtn.classList.add('delete-btn');
  borrarBtn.addEventListener('click', () => {
    deleteEquipment(placa);
  });
  actionsCell.appendChild(borrarBtn);

  const devolverBtn = document.createElement('button');
  devolverBtn.textContent = 'Devolver';
  devolverBtn.classList.add('return-btn');
  devolverBtn.addEventListener('click', () => {
    devolverEquipo(placa);
  });
  actionsCell.appendChild(devolverBtn);

  return actionsCell;
}


//----------------------------------------------------------------
// Función para cerrar el modal
function closeModal() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.style.display = 'none';
  });
}

const closeSpans = document.querySelectorAll('.close');
closeSpans.forEach(closeSpan => {
  closeSpan.addEventListener('click', closeModal);
});

//----------------------------------------------------------------






//----------------------------------------------------------------

//Funciones de edicion y eliminacion del contenido de las tablas

let editedPlacas = [];
function editEquipment(placa) {
//Funcion para editar los prestamos
  const transaction = db.transaction(['prestados'], 'readwrite');
  const store = transaction.objectStore('prestados');
  const request = store.get(placa);

  request.onsuccess = (event) => {
    const equipoPrestado = event.target.result;

    if (equipoPrestado) {
      const { nombre, cedula, equipo } = equipoPrestado;

      document.getElementById('editModal').style.display = 'block';

      document.getElementById('editedNombre').value = nombre;
      document.getElementById('editedCedula').value = cedula;
      document.getElementById('editedEquipo').value = equipo;

      document.getElementById('cancelEditBtn').addEventListener('click', () => {
        document.getElementById('editModal').style.display = 'none';
      });

      document.getElementById('editForm').addEventListener('submit', (e) => {
        e.preventDefault();

        const editedNombre = document.getElementById('editedNombre').value;
        const editedCedula = document.getElementById('editedCedula').value;
        const editedEquipo = document.getElementById('editedEquipo').value;

        if (editedNombre !== '' && editedCedula !== '') {
          // Verifica si esta placa ya se ha editado
          if (!editedPlacas.includes(placa)) {
            const newTransaction = db.transaction(['prestados'], 'readwrite');
            const newStore = newTransaction.objectStore('prestados');

            const editedEquipment = {
              placa,
              nombre: editedNombre,
              cedula: editedCedula,
              equipo: editedEquipo,
              fecha: getCurrentDate(),
              hora: getCurrentTime()
            };

            const updateRequest = newStore.put(editedEquipment);

            updateRequest.onsuccess = () => {
              newTransaction.commit();
              // Almacena la placa para evitar duplicados
              editedPlacas.push(placa);
              displayPrestados();
              mostrarNotificacion('Equipo actualizado');
              document.getElementById('editModal').style.display = 'none';
              setTimeout(() => {
                location.reload();
              }, 1000); //Tiempo de espera para la actualizacion de los datos 2S por defecto.
              mostrarNotificacion('Espera un momento');
  
            };

            updateRequest.onerror = () => {
              newTransaction.abort();
              mostrarNotificacion('Error Actualizando Equipo');
            };
          } else {
            mostrarNotificacion('Espera un momento');
          
          }
        }
      });
    }
  };


}

function deleteEquipment(placa) {
  //Funcion para borrar los prestamos
  const transaction = db.transaction(['prestados'], 'readwrite');
  const store = transaction.objectStore('prestados');
  const request = store.delete(placa);

  request.onsuccess = () => {
    displayPrestados();
    mostrarNotificacion('Equipo Borrado')
  };

  request.onerror = () => {
    mostrarNotificacion('Error al Borrar')
  };
}
//----------------------------------------------------------------








//----------------------------------------------------------------
//--Funciones para exportar contenido en formato "xlsx", Requiere estar conectado a internet.
//Para tener una correcta conexion con la CDN de la API "index.html en la cabezara de la APP"

function exportTableToExcel() {
  mostrarNotificacion('Procesando..');
  try{
  const table = document.getElementById('entregados-table');
  const rows = table.getElementsByTagName('tr');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Equipos Entregados');

  // Agregar encabezados de columna
  const headers = ['Placa','nombre','Cedula','Ficha','Duracion de Prestamo','Fecha', 'Hora de Prestamo', 'Fecha de Entrega', 'Hora de Entrega'];
  worksheet.addRow(headers);

  for (let i = 0; i < rows.length; i++) {
    const tableRow = [];
    const cells = rows[i].getElementsByTagName('td');

    for (let j = 0; j < cells.length; j++) {
      tableRow.push(cells[j].textContent);
    }

    worksheet.addRow(tableRow);
  }

  // Generar el archivo XLSX
  workbook.xlsx.writeBuffer().then((data) => {
    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.target = '_blank';
    let data_time=getCurrentDate();
    link.download = data_time+'_Equipos_Entregados.xlsx';
    link.click();
    mostrarNotificacion('Exportando tabla "Entregados" ');
  
  
  })} catch (error) {
    console.error('Error al exportar a Excel:', error);
    mostrarNotificacion('Error en internet o API https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js', 'error');
  }
}


function exportTableToExcel_Historial() {
  mostrarNotificacion('Procesando..');
  try{
  const table = document.getElementById('historial-table');
  const rows = table.getElementsByTagName('tr');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Equipos Entregados');

  // Agregar encabezados de columna
  const headers = ['Placa','Nombre','Cedula','Equipo','Duracion de Prestamo' ,'Fecha', 'Hora de Prestamo', 'Fecha de Entrega', 'Hora de Entrega'];
  worksheet.addRow(headers);

  for (let i = 0; i < rows.length; i++) {
    const tableRow = [];
    const cells = rows[i].getElementsByTagName('td');

    for (let j = 0; j < cells.length; j++) {
      tableRow.push(cells[j].textContent);
    }

    worksheet.addRow(tableRow);
  }

  // Generar el archivo XLSX
  workbook.xlsx.writeBuffer().then((data) => {
    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.target = '_blank';
    let data_time=getCurrentDate();
    link.download = data_time+'_Historial_De_Prestamos.xlsx';
    link.click();
    mostrarNotificacion('Exportando tabla "Historial" ');
  });} catch (error) {
    console.error('Error al exportar a Excel:', error);
    mostrarNotificacion('Error en internet o API https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js', 'error');
  }
}

//----------------------------------------------------------------








 
//----------------------DB------------------------------------------

// Evento para abrir la conexión con la base de datos al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  openDatabase();
});
//-----------------------DB-----------------------------------------





//-----------------------TAB-BUTTOM-----------------------------------------
//Funcion para controlar el TAB entre "entregados,","historial","eventos(Equipos)","personas"
function changeTab(tab) {
  const tabs = document.getElementsByClassName('tab');
  const tabContents = document.getElementsByClassName('tab-content');

  // Eliminar la clase 'active' de todos los elementos de la clase 'tab'
  for (let i = 0; i < tabs.length; i++) {
    tabs[i].classList.remove('active');
    tabContents[i].style.display = 'none';
  }

  // Verificar si el parámetro 'tab' es válido antes de continuar
  if (tab) {
    // Agregar la clase 'active' al elemento 'tab' seleccionado
    tab.classList.add('active');
    const tabId = tab.getAttribute('data-tab');

    // Mostrar el contenido correspondiente al tab seleccionado
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
      tabContent.style.display = 'block';

      // Mostrar los datos correspondientes al tab seleccionado
      if (tabId === 'prestados') {
        displayPrestados();
      } else if (tabId === 'entregados') {
        displayEntregados();
      } else if (tabId === 'historial') {
        displayHistorial();
      } else if (tabId === 'eventos') {
        displayEventos();
      }else if (tabId === 'personas') {
        displayPersonas();
      }
    }
  }
}

const tabButtons = document.getElementsByClassName('tab-button');

for (let i = 0; i < tabButtons.length; i++) {
  tabButtons[i].addEventListener('click', () => {
    changeTab(tabButtons[i]);
  });
}


document.addEventListener('DOMContentLoaded', function () {
  const tabs = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      const target = this.getAttribute('data-tab');

      // Ocultar todas las tablas y desactivar los botones de pestañas
      tabContents.forEach(function (content) {
        content.style.display = 'none';
      });
      tabs.forEach(function (tab) {
        tab.classList.remove('active');
      });

      // Mostrar la tabla correspondiente y activar el botón de la pestaña seleccionada
      document.getElementById(target).style.display = 'block';
      this.classList.add('active');
    });
  });
});


//-----------------------TAB-BUTTOM-----------------------------------------


//--------Borrar historial--------------------------------------------------------
function deleteHistorial(tabla) {
// Función para borrar historial

  const transaction = db.transaction([tabla], 'readwrite');
  const objectStore = transaction.objectStore(tabla);

  const request = objectStore.clear();

  request.onsuccess = function () {
    console.log(`Historial ${tabla} borrado correctamente.`);
    mostrarNotificacion('Hisotirial Borrado Correctamente');
  };

  request.onerror = function (error) {
    console.error('Error al borrar el historial:', error);
    mostrarNotificacion('error al borrar el Historial')
    
  };
}
//--------Borrar historial--------------------------------------------------------







function buscarTabla(inputId, tableId) {
  const input = document.getElementById(inputId).value.toUpperCase();
  const table = document.getElementById(tableId);
  const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName('td');
    let found = false;

    for (let j = 0; j < cells.length; j++) {
      const cell = cells[j];
      const cellValue = cell.textContent || cell.innerText;

      if (cellValue.toUpperCase().indexOf(input) > -1) {
        found = true;
        break;
      }
    }

    rows[i].style.display = found ? '' : 'none';
  }
}

function searchSubInfo() {
  const input5 = document.getElementById('search-input5').value.toUpperCase();
  const input7 = document.getElementById('search-input7').value.toUpperCase();
  const personasContainer = document.getElementById('personas-container');
  const equiposContainer = document.getElementById('equipos-container');
  
  searchInContainer(personasContainer, input5);
  searchInContainer(equiposContainer, input7);
}

function searchInContainer(container, input) {
  const rows = container.getElementsByTagName('ul');
  
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName('li');
    let found = false;

    for (let j = 0; j < cells.length; j++) {
      const cell = cells[j];

      if (cell) {
        const cellValue = cell.textContent || cell.innerText;

        if (cellValue.toUpperCase().indexOf(input) > -1) {
          found = true;
          break;
        }
      }
    }

    if (found) {
      rows[i].style.display = '';
    } else {
      rows[i].style.display = 'none';
    }
  }
}








//--------------------------------------------------------------------------------------------------------------------------------
//Funciones para calcular espacio libe para almacenar datos en INDEXDB
function consultarCuota() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    mostrarNotificacion('Consultado...')

    navigator.storage.estimate().then((estimate) => {
      const quota = estimate.quota;
      const usage = estimate.usage;

      const quotaFormatted = formatSize(quota);
      const usageFormatted = formatSize(usage);

      const resultadoDiv = document.getElementById('resultado');
      resultadoDiv.innerHTML = `
        <span>Cuota disponible: ${quotaFormatted}</span><br>
        Uso actual: <span class="usage">${usageFormatted}</span>
      `;

      const modal = document.getElementById('modal_info');
      modal.style.display = 'block';
    }).catch((error) => {
      mostrarNotificacion(error);
    });
  } else {
    mostrarNotificacion('No compatible con la API');
    alert('No compatible con la API');
  }
}

//Formatear datos a GB
function formatSize(size) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let index = 0;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }

  return `${size.toFixed(2)} ${units[index]}`;
}
//Boton de  para abrir la consulta
document.getElementById('consultar-btn').addEventListener('click', () => {
  consultarCuota();
});




//--------------------------------------------------------------------------------------------------------------------------------


//--------------------------------------------------------------------------------------------------------------------------------
//Exportar datos en Formato JSON, exporta todos los datos 
function exportDatabaseToJSON() {
  const transaction = db.transaction(['prestados', 'entregados', 'historial'], 'readonly');

  // Objeto para almacenar todos los datos de las tablas
  const data = {
    prestados: [],
    entregados: [],
    historial: []
  };

  // Obtener datos de la tabla de equipos prestados
  transaction.objectStore('prestados').openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      data.prestados.push({
        placa: cursor.value.placa,
        nombre: cursor.value.nombre,
        cedula: cursor.value.cedula,
        equipo: cursor.value.equipo,
        fecha: cursor.value.fecha,
        hora: cursor.value.hora
      });
      cursor.continue();
    }
  };

  // Obtener datos de la tabla de equipos entregados
  transaction.objectStore('entregados').openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      data.entregados.push({
        placa: cursor.value.placa,
        nombre: cursor.value.nombre,
        cedula: cursor.value.cedula,
        equipo: cursor.value.equipo,
        fecha: cursor.value.fecha,
        hora: cursor.value.hora,
        horaEntrega: cursor.value.horaEntrega,
        fechaEntrega: cursor.value.fechaEntrega
      });
      cursor.continue();
    }
  };

  // Obtener datos de la tabla de historial
  transaction.objectStore('historial').openCursor().onsuccess = function (event) {
    const cursor = event.target.result;
    if (cursor) {
      data.historial.push({
        placa: cursor.value.placa,
        nombre: cursor.value.nombre,
        cedula: cursor.value.cedula,
        equipo: cursor.value.equipo,
        fecha: cursor.value.fecha,
        hora: cursor.value.hora,
        horaEntrega: cursor.value.horaEntrega,
        fechaEntrega: cursor.value.fechaEntrega
      });
      cursor.continue();
    }
  };


function downloadJSON(data, filename) {
  const json = JSON.stringify(data, null, 2); // Agregar espaciado para formatear el JSON
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  URL.revokeObjectURL(url);
}



  // Espera un breve momento para que se recopilen los datos y luego exporta a JSON
  setTimeout(function () {
    downloadJSON(data, 'database.json');
  }, 1000);
}

const exportJsonBoton = document.getElementById("export-btn-JSON-DB");
exportJsonBoton.addEventListener('click',(()=>{
  exportDatabaseToJSON();
  mostrarNotificacion("JSON DB exportando")
}))
//--------------------------------------------------------------------------------------------------------------------------------


//----------------------------------------------------------------
//Funcion para activar el modo osculro

//selecionar boton apartir de su ID
const toggleButton = document.getElementById('toggle-mode-btn');
//añade un evento y la llamada a la funcion.
toggleButton.addEventListener('click', toggleDarkMode);
function addDarkModeClasses() {

  //Esta funcion añade una nueva CLASE la con el mismo nombre pero con la clave "dark-" al inicio cual
  //Luego en el archivo dark-style.css se maipula para adecuar los estilos a "modo oscuro"
  const elements = document.getElementsByTagName('*');
  for (let i = 0; i < elements.length; i++) {
    const classNames = elements[i].classList;
    const newClassNames = Array.from(classNames, className => 'dark-' + className);
    elements[i].classList.add(...newClassNames);
  }
}
function removeDarkModeClasses() {
  const elements = document.getElementsByTagName('*');
  for (let i = 0; i < elements.length; i++) {
    const classNames = elements[i].classList;
    const removeClassNames = Array.from(classNames, className => className.startsWith('dark-') ? className : null).filter(Boolean);
    elements[i].classList.remove(...removeClassNames);
  }
}
function toggleDarkMode() {
  const darkModeStyle = document.getElementById('dark-mode-style');
  if (darkModeStyle) {
    removeDarkModeClasses();
    darkModeStyle.remove();
  } else {
    addDarkModeClasses();
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = 'dark-style.css';
    linkElement.id = 'dark-mode-style';
    document.head.appendChild(linkElement);
  }
}
//----------------------------------------------------------------




//--------------------------------------------------------------------------------------------------------------------------------
//Eventos par controlar entradas del usuario
document.getElementById('search-input').addEventListener('keyup', () => {
  buscarTabla('search-input', 'prestados-table');
});

document.getElementById('search-input2').addEventListener('keyup', () => {
  buscarTabla('search-input2', 'entregados-table');
});

document.getElementById('search-input3').addEventListener('keyup', () => {
  buscarTabla('search-input3', 'historial-table');
});

document.getElementById('search-input4').addEventListener('keyup', () => {
  buscarTabla('search-input4', 'eventos-table');
});

document.getElementById('search-input6').addEventListener('keyup', () => {
  buscarTabla('search-input6', 'personas-table');
});

document.getElementById('search-input5').addEventListener('keyup', searchSubInfo);
document.getElementById('search-input7').addEventListener('keyup', searchSubInfo);


document.getElementById('prestamo-form').addEventListener('submit', (event) => { //Envio de formulario
// Evento para manejar el envío del formulario de préstamo de equipos
  event.preventDefault();
  const placa = document.getElementById('placa').value.trim();
  const cedula = document.getElementById('cedula').value.trim();
  const nombre = document.getElementById('nombre').value.trim();
  const equipo = document.getElementById('equipo').value.trim();

  if (placa === '' || cedula === ''){
    mostrarNotificacion('PLACA Y CEDULA SON OBLIGATORIOS');
  } else {
    addPrestado(placa, nombre,cedula,equipo);
    document.getElementById('prestamo-form').reset();
  }
});

document.getElementById('export-btn').addEventListener('click', () => {
// Evento para exportar la tabla en formato Excel
  exportTableToExcel();
});

document.getElementById('export-btn-historial').addEventListener('click', () => {
// Evento para exportar la tabla en formato Excel
    exportTableToExcel_Historial();
});


document.getElementById('borrarEntregados').addEventListener('click', function () {
// Borrar historial de equipos entregados
  deleteHistorial('entregados');

  setTimeout(() => {
    location.reload();
  }, 3000); //Tiempo de espera para la actualizacion de los datos 2S por defecto.
  mostrarNotificacion('Espera un momento');

});

document.getElementById('borrarHistorial').addEventListener('click', function () {
// Borrar historial completo
  deleteHistorial('historial');
  setTimeout(() => {
    location.reload();
  }, 3000); 
  mostrarNotificacion('Espera un momento');
});

// Obtener referencia al botón para abrir el formulario
const openFormBtn = document.getElementById('openFormBtn');

// Obtener referencia al contenedor del formulario
const formContainer = document.getElementById('prestamoFormContainer');

// Obtener referencia al botón de cancelar
const cancelFormBtn = document.getElementById('cancelFormBtn');

openFormBtn.addEventListener('click', function () {
// Agregar evento de clic al botón para abrir el formulario
  formContainer.style.display = 'block';
});

cancelFormBtn.addEventListener('click', function () {
// Agregar evento de clic al botón de cancelar

  formContainer.style.display = 'none';
});

document.getElementById('prestamo-form').addEventListener('submit', function (event) {
// Agregar evento de envío al formulario
  event.preventDefault(); // Evitar el envío del formulario por defecto
  
  // Obtener los valores del formulario
  const placa = document.getElementById('placa').value;
  const cedula = document.getElementById('cedula').value;
  const nombre = document.getElementById('nombre').value;
  const equipo = document.getElementById('equipo').value;
  
  // Realizar las acciones necesarias con los datos del formulario
  
  // Cerrar la ventana flotante
  formContainer.style.display = 'none';
});

//--------------------------------------------------------------------------------------------------------------------------------

