document.addEventListener("DOMContentLoaded", () => {
    // Initialize the app
    console.log("DOM is fully loaded and parsed!");
    loadTasks();
    setupEventListeners();
});

function setupEventListeners() {
    // Form submission
    document.getElementById("taskForm").addEventListener("submit", addTask);
    
    // Edit task modal
    document.getElementById("closeModal").addEventListener("click", closeEditModal);
    document.getElementById("cancelEdit").addEventListener("click", closeEditModal);
    document.getElementById("saveTaskEdit").addEventListener("click", saveTaskEdit);
    
    // Event Delegation for task list (including checkbox handling)
    document.getElementById("taskList").addEventListener("click", function(event) {
        const taskItem = event.target.closest("li");
        if (!taskItem) return;
        
        const taskId = taskItem.dataset.id;
        console.log("Clicked on task with ID:", taskId);
        
        if (event.target.closest(".checkbox")) {
            console.log("Checkbox clicked for task ID:", taskId);
            toggleTask(taskId);
        } else if (event.target.closest(".edit-btn")) {
            console.log("Edit button clicked for task ID:", taskId);
            openEditModal(taskId);
        } else if (event.target.closest(".delete-btn")) {
            console.log("Delete button clicked for task ID:", taskId);
            removeTask(taskId);
        }
    });
}

function addTask(event) {
    event.preventDefault();
    
    const taskInput = document.getElementById("taskInput");
    const taskDeadline = document.getElementById("taskDeadline");
    
    const name = taskInput.value.trim();
    const deadline = taskDeadline.value;
    
    if (!name || !deadline) {
        showToast("Please fill in all fields", "error");
        return;
    }
    
    const newTask = { 
        name, 
        deadline, 
        completed: false
    };
    
    console.log("Adding new task:", newTask);
    
    // Send POST request to add the task
    fetch('http://localhost:3000/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTask)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log("Task added successfully:", data);
        
        // Reset form
        taskInput.value = "";
        taskDeadline.value = "";
        
        // Show success message
        showToast("Task added successfully", "success");
        
        // Reload task list
        loadTasks();
    })
    .catch(error => {
        console.error('Error adding task:', error);
        showToast("Error adding task. Please try again.", "error");
    });
}

function loadTasks() {
    console.log("Loading tasks from JSON Server...");
    fetch('http://localhost:3000/tasks')
    .then(response => {
        if (!response.ok) {
            console.error('Server response error:', response.status, response.statusText);
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(tasks => {
        console.log("Fetched tasks:", tasks);
        
        const taskList = document.getElementById("taskList");
        const taskCount = document.getElementById("taskCount");
        taskList.innerHTML = "";

        taskCount.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;

        // Sort tasks: incomplete first, then by deadline
        tasks.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });

        tasks.forEach((task) => {
            const isOverdue = new Date(task.deadline).getTime() < Date.now() && !task.completed;
            const formattedDate = formatDateTime(task.deadline);

            const li = document.createElement("li");
            li.className = `task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
            li.dataset.id = task.id;

            console.log(`Creating task element for ID: ${task.id}, completed: ${task.completed}`);

            li.innerHTML = `
                <div class="task-content">
                    <div class="task-title">${task.name}</div>
                    <div class="task-date">${isOverdue ? '⚠ ' : '<i class="far fa-clock"></i> '}${formattedDate}</div>
                </div>
                <div class="task-actions">
                    <label class="checkbox-wrapper">
                        <input type="checkbox" class="checkbox" ${task.completed ? "checked" : ""}>
                        <span class="checkmark"></span>
                    </label>
                    <button class="action-btn edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            `;

            taskList.appendChild(li);
        });
    })
    .catch(error => {
        console.error('Error loading tasks:', error);
        showToast("Error loading tasks. Please try again.", "error");
    });
}

function toggleTask(id) {
    console.log(`Toggling task completion for ID: ${id}`);
    
    // First, get the current task
    fetch(`http://localhost:3000/tasks/${id}`)
    .then(response => {
        if (!response.ok) {
            console.error('Error fetching task for toggle:', response.status, response.statusText);
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(task => {
        console.log(`Current task state:`, task);
        
        // Toggle the completed status
        task.completed = !task.completed;
        console.log(`Updated task state:`, task);
        
        // Update the task via PUT request
        return fetch(`http://localhost:3000/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        });
    })
    .then(response => {
        if (!response.ok) {
            console.error('Error updating task:', response.status, response.statusText);
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(updatedTask => {
        console.log(`Task updated successfully:`, updatedTask);
        
        // Show success message when task is completed
        if (updatedTask.completed) {
            showToast("Task completed successfully! 🎉", "success");
        } else {
            showToast("Task marked as incomplete", "success");
        }
        
        loadTasks();
    })
    .catch(error => {
        console.error('Error toggling task:', error);
        showToast("Error updating task. Please try again.", "error");
    });
}

function removeTask(id) {
    console.log(`Attempting to remove task ID: ${id}`);
    
    if (confirm("Are you sure you want to delete this task?")) {
        // Delete task via DELETE request
        fetch(`http://localhost:3000/tasks/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                console.error('Error deleting task:', response.status, response.statusText);
                throw new Error('Network response was not ok');
            }
            console.log(`Task ${id} deleted successfully`);
            showToast("Task deleted", "success");
            loadTasks();
        })
        .catch(error => {
            console.error('Error deleting task:', error);
            showToast("Error deleting task. Please try again.", "error");
        });
    }
}

function openEditModal(id) {
    console.log(`Opening edit modal for task ID: ${id}`);
    
    // Fetch the specific task by ID
    fetch(`http://localhost:3000/tasks/${id}`)
    .then(response => {
        if (!response.ok) {
            console.error('Error fetching task for edit:', response.status, response.statusText);
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(task => {
        console.log(`Task data for editing:`, task);
        
        document.getElementById("editTaskName").value = task.name;
        document.getElementById("editTaskDeadline").value = task.deadline;
        document.getElementById("editTaskIndex").value = id;
        
        const modal = document.getElementById("editTaskModal");
        modal.classList.add("show");
    })
    .catch(error => {
        console.error('Error fetching task for edit:', error);
        showToast("Error loading task details. Please try again.", "error");
    });
}

function closeEditModal() {
    console.log("Closing edit modal");
    const modal = document.getElementById("editTaskModal");
    modal.classList.remove("show");
}

function saveTaskEdit() {
    const name = document.getElementById("editTaskName").value.trim();
    const deadline = document.getElementById("editTaskDeadline").value;
    const id = document.getElementById("editTaskIndex").value;
    
    console.log(`Saving edited task ID: ${id}`);
    console.log(`New values: name=${name}, deadline=${deadline}`);
    
    if (!name || !deadline) {
        showToast("Please fill in all fields", "error");
        return;
    }
    
    // First, get the current task to preserve other properties
    fetch(`http://localhost:3000/tasks/${id}`)
    .then(response => {
        if (!response.ok) {
            console.error('Error fetching task for edit:', response.status, response.statusText);
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(task => {
        console.log(`Current task state before edit:`, task);
        
        // Update the task properties
        task.name = name;
        task.deadline = deadline;
        
        console.log(`Updated task state:`, task);
        
        // Update the task via PUT request
        return fetch(`http://localhost:3000/tasks/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        });
    })
    .then(response => {
        if (!response.ok) {
            console.error('Error updating task:', response.status, response.statusText);
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then((updatedTask) => {
        console.log(`Task updated successfully:`, updatedTask);
        closeEditModal();
        showToast("Task updated successfully", "success");
        loadTasks();
    })
    .catch(error => {
        console.error('Error updating task:', error);
        showToast("Error updating task. Please try again.", "error");
    });
}

// Helper function to format date and time
function formatDateTime(dateTimeStr) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    };
    return new Date(dateTimeStr).toLocaleDateString(undefined, options);
}

// Show toast notification
function showToast(message, type = "success") {
    console.log(`Showing toast: ${message} (${type})`);
    
    const toastContainer = document.getElementById("toastContainer");
    
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === "success" ? "✓" : "!"}</span>
        <span class="toast-message">${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Clear the previous localStorage implementation as we're using JSON Server
// console.log("Removing localStorage items as we're using JSON Server");
localStorage.removeItem("tasks");