// Initialisiert die Aufgaben- und Papierkorb-Listen aus dem localStorage oder erstellt leere Arrays
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let trash = JSON.parse(localStorage.getItem('trash')) || [];
let filter = 'all'; // Aktueller Filter zur Anzeige von Aufgaben
let currentView = 'tasks';  // Zeigt an, ob Aufgaben oder Papierkorb angezeigt werden
let editingTaskId = null; // ID der Aufgabe, die gerade bearbeitet wird (null, wenn keine)

// Speichert die Aufgabenliste im localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Speichert die Papierkorb-Liste im localStorage
function saveTrash() {
  localStorage.setItem('trash', JSON.stringify(trash));
}

// Fügt eine neue Aufgabe hinzu oder aktualisiert eine bestehende
function addTask(event) {
  event.preventDefault(); // Verhindert das Neuladen der Seite

  // Holt die Werte aus den Eingabefeldern
  const taskTitle = document.getElementById('task-title');
  const taskDescription = document.getElementById('task-description');
  const taskDate = document.getElementById('task-date');

  // Erstellt ein neues Aufgabenobjekt
  const newTask = {
    id: editingTaskId || Date.now(), // Verwendet die alte ID, wenn Bearbeitung; sonst neue ID
    title: taskTitle.value.trim(),
    description: taskDescription.value.trim(),
    date: taskDate.value,
    completed: false,
    status: 'on-time'
  };

  // Wenn wir eine Aufgabe bearbeiten, wird sie aktualisiert
  if (editingTaskId) {
    const index = tasks.findIndex(t => t.id === editingTaskId);
    if (index !== -1) {
      tasks[index] = newTask;
    }
    editingTaskId = null; // Setzt den Bearbeitungsmodus zurück
  } else {
    tasks.push(newTask); // Neue Aufgabe hinzufügen
  }

  // Speichert und leert die Felder
  saveTasks();
  taskTitle.value = '';
  taskDescription.value = '';
  taskDate.value = '';

  renderTaskList(); // Aktualisiert die Aufgabenliste auf der Seite
}

// Aktualisiert den Status einer Aufgabe (überfällig, erledigt usw.)
function updateTaskStatus(task) {
  const today = new Date();
  const dueDate = new Date(task.date);

  // Setzt Uhrzeit auf 00:00:00, um Zeitprobleme zu vermeiden
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Unterschied in Tagen

  if (task.completed) {
    task.status = 'completed';
  } else if (diffDays >= 0 && diffDays <= 3) {
    task.status = 'due-soon'; // Fällig heute oder in den nächsten 3 Tagen
  } else if (diffDays < 0) {
    task.status = 'overdue'; // Bereits überfällig
  } else {
    task.status = 'on-time'; // Mehr als 3 Tage übrig
  }
}

// Rendert die Aufgabenliste oder den Papierkorb
function renderTaskList() {
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = ''; // Leert die Liste vor dem Neuzeichnen

  const tasksToDisplay = currentView === 'tasks' ? tasks : trash;

  // Zeigt eine Nachricht, wenn der Papierkorb leer ist
  if (currentView === 'trash' && trash.length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.textContent = 'Keine gelöschten Aufgaben.';
    emptyMessage.style.color = '#6c757d'; // Dunkelgrau
    emptyMessage.style.listStyle = 'none';
    emptyMessage.style.textAlign = 'center';
    taskList.appendChild(emptyMessage);
    return;
  }

  // Sortiert Aufgaben nach Fälligkeitsdatum, priorisiert "due-soon"
  tasksToDisplay.sort((a, b) => {
    if (a.status === 'due-soon' && b.status !== 'due-soon') {
      return -1;
    } else if (b.status === 'due-soon' && a.status !== 'due-soon') {
      return 1;
    }

    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });

  // Rendert jede Aufgabe entsprechend dem Filter
  tasksToDisplay.forEach(task => {
    updateTaskStatus(task);
    if (
      filter === 'all' ||
      (filter === 'on-time' && task.status === 'on-time') ||
      (filter === 'due-soon' && task.status === 'due-soon') ||
      (filter === 'overdue' && task.status === 'overdue') ||
      (filter === 'completed' && task.status === 'completed')
    ) {
      currentView === 'tasks' ? renderTask(task) : renderTrashTask(task);
    }
  });
}

// Rendert eine aktive Aufgabe
function renderTask(task) {
  const taskList = document.getElementById('task-list');
  const li = document.createElement('li');
  li.className = task.status;

  const titleSpan = document.createElement('span');
  titleSpan.textContent = `Titel: ${task.title}`;

  const descriptionSpan = document.createElement('span');
  descriptionSpan.textContent = `Beschreibung: ${task.description}`;

  const dateSpan = document.createElement('span');
  dateSpan.textContent = `Fällig am: ${formatDate(task.date)}`;

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Löschen';
  deleteBtn.className = 'delete-btn';
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  const editBtn = document.createElement('button');
  editBtn.textContent = 'Bearbeiten';
  editBtn.className = 'edit-btn';
  editBtn.addEventListener('click', () => editTask(task.id));

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.completed;
  checkbox.addEventListener('change', () => {
    task.completed = checkbox.checked;
    updateTaskStatus(task);
    saveTasks();
    renderTaskList();
  });
  li.prepend(checkbox);

  li.appendChild(titleSpan);
  li.appendChild(descriptionSpan);
  li.appendChild(dateSpan);
  li.appendChild(deleteBtn);
  li.appendChild(editBtn);
  taskList.appendChild(li);
}

// Rendert eine Aufgabe im Papierkorb
function renderTrashTask(task) {
  const taskList = document.getElementById('task-list');
  const li = document.createElement('li');
  li.style.borderLeft = '6px solid #343a40'; // Visuelle Markierung für Papierkorb

  const titleSpan = document.createElement('span');
  titleSpan.textContent = `Titel: ${task.title}`;

  const descriptionSpan = document.createElement('span');
  descriptionSpan.textContent = `Beschreibung: ${task.description}`;

  const dateSpan = document.createElement('span');
  dateSpan.textContent = `Fällig am: ${formatDate(task.date)}`;

  const restoreBtn = document.createElement('button');
  restoreBtn.textContent = 'Wiederherstellen';
  restoreBtn.className = 'restore-btn';
  restoreBtn.addEventListener('click', () => restoreTask(task.id));

  const deletePermanentBtn = document.createElement('button');
  deletePermanentBtn.textContent = 'Endgültig löschen';
  deletePermanentBtn.className = 'delete-btn';
  deletePermanentBtn.addEventListener('click', () => deletePermanent(task.id));

  li.appendChild(titleSpan);
  li.appendChild(descriptionSpan);
  li.appendChild(dateSpan);
  li.appendChild(restoreBtn);
  li.appendChild(deletePermanentBtn);
  taskList.appendChild(li);
}

// Lädt die Aufgabe in das Formular zum Bearbeiten
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description;
    document.getElementById('task-date').value = task.date;
    editingTaskId = task.id;
  }
}

// Wechselt zwischen Aufgabenansicht und Papierkorb
function toggleView(view) {
  currentView = currentView === view ? 'tasks' : view;
  renderTaskList();
}

// NEUE FUNKTION – Gibt das Datum im deutschen Format TT MM JJJJ zurück
function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');     // TT
  const month = String(date.getMonth() + 1).padStart(2, '0'); // MM
  const year = date.getFullYear();                          // JJJJ
  return `${day} ${month} ${year}`;
}

// Verschiebt eine Aufgabe in den Papierkorb
function deleteTask(id) {
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    trash.push(tasks[index]);
    tasks.splice(index, 1);
    saveTasks();
    saveTrash();
    renderTaskList();
  }
}

// Stellt eine Aufgabe aus dem Papierkorb wieder her
function restoreTask(id) {
  const index = trash.findIndex(t => t.id === id);
  if (index !== -1) {
    tasks.push(trash[index]);
    trash.splice(index, 1);
    saveTasks();
    saveTrash();
    renderTaskList();
  }
}

// Löscht eine Aufgabe dauerhaft aus dem Papierkorb
function deletePermanent(id) {
  const index = trash.findIndex(t => t.id === id);
  if (index !== -1) {
    trash.splice(index, 1);
    saveTrash();
    renderTaskList();
  }
}

// Wendet den ausgewählten Filter an
function filterTasks() {
  filter = document.getElementById('filter').value;
  renderTaskList();
}

// Rendert die Liste beim Laden der Seite
renderTaskList();
