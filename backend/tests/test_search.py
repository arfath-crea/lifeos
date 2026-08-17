def test_universal_search(client, auth_headers):
    # Search for "Java"
    res = client.get("/api/v1/search?q=Java", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_results"] > 0
    assert "results" in data
    assert "tasks" in data["results"]
    assert "notes" in data["results"]
    assert "study_topics" in data["results"]

def test_dashboard_summary(client, auth_headers):
    res = client.get("/api/v1/dashboard", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "greeting" in data
    assert "ai_briefing" in data
    assert "metrics" in data
    assert len(data["metrics"]) >= 4
