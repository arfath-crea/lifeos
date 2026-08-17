def test_ai_natural_language_expense_command(client, auth_headers):
    # Test expense natural language logging
    res = client.post("/api/v1/ai/command", json={"query": "I spent ₹340 on lunch at subway", "execute_action": True}, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["understood_intent"] == "LOG_EXPENSE"
    assert data["action_performed"]["parameters"]["category"] == "Food"
    assert data["action_performed"]["parameters"]["amount"] == 340.0

def test_ai_natural_language_reminder_command(client, auth_headers):
    # Test reminder parsing
    res = client.post("/api/v1/ai/command", json={"query": "Remind me to renew passport on September 12", "execute_action": True}, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["understood_intent"] == "CREATE_REMINDER"
    assert data["created_entity_id"] is not None

def test_ai_chat_assistant(client, auth_headers):
    res = client.post("/api/v1/ai/chat", json={
        "messages": [{"role": "user", "content": "What do I need to finish this week?"}],
        "include_context": True
    }, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["reply"]) > 10
    assert len(data["suggested_actions"]) > 0
