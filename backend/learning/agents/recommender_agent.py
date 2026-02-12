import os,json
from google import genai
from ..models import TSRSkillProfile

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Identify gaps, Generate ordered learning path

class RecommenderAgent:
    @staticmethod
    def recommend(employee, assessment=None):
        tsr = TSRSkillProfile.objects.filter(tsr_role=employee.tsr_role).first()

        prompt = f"""
        Compare employee skills vs TSR skills.
        Treat both core and nice-to-have TSR skills as gaps if employee does not have them.
        Return ONLY JSON.
        {{
            "matched_skills": [],
            "missing_skills": [],
            "learning_path": [
            {{"title": "", "description": "", "estimated_hours": 4}}
            ]
        }}

        Skills = {employee.get_current_skills()}
        TSR = {tsr.expected_skills if tsr else "N/A"}
        Assessment = {assessment}
        """

        resp = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        # Handle Gemini response properly
        if hasattr(resp, 'candidates') and resp.candidates:
            response_text = resp.candidates[0].content.parts[0].text
        elif hasattr(resp, 'text'):
            response_text = resp.text
        else:
            response_text = str(resp)
            
        print(f"Response text: {response_text}")

        if not response_text or response_text.strip() == "":
            return {"matched_skills": [], "missing_skills": [], "learning_path": "No response received"}
        
        try:
            # Clean up markdown code blocks if present
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text.split("```")[1]
                if cleaned_text.startswith("json"):
                    cleaned_text = cleaned_text[4:]
            cleaned_text = cleaned_text.strip()
            
            return json.loads(cleaned_text)
        except json.JSONDecodeError as e:
            print(f"JSONDecodeError: {e}")
            print(f"Response text repr: {repr(response_text)}")
            return {"matched_skills": [], "missing_skills": [], "learning_path": f"Failed to parse response: {str(e)}"}
        