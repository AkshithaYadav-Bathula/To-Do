$(document).ready(function() { // document.addEventListener
    // Initialize the app when DOM is fully loaded
    loadTasks();
    setupEventListeners();

    function setupEventListeners() {
        // Form submission
        $("#taskForm").on("submit", addTask);
        
        // Edit task modal events
        $("#closeModal, #cancelEdit").on("click", closeEditModal);
        $("#saveTaskEdit").on("click", saveTaskEdit);
        
        // Event delegation for task list actions
        $("#taskList").on("click", function(event) { //on("click", selector, function)
            const $taskItem = $(event.target).closest("li");
            if ($taskItem.length === 0) return;
            
            const taskId = $taskItem.data("id");
            
            if ($(event.target).closest(".checkbox").length) {
                toggleTask(taskId);
            } else if ($(event.target).closest(".edit-btn").length) {
                openEditModal(taskId);
            } else if ($(event.target).closest(".delete-btn").length) {
                removeTask(taskId);
            }
        });
    }

    function addTask(event) {
        event.preventDefault();
        
        const name = $("#taskInput").val().trim();
        const deadline = $("#taskDeadline").val();
        
        if (!name || !deadline) {
            showToast("Please fill in all fields", "error");
            return;
        }
        
        const newTask = { 
            name, 
            deadline, 
            completed: false
        };
        
        $.ajax({
            url: 'http://localhost:3000/tasks',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(newTask),
            success: function(data) {
                showToast("Task added successfully", "success");
                
                // Reset form
                $("#taskInput").val("");
                $("#taskDeadline").val("");
                
                // Reload task list
                loadTasks();
            },
            error: function(xhr, status, error) {
                console.error('Error adding task:', error);
                showToast("Error adding task. Please try again.", "error");
            }
        });
    }

    function loadTasks() {
        $.ajax({
            url: 'http://localhost:3000/tasks',
            method: 'GET',
            success: function(tasks) {
                const $taskList = $("#taskList");
                const $taskCount = $("#taskCount");
                $taskList.empty();

                $taskCount.text(`${tasks.length} task${tasks.length !== 1 ? 's' : ''}`);

                // Sort tasks: incomplete first, then by deadline
                tasks.sort((a, b) => {
                    if (a.completed !== b.completed) return a.completed ? 1 : -1;
                    return new Date(a.deadline) - new Date(b.deadline);
                });

                tasks.forEach((task) => {
                    const isOverdue = new Date(task.deadline).getTime() < Date.now() && !task.completed;
                    const formattedDate = formatDateTime(task.deadline);

                    const $li = $("<li>").addClass(`task-item ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`)
                        .attr('data-id', task.id);

                    $li.html(`
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
                    `);

                    $taskList.append($li);
                });
            },
            error: function(xhr, status, error) {
                console.error('Error loading tasks:', error);
                showToast("Error loading tasks. Please try again.", "error");
            }
        });
    }

    function toggleTask(id) {
        // First, get the current task
        $.ajax({
            url: `http://localhost:3000/tasks/${id}`,
            method: 'GET',
            success: function(task) {
                // Toggle the completed status
                task.completed = !task.completed;
                
                // Update the task via PUT request
                $.ajax({
                    url: `http://localhost:3000/tasks/${id}`,
                    method: 'PUT',
                    contentType: 'application/json',
                    data: JSON.stringify(task),
                    success: function(updatedTask) {
                        // Show success message when task is completed
                        if (updatedTask.completed) {
                            showToast("Task completed successfully! 🎉", "success");
                        } else {
                            showToast("Task marked as incomplete", "success");
                        }
                        
                        loadTasks();
                    },
                    error: function(xhr, status, error) {
                        console.error('Error updating task:', error);
                        showToast("Error updating task. Please try again.", "error");
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Error fetching task for toggle:', error);
                showToast("Error updating task. Please try again.", "error");
            }
        });
    }

    function removeTask(id) {
        if (confirm("Are you sure you want to delete this task?")) {
            $.ajax({
                url: `http://localhost:3000/tasks/${id}`,
                method: 'DELETE',
                success: function() {
                    showToast("Task deleted", "success");
                    loadTasks();
                },
                error: function(xhr, status, error) {
                    console.error('Error deleting task:', error);
                    showToast("Error deleting task. Please try again.", "error");
                }
            });
        }
    }

    function openEditModal(id) {
        $.ajax({
            url: `http://localhost:3000/tasks/${id}`,
            method: 'GET',
            success: function(task) {
                $("#editTaskName").val(task.name);
                $("#editTaskDeadline").val(task.deadline);
                $("#editTaskIndex").val(id);
                
                $("#editTaskModal").addClass("show");
            },
            error: function(xhr, status, error) {
                console.error('Error fetching task for edit:', error);
                showToast("Error loading task details. Please try again.", "error");
            }
        });
    }

    function closeEditModal() {
        $("#editTaskModal").removeClass("show");
    }

    function saveTaskEdit() {
        const name = $("#editTaskName").val().trim();
        const deadline = $("#editTaskDeadline").val();
        const id = $("#editTaskIndex").val();
        
        if (!name || !deadline) {
            showToast("Please fill in all fields", "error");
            return;
        }
        
        // First, get the current task to preserve other properties
        $.ajax({
            url: `http://localhost:3000/tasks/${id}`,
            method: 'GET',
            success: function(task) {
                // Update the task properties
                task.name = name;
                task.deadline = deadline;
                
                // Update the task via PUT request
                $.ajax({
                    url: `http://localhost:3000/tasks/${id}`,
                    method: 'PUT',
                    contentType: 'application/json',
                    data: JSON.stringify(task),
                    success: function(updatedTask) {
                        closeEditModal();
                        showToast("Task updated successfully", "success");
                        loadTasks();
                    },
                    error: function(xhr, status, error) {
                        console.error('Error updating task:', error);
                        showToast("Error updating task. Please try again.", "error");
                    }
                });
            },
            error: function(xhr, status, error) {
                console.error('Error fetching task for edit:', error);
                showToast("Error loading task details. Please try again.", "error");
            }
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
        const $toastContainer = $("#toastContainer");
        
        const $toast = $("<div>")
            .addClass(`toast toast-${type}`)
            .html(`
                <span class="toast-icon">${type === "success" ? "✓" : "!"}</span>
                <span class="toast-message">${message}</span>
            `);
        
        $toastContainer.append($toast);
        
        setTimeout(() => {
            $toast.remove();
        }, 3000);
    }

    // Remove localStorage items as we're using JSON Server
    localStorage.removeItem("tasks");
});