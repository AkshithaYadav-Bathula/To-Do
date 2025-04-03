# To-Do Application

This is a To-Do application where users can  
- Add tasks  
- Mark tasks as completed  
- Delete tasks  
- Set deadlines  
- Track overdue tasks  

## Features  
- Task Management: Add, remove, and mark tasks as completed  
- Scheduling: Set deadlines for each task  
- Overdue Tasks: Highlight tasks that are past their deadline  
- Persistent Storage: Tasks are saved and updated dynamically using JSON Server  

## Tech Stack  
- Frontend: HTML, CSS, JavaScript  
- Backend: JSON Server for data storage  

## What is JSON Server  
JSON Server is a lightweight backend that allows you to store and manage data using a simple JSON file. It creates a REST API from a JSON file and supports CRUD operations (Create, Read, Update, Delete) without setting up a real database.  

### Why use JSON Server  
- No need to set up a database  
- Provides a full REST API instantly  
- Supports GET, POST, PUT, DELETE requests  
- Perfect for prototyping and frontend testing  

## Getting Started  

### Clone the Repository  
```bash
git clone https://github.com/your-username/todo-app.git
cd todo-app
```
### Install JSON Server
### To store and manage tasks, install JSON Server globally using npm
### npm install -g json-server

### Running the Application
### Start JSON Server
### Run the following command to start the server and watch for changes in db.json

### json-server --watch db.json --port 3000

