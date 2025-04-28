// Inicializa as listas de tarefas e lixeira a partir do localStorage ou cria arrays vazios
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let trash = JSON.parse(localStorage.getItem('trash')) || [];
let filter = 'all'; // Filtro atual para exibir tarefas
let currentView = 'tasks';  // Define se estamos vendo tarefas ou lixeira
let editingTaskId = null; // ID da tarefa que está sendo editada (null se nenhuma)

// Salva a lista de tarefas no localStorage
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Salva a lista da lixeira no localStorage
function saveTrash() {
  localStorage.setItem('trash', JSON.stringify(trash));
}

// Adiciona uma nova tarefa ou atualiza uma existente
function addTask(event) {
  event.preventDefault(); // Evita que a página recarregue

  // Pega os valores dos inputs
  const taskTitle = document.getElementById('task-title');
  const taskDescription = document.getElementById('task-description');
  const taskDate = document.getElementById('task-date');

  // Cria um objeto de nova tarefa
  const newTask = {
    id: editingTaskId || Date.now(), // Usa o ID antigo se for edição, senão gera novo
    title: taskTitle.value.trim(),
    description: taskDescription.value.trim(),
    date: taskDate.value,
    completed: false,
    status: 'on-time'
  };

  // Se estivermos editando, atualiza a tarefa
  if (editingTaskId) {
    const index = tasks.findIndex(t => t.id === editingTaskId);
    if (index !== -1) {
      tasks[index] = newTask;
    }
    editingTaskId = null; // Reseta o modo edição
  } else {
    tasks.push(newTask); // Se não for edição, adiciona uma nova tarefa
  }

  // Salva e limpa os campos
  saveTasks();
  taskTitle.value = '';
  taskDescription.value = '';
  taskDate.value = '';

  renderTaskList(); // Atualiza a lista na tela
}

// Atualiza o status de uma tarefa (atrasada, concluída, etc.)
function updateTaskStatus(task) {
  const today = new Date();
  const dueDate = new Date(task.date);

  if (task.completed) {
    task.status = 'completed';
  } else if (dueDate.toDateString() === today.toDateString()) {
    task.status = 'due-soon';
  } else if (dueDate < today) {
    task.status = 'overdue';
  } else {
    task.status = 'on-time';
  }
}

// Renderiza a lista de tarefas ou da lixeira
function renderTaskList() {
  const taskList = document.getElementById('task-list');
  taskList.innerHTML = ''; // Limpa a lista antes de redesenhar

  const tasksToDisplay = currentView === 'tasks' ? tasks : trash;

  // Nova função para mostrar mensagem caso a lixeira esteja vazia
  if (currentView === 'trash' && trash.length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.textContent = 'No deleted tasks.';
    emptyMessage.style.color = '#6c757d'; // Cinza escuro
    emptyMessage.style.listStyle = 'none';
    emptyMessage.style.textAlign = 'center';
    taskList.appendChild(emptyMessage);
    return; // Para aqui, não precisa renderizar mais
  }

  // Ordena as tarefas de acordo com a data de vencimento, priorizando as com status 'due-soon'
  tasksToDisplay.sort((a, b) => {
    if (a.status === 'due-soon' && b.status !== 'due-soon') {
      return -1; // Prioriza tarefas 'due-soon'
    } else if (b.status === 'due-soon' && a.status !== 'due-soon') {
      return 1; // Coloca tarefas 'due-soon' antes
    }

    // Se ambas tiverem o mesmo status, ordena pela data de vencimento
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB; // Ordena do mais próximo ao mais distante
  });

  // Renderiza cada tarefa conforme o filtro
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

// Renderiza uma tarefa ativa
function renderTask(task) {
  const taskList = document.getElementById('task-list');
  const li = document.createElement('li');
  li.className = task.status; // Define a classe conforme o status

  // Cria elementos para título, descrição e data
  const titleSpan = document.createElement('span');
  titleSpan.textContent = `Title: ${task.title}`;

  const descriptionSpan = document.createElement('span');
  descriptionSpan.textContent = `Description: ${task.description}`;

  const dateSpan = document.createElement('span');
  dateSpan.textContent = `Due Date: ${formatDate(task.date)}`;

  // Botão para deletar
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.className = 'delete-btn';
  deleteBtn.addEventListener('click', () => deleteTask(task.id));

  // Botão para editar
  const editBtn = document.createElement('button');
  editBtn.textContent = 'Edit';
  editBtn.className = 'edit-btn';
  editBtn.addEventListener('click', () => editTask(task.id));

  // Adiciona tudo dentro do item de lista
  li.appendChild(titleSpan);
  li.appendChild(descriptionSpan);
  li.appendChild(dateSpan);
  li.appendChild(deleteBtn);
  li.appendChild(editBtn);
  taskList.appendChild(li);
}

// Renderiza uma tarefa na lixeira
function renderTrashTask(task) {
  const taskList = document.getElementById('task-list');
  const li = document.createElement('li');
  li.style.borderLeft = '6px solid #343a40'; // Marca visual diferente para lixeira

  const titleSpan = document.createElement('span');
  titleSpan.textContent = `Title: ${task.title}`;

  const descriptionSpan = document.createElement('span');
  descriptionSpan.textContent = `Description: ${task.description}`;

  const dateSpan = document.createElement('span');
  dateSpan.textContent = `Due Date: ${formatDate(task.date)}`;

  // Botão para restaurar a tarefa
  const restoreBtn = document.createElement('button');
  restoreBtn.textContent = 'Restore';
  restoreBtn.className = 'restore-btn';
  restoreBtn.addEventListener('click', () => restoreTask(task.id));

  // Botão para deletar permanentemente
  const deletePermanentBtn = document.createElement('button');
  deletePermanentBtn.textContent = 'Delete Permanently';
  deletePermanentBtn.className = 'delete-btn';
  deletePermanentBtn.addEventListener('click', () => deletePermanent(task.id));

  li.appendChild(titleSpan);
  li.appendChild(descriptionSpan);
  li.appendChild(dateSpan);
  li.appendChild(restoreBtn);
  li.appendChild(deletePermanentBtn);
  taskList.appendChild(li);
}

// Coloca a tarefa no formulário para editar
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description;
    document.getElementById('task-date').value = task.date;
    editingTaskId = task.id; // Marca qual tarefa está sendo editada
  }
}

// Alterna entre a visualização de tarefas e lixeira
function toggleView(view) {
  currentView = currentView === view ? 'tasks' : view;
  renderTaskList();
}

// Formata a data para o formato dd/mm/yyyy
function formatDate(dateString) {
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Move uma tarefa para a lixeira
function deleteTask(id) {
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    trash.push(tasks[index]); // Move para a lixeira
    tasks.splice(index, 1); // Remove da lista de tarefas
    saveTasks();
    saveTrash();
    renderTaskList();
  }
}

// Restaura uma tarefa da lixeira para a lista ativa
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

// Exclui definitivamente uma tarefa da lixeira
function deletePermanent(id) {
  const index = trash.findIndex(t => t.id === id);
  if (index !== -1) {
    trash.splice(index, 1);
    saveTrash();
    renderTaskList();
  }
}

// Aplica o filtro selecionado
function filterTasks() {
  filter = document.getElementById('filter').value;
  renderTaskList();
}

// Ao carregar a página, renderiza a lista inicial
renderTaskList();
