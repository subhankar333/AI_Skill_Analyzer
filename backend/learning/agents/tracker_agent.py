import json
from ..models import LearningEvent

# Track learning behavior, Detect stagnation later

class TrackerAgent:
    @staticmethod
    def record(employee, event_type, metadata=None):
        return LearningEvent.objects.create(
            employee=employee,
            event_type=event_type,
            metadata=json.dumps(metadata or {})
        )