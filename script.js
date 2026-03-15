const taskInput = document.getElementById("taskInput")
const dueDate = document.getElementById("dueDate")
const priority = document.getElementById("priority")
const taskList = document.getElementById("taskList")
const searchInput = document.getElementById("searchInput")

let tasks = JSON.parse(localStorage.getItem("tasks")) || []
let filter = "all"

const today = new Date().toISOString().split("T")[0]
dueDate.setAttribute("min", today)
dueDate.value = today

function save() {
    localStorage.setItem("tasks", JSON.stringify(tasks))
}

function render() {

    taskList.innerHTML = ""

    tasks.sort((a, b) => {
        return new Date(a.dueDate || "9999") - new Date(b.dueDate || "9999")
    })

    let filtered = tasks

    if (filter === "completed") {
        filtered = tasks.filter(t => t.completed)
    }

    if (filter === "pending") {
        filtered = tasks.filter(t => !t.completed)
    }

    const search = searchInput.value.toLowerCase()

    filtered = filtered.filter(t => t.title.toLowerCase().includes(search))

    filtered.forEach(task => {

        const li = document.createElement("li")
        li.draggable = true

        if (task.completed) li.classList.add("completed")

        if (task.dueDate && task.dueDate < today && !task.completed) {
            li.classList.add("overdue")
        }

        const left = document.createElement("div")

        const checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.checked = task.completed

        checkbox.onchange = () => {
            task.completed = !task.completed
            save()
            render()
        }

        const span = document.createElement("span")
        span.textContent = `${task.title} (${task.dueDate || "no date"})`
        span.classList.add(`priority-${task.priority}`)

        left.appendChild(checkbox)
        left.appendChild(span)

        const actions = document.createElement("div")
        actions.className = "actions"

        const edit = document.createElement("button")
        edit.textContent = "Edit"

        edit.onclick = () => {
            const newText = prompt("Edit task", task.title)
            if (newText) {
                task.title = newText
                save()
                render()
            }
        }

        const del = document.createElement("button")
        del.textContent = "Delete"

        del.onclick = () => {
            tasks = tasks.filter(t => t.id !== task.id)
            save()
            render()
        }

        actions.appendChild(edit)
        actions.appendChild(del)

        li.appendChild(left)
        li.appendChild(actions)

        li.addEventListener("dragstart", () => li.classList.add("dragging"))
        li.addEventListener("dragend", () => {
            li.classList.remove("dragging")
            updateOrder()
        })

        taskList.appendChild(li)

    })

    updateProgress()
    updateStats()

}

function updateProgress() {

    if (tasks.length === 0) {
        document.getElementById("progress").style.width = "0%"
        return
    }

    const done = tasks.filter(t => t.completed).length
    const percent = (done / tasks.length) * 100

    document.getElementById("progress").style.width = percent + "%"

}

function updateStats() {

    const total = tasks.length
    const completed = tasks.filter(t => t.completed).length
    const pending = tasks.filter(t => !t.completed).length

    const overdue = tasks.filter(t =>
        t.dueDate && t.dueDate < today && !t.completed
    ).length

    document.getElementById("totalTasks").textContent = total
    document.getElementById("completedTasks").textContent = completed
    document.getElementById("pendingTasks").textContent = pending
    document.getElementById("overdueTasks").textContent = overdue

}

document.getElementById("addBtn").onclick = () => {

    const text = taskInput.value.trim()

    if (!text) return

    tasks.push({
        id: Date.now(),
        title: text,
        completed: false,
        dueDate: dueDate.value,
        priority: priority.value
    })

    taskInput.value = ""

    save()
    render()

}

document.querySelectorAll(".filters button").forEach(btn => {
    btn.onclick = () => {
        filter = btn.dataset.filter
        render()
    }
})

searchInput.oninput = render

document.getElementById("darkToggle").onclick = () => {
    document.body.classList.toggle("dark")

    localStorage.setItem(
        "theme",
        document.body.classList.contains("dark") ? "dark" : "light"
    )
}

if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark")
}

taskList.addEventListener("dragover", e => {
    e.preventDefault()

    const dragging = document.querySelector(".dragging")
    const after = getDragAfter(e.clientY)

    if (after == null) {
        taskList.appendChild(dragging)
    } else {
        taskList.insertBefore(dragging, after)
    }
})

function getDragAfter(y) {

    const elements = [...taskList.querySelectorAll("li:not(.dragging)")]

    return elements.reduce((closest, child) => {

        const box = child.getBoundingClientRect()
        const offset = y - box.top - box.height / 2

        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child }
        } else {
            return closest
        }

    }, { offset: Number.NEGATIVE_INFINITY }).element

}

function updateOrder() {

    const items = [...taskList.children]

    tasks = items.map(item => {
        const text = item.querySelector("span").textContent.split("(")[0].trim()
        return tasks.find(t => t.title === text)
    })

    save()

}

function exportTasks() {

    const data = JSON.stringify(tasks)

    const blob = new Blob([data], { type: "application/json" })

    const a = document.createElement("a")

    a.href = URL.createObjectURL(blob)
    a.download = "tasks.json"

    a.click()

}

render()