from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class NaturalLanguageRequest(BaseModel):
    query: str
    execute_action: bool = True

class ActionDetail(BaseModel):
    action_type: str  # CREATE_TASK, LOG_EXPENSE, CREATE_REMINDER, CREATE_EVENT, CREATE_NOTE, GENERATE_STUDY_PLAN, QUERY_INFO
    entity_name: str
    parameters: Dict[str, Any]
    confidence: float
    description: str

class NaturalLanguageResponse(BaseModel):
    understood_intent: str
    response_message: str
    action_performed: Optional[ActionDetail] = None
    created_entity_id: Optional[int] = None
    created_entity_type: Optional[str] = None
    created_entity_data: Optional[Dict[str, Any]] = None

class AIChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str

class AIChatRequest(BaseModel):
    messages: List[AIChatMessage]
    include_context: bool = True

class AIChatResponse(BaseModel):
    reply: str
    suggested_actions: Optional[List[str]] = []
