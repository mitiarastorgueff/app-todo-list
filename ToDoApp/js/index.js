/*Класс User - сохранение/чтение токена авторизации*/
let instance = null;

class User {
    constructor(userLogin, token) {
        if (!instance) {
            instance = this;
        }
        this.userLogin = userLogin;
        this.token = token;
        return instance;
    }
    get userLogin() {
        return this._userLogin;
    }
    set userLogin(value) {
        this._userLogin = value;
    }
    get token() {
        return this._token;
    }
    set token(value) {
        this._token = value;
    }
    save() {
        let ls = window.localStorage;
        ls.setItem('userLogin', this.userLogin);
        ls.setItem('token', this.token);
    }
    loadUserLogin() {
        let ls = window.localStorage;
        this.userLogin = ls.getItem('userLogin');
        return this.userLogin;
    }
    loadToken() {
        let ls = window.localStorage;
        this.token = ls.getItem('token');
        return this.token;
    }
    clearDataAut() {
        let ls = window.localStorage;
        ls.clear();
    }
}

let user = new User("","");

/*Функция отображения элементов интерфейса ввода логина и пароля*/
function showLogin() {
    let tmplLogin = document.getElementById('template-login-form'),
        tmplNotifications = document.getElementById('template-notification');
    document.body.append(tmplLogin.content.cloneNode(true));
    document.body.append(tmplNotifications.content.cloneNode(true));
    let elementLoginNotifications = document.getElementById('notification');
    elementLoginNotifications.style.display = 'none';
}

/*Функция закрепления обработчиков событий за элементами интерфейса ввода логина и пароля*/
function bindEventLogin() {
    let addButtonSingIn = document.getElementById('submit-sing-in');
    addButtonSingIn.addEventListener("click", signUser);
}

/*Функция получения логина и пароля введённого пользователем*/
function inputLoginPassword() {
    let loginInput = document.getElementById("login-input"),
        passwordInput = document.getElementById("password-input");
    if (loginInput.value == 'Login' || passwordInput.value == 'Password') {
        showNotification("Enter login or password!", true);
        return null;
    } else {
        return {
            email: loginInput.value,
            password: passwordInput.value
        };
    }
}

/*Функция отправки введённых пользователем логина и пароля на сервер*/
function signUser() {
    let request = inputLoginPassword();
    if (request == null) {
        return null;
    } else {
        fetch('https://todo-app-back.herokuapp.com/login', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify(request)
        })
        .then(response => {
            if (!response.ok) {
                showNotification("Error HTTP: " + response.status + "!", true);
            } else {
                return response.json();
            }
        })
        .then(data => {
            if (data.token == null) {
                showNotification("Token not found!", true);
            } else {
                user.userLogin = data.id;
                user.token = data.token;
                user.save();
                toDoUser(data.token);
            }
        })
        .catch(error => {
            showNotification("Post sign in request failed!", true);
        });
    }
}

/*Класс Store - хранилище заданий tasks*/
class Store {
    constructor() {
        this.state = {
            tasks: []
        };
    }
    getState() {
        return this.state;
    }
    getTasksLength() {
        return this.state.tasks.length;
    }
    clearTasks() {
        for (let index = 0; index < this.getTasksLength(); index++) {
            this.state.tasks.splice(index);
        }
    }
}

let store = new Store();

/*Функция создания элемента в соответствии с переданными параметрми*/
function createTagElement(tag, properties, ...children) {
    let element = document.createElement(tag);
    Object.keys( properties ).forEach(key =>element[key] = properties[key]);
    if (children.length > 0) {
        children.forEach(child => {
            if (typeof child === 'string') child = document.createTextNode(child);
            element.appendChild(child);
        });
    }
    return element;
}

/*Функция создания нового Li элемента*/
function createNewLiElement(task) {
    let checkbox = createTagElement('input', {type: 'checkbox', className: 'checkbox'});
    let label = createTagElement('label', {className: 'title'}, task.title);
    let editInput = createTagElement('input', {type: 'text', className: 'textfield'});
    let editButton = createTagElement('button', {className: 'edit'}, 'EDIT');
    let deleteButton = createTagElement('button', {className: 'delete'}, 'DELETE');
    let listItem = createTagElement('li', {className: 'todo-item'}, checkbox, label, editInput, editButton, deleteButton);
    bindTaskEvents(listItem);
    if (task.finished == true) {
        checkbox.checked = true;
        listItem.classList.toggle('completed');
    }
    return listItem;
}

/*Функция закрепления обработчика событий за элементами Li*/
function bindTaskEvents(todoItem) {
    let checkbox = todoItem.querySelector('.checkbox'),
        editButton = todoItem.querySelector('.edit'),
        deleteButton = todoItem.querySelector('.delete');
    checkbox.addEventListener('change', finishedTask);
    editButton.addEventListener('click', editTask);
    deleteButton.addEventListener('click', deleteTask);
}

/*Функция вывода счётчика задач вверху списка*/
function counterTasks() {
    let allTasks = document.getElementById("all-tasks"),
        doneTasks = document.getElementById("done-tasks"),
        currentTasks = document.getElementById("current-tasks");
    allTasks.innerHTML = store.getTasksLength();
    let countDone = 0;
    for (let index = 0; index < store.getTasksLength(); index++) {
        if(store.state.tasks[index].finished) countDone++;
    }
    doneTasks.innerHTML = countDone;
    currentTasks.innerHTML = store.getTasksLength() - countDone;
}

/*Функция вывода счётчика задач справа списка*/
function counterRightTasks() {
    let allTasksRight = document.getElementById("all-right-tasks"),
        doneTasksRight = document.getElementById("done-right-tasks"),
        currentTasksRight = document.getElementById("current-right-tasks");
    allTasksRight.innerHTML = store.getTasksLength();
    let countDoneRight = 0;
    for (let index = 0; index < store.getTasksLength(); index++) {
        if(store.state.tasks[index].finished) countDoneRight++;
    }
    doneTasksRight.innerHTML = countDoneRight;
    currentTasksRight.innerHTML = store.getTasksLength() - countDoneRight;
}

/*Функция создания новой задачи*/
function createTask() {
    let inputTask = document.getElementById('add-input'),
        todoList  = document.getElementById('app-todo-list');
    if (inputTask.value.trim() == '') {
        showNotification("Enter task!", true);
    } else {
        if (inputTask.value.trim().length > 4 && inputTask.value.trim().length < 45) {
            let max = 0;
            for (let index = 0; index < store.getTasksLength(); index++) {
                if (max < store.state.tasks[index].taskId) max = store.state.tasks[index].taskId;
            }
            let task = {
                taskId: max + 1,
                title: inputTask.value.trim(),
                finished: false,
                date: dateToday(),
                user: user.loadUserLogin(),
                link: null
            };
            store.state.tasks.push(task);
            let todoItem = createNewLiElement(task);
            todoItem.id = task.taskId;
            todoList.prepend(todoItem);
            counterTasks();
            counterRightTasks();
            inputTask.value = '';
            requestAddTask(task);
        } else if (inputTask.value.trim().length > 45) {
            showNotification("Task is long!", true);
        } else {
            showNotification("Task is short!", true);
        }
    }
}

/*Функция редактирование задачи*/
function editTask() {
    let editEl = this.parentNode,
        editElId = editEl.id,
        done = 0,
        editTask = {},
        title = editEl.querySelector('.title'),
        editInput = editEl.querySelector('.textfield'),
        isEditing = editEl.classList.contains('editing'),
        checkbox = editEl.querySelector('.checkbox');
    for (let index = 0; index < store.getTasksLength(); index++) {
        if (store.state.tasks[index].taskId == editElId && store.state.tasks[index].finished == true) done = 1;
    }
    if (done == 0) {
        if (isEditing) {
            checkbox.style.display = 'block';
            title.innerText = editInput.value;
            this.innerText  = 'EDIT';
        } else {
            checkbox.style.display = 'none';
            editInput.value = title.innerText;
            this.innerText  = 'SAVE';
        }
        if (editInput.value.trim().length == '') {
            checkbox.style.display = 'none';
            showNotification("Enter task!", true);
            this.innerText  = 'SAVE';
        } else if (editInput.value.trim().length > 45) {
            checkbox.style.display = 'none';
            showNotification("Task is long!", true);
            this.innerText  = 'SAVE';
        } else if (editInput.value.trim().length < 5) {
            checkbox.style.display = 'none';
            showNotification("Task is short!", true);
            this.innerText  = 'SAVE';
        } else {
            editEl.classList.toggle('editing');
            for (let index = 0; index < store.getTasksLength(); index++) {
                if (store.state.tasks[index].taskId == editElId) {
                    store.state.tasks[index].title = editInput.value;
                    editTask = store.state.tasks[index];
                }
            }
            if (isEditing) requestEditTask(editTask);
        }
    } else {
        showNotification("Task is done!", true);
    }
}

/*Функция выполнения задачи*/
function finishedTask() {
    let finishedEl = this.parentNode,
        finishedElId = finishedEl.id,
        done = 0;
    for (let index = 0; index < store.getTasksLength(); index++) {
        if (store.state.tasks[index].taskId == finishedElId && store.state.tasks[index].finished == true) done = 1;
    }
    if (done == 0) {
    finishedEl.classList.toggle('completed');
    for (let index = 0; index < store.getTasksLength(); index++) {
        if (store.state.tasks[index].taskId == finishedElId) {
            store.state.tasks[index].finished = true;
            requestEditTask(store.state.tasks[index]);
        }
    }
    counterTasks();
    counterRightTasks();
    } else {
        showNotification("Task is done!", true);
        this.checked = true;
    }
}

/*Функция удаления задачи - удаление элемента Li + удаление задачи из хранилища задач*/
function deleteTask() {
    let removeEl = this.parentNode,
        removeElId = removeEl.id,
        todoList  = document.getElementById('app-todo-list');
    todoList.removeChild(removeEl);
    for (let [index, item] of store.state.tasks.entries()) {
        if (item.taskId == removeElId) {
            store.state.tasks.splice(index, 1);
            requestDeleteTask(item);
        }
    }
    counterTasks();
    counterRightTasks();
}

/*Функция вывода задач в соответствии с выбранным фильтром*/
function applicationFilter(statusTasks) {
    if (store.getTasksLength() == 0) {
        showNotification("List is empty!", false);
    } else {
        let todoList  = document.getElementById('app-todo-list');
        while(todoList.firstChild) todoList.removeChild(todoList.firstChild);
        for (let index = 0; index < store.getTasksLength(); index++) {
            if (statusTasks == 'all') {
                let todoItem = createNewLiElement(store.state.tasks[index]);
                todoItem.id = store.state.tasks[index].taskId;
                todoList.prepend(todoItem);
            }
            else if (statusTasks == 'true') {
                if (store.state.tasks[index].finished == true) {
                    let todoItem = createNewLiElement(store.state.tasks[index]);
                    todoItem.id = store.state.tasks[index].taskId;
                    todoList.prepend(todoItem);
                }
            }
            else if (statusTasks == 'false') {
                if (store.state.tasks[index].finished == false) {
                    let todoItem = createNewLiElement(store.state.tasks[index]);
                    todoItem.id = store.state.tasks[index].taskId;
                    todoList.prepend(todoItem);
                }
            }
        }
    }
}

/*Функция определения выбранного фильтра*/
function filterAllDoneCurrent() {
    let finished = '';
    switch (this.id) {
        case 'app-filter-all': finished = 'all';
            break;
        case 'app-filter-done': finished = 'true';
            break;
        case 'app-filter-current': finished = 'false';      
    }
    applicationFilter(finished);
}

/*Функция отображения элементов интерфейса ToDo списка*/
function showTodo() {
    let elementLogin = document.getElementById('login-form');
    if (elementLogin) {
        let elementLoginNotifications = document.getElementById('notification');
        document.body.removeChild(elementLogin);
        document.body.removeChild(elementLoginNotifications);
    }
    let tmplToDo = document.getElementById('template-app-form'),
        tmplNotifications = document.getElementById('template-notification');
    document.body.append(tmplToDo.content.cloneNode(true));
    document.body.append(tmplNotifications.content.cloneNode(true));
    let elementToDoNotifications = document.getElementById('notification');
    elementToDoNotifications.style.display = 'none';
}

/*Функция закрепления обработчиков событий за элементами интерфейса ToDo списка*/
function bindEventTodo() {
    let addButton = document.getElementById('add-button'),
        allTasksButton = document.getElementById('app-filter-all'),
        doneTasksButton = document.getElementById('app-filter-done'),
        currentTasksButton = document.getElementById('app-filter-current'),
        exitAppButton = document.getElementById('button-exit');
    addButton.addEventListener("click", createTask);
    allTasksButton.addEventListener("click", filterAllDoneCurrent);
    doneTasksButton.addEventListener("click", filterAllDoneCurrent);
    currentTasksButton.addEventListener("click", filterAllDoneCurrent);
    exitAppButton.addEventListener("click", logOutApp);
}

/*Заполнение данными списка tasks и Ul Li после отправки токена авторизации на сервер*/
function toDoUser(token) {
    showTodo();
    bindEventTodo();
    fetch('https://todo-app-back.herokuapp.com/todos', {
        method: 'GET',
        headers: {
            'Authorization': `${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            showNotification("Error HTTP: " + response.status + "!", true);
        } else {
            return response.json();
        }
    })
    .then(data => {
        if (data.length == 0) {
            showNotification("List is empty!", false);
        } else {
            let todoList  = document.getElementById('app-todo-list');
            for (let index = 0; index < data.length; index++) {
                let newTask = {
                    taskId: null,
                    title: "",
                    finished: false,
                    date: "",
                    user: "",
                    link: null
                };
                newTask.taskId = index + 1;
                newTask.title = data[index].text;
                newTask.finished = data[index].completed;
                newTask.date = data[index].createDate;
                newTask.user = data[index]._creator;
                newTask.link = data[index]._id;
                store.state.tasks[index] = newTask;
                let todoItem = createNewLiElement(store.state.tasks[index]);
                todoItem.id = store.state.tasks[index].taskId;
                todoList.prepend(todoItem);
            }
            counterTasks();
            counterRightTasks();
            showNotification("List uploaded!", false);
        }
    })
    .catch(error => {
        showNotification("Get request failed!", true);
    });
}

/*Запрос на сервер на добавление нового tasks*/
function requestAddTask(task) {
    let taskSend = {
        text: task.title
    };
    fetch('https://todo-app-back.herokuapp.com/todos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8',
            'Authorization': `${user.loadToken()}`,
        },
        body: JSON.stringify(taskSend)
    })
    .then(response => {
        if (!response.ok) {
            showNotification("Error HTTP: " + response.status + "!", true);
        } else {
            return response.json();
        }
    })
    .then(data => {
        let index = store.getTasksLength();
        store.state.tasks[index-1].link = data._id;
        showNotification("Task added!", false);
    })
    .catch(error => {
        showNotification("Post add request failed!", true);
    });
}

/*Запрос на сервер на обновление данных по редактируемому/выполненному task*/
function requestEditTask(task) {
    let taskUpdate = {
        completed: task.finished,
        text: task.title
    };
    fetch('https://todo-app-back.herokuapp.com/todos/' + task.link, {
        method: 'PUT',
        headers: {
            'Authorization': `${user.loadToken()}`,
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(taskUpdate)
    })
    .then(response => {
        if (!response.ok) {
            showNotification("Error HTTP: " + response.status + "!", true);
        } else {
            return response.json();
        }
    })
    .then(data => {
        showNotification("Task updated!", false);
    })
    .catch(error => {
        showNotification("Put request failed!", true);
    });
}

/*Запрос на сервер на удаление task*/
function requestDeleteTask(task) {
    fetch('https://todo-app-back.herokuapp.com/todos/' + task.link, {
        method: 'DELETE',
        headers: {
            'Authorization': `${user.loadToken()}`
        }
    })
    .then(response => {
        if (!response.ok) {
            showNotification("Error HTTP: " + response.status + "!", true);
        } else {
            return response.json();
        }
    })
    .then(data => {
        showNotification("Task deleted!", false);
    })
    .catch(error => {
        showNotification("Delete request failed!", true);
    });
}

/*Функция выхода из приложения*/
function logOutApp() {
    user.clearDataAut();
    store.clearTasks();
    let elementApp = document.getElementById('app-form');
    if (elementApp) {
        let elementLoginNotifications = document.getElementById('notification');
        document.body.removeChild(elementApp);
        document.body.removeChild(elementLoginNotifications);
    }
    let tmplLogin = document.getElementById('template-login-form'),
        tmplNotifications = document.getElementById('template-notification');
    document.body.append(tmplLogin.content.cloneNode(true));
    document.body.append(tmplNotifications.content.cloneNode(true));
    let elementToDoNotifications = document.getElementById('notification');
    elementToDoNotifications.style.display = 'none';
    bindEventLogin();
}

/*Создание уведомлений при различных действиях пользователя*/
function showNotification(msg, wrn) {
    let notificationWindow = document.getElementById("notification");
    let p = notificationWindow.querySelector("p");
    p.innerText = msg;
    if (wrn) {
        p.style.color = 'red';
    } else {
        p.style.color = 'green';
    }
    notificationWindow.style.display = 'block';
    setTimeout(function () {
        notificationWindow.style.display = 'none';
    }, 5000);
}

/*Функция вычисления текущей даты mm/dd/yyyy*/
function dateToday() {
    let today = new Date();
    let dd = today.getDate(); 
    let mm = today.getMonth() + 1;
    let yyyy = today.getFullYear();
    if (dd < 10) {
        dd = '0' + dd;
    }
    if (mm < 10) {
        mm = '0' + mm;
    }
    let todayNew = mm + '/' + dd + '/' + yyyy;
    return todayNew;
}

/*Функция, в зависимости от наличия токена 
перенаправляет на элемент логина или Todo списка*/
function routing() {
    let token = user.loadToken();
    if (token) {
        toDoUser(token);
    } else {
        showLogin();
        bindEventLogin();
    }
}