def test_get_tasks(client, auth_headers):
    res = client.get("/api/v1/tasks", headers=auth_headers)
    assert res.status_code == 200
    tasks = res.json()
    assert len(tasks) > 0
    assert any(t["title"] == "Submit Distributed Systems Assignment" for t in tasks)

def test_create_and_toggle_task(client, auth_headers):
    payload = {
        "title": "Prepare Resume for Google Interview",
        "description": "Include metrics and architectural achievements",
        "priority": "HIGH",
        "category": "Career",
        "subtasks": [
            {"title": "Review action verbs", "is_completed": False},
            {"title": "Export ATS-friendly PDF", "is_completed": False}
        ]
    }
    res = client.post("/api/v1/tasks", json=payload, headers=auth_headers)
    assert res.status_code == 201
    task = res.json()
    assert task["title"] == "Prepare Resume for Google Interview"
    assert len(task["subtasks"]) == 2
    task_id = task["id"]
    
    # Toggle task to completed
    toggle_res = client.post(f"/api/v1/tasks/{task_id}/toggle", headers=auth_headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["status"] == "COMPLETED"
    assert toggle_res.json()["completed_at"] is not None
