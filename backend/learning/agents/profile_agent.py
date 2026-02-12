import os,json
from google import genai
from ..models import TSRSkillProfile

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Convert raw HR data → meaningful skill profile

class ProfileAgent:
    @staticmethod
    def build(employee):
        tsr = TSRSkillProfile.objects.filter(tsr_role=employee.tsr_role).first()
        
        prompt = f"""
        Analyze employee skills against TSR expectations.
        Return ONLY JSON.
        {{
        "strengths": [],
        "weaknesses": [],
        "summary": ""
        }}

        Skills: {employee.get_current_skills()}
        TSR: {tsr.expected_skills if tsr else "N/A"}
        Experience: {employee.experience_years}
        """

        try:
            resp = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
            )
        except Exception as e:
            error_str = str(e).lower()
            if "resource_exhausted" in error_str or "quota" in error_str or "rate" in error_str:
                print(f"Gemini API quota exceeded: {e}")
                return {"strengths": [], "weaknesses": [], "summary": "API quota exceeded. Please try again later."}
            else:
                print(f"Error generating profile: {e}")
                return {"strengths": [], "weaknesses": [], "summary": f"Error: {str(e)}"}
        
        print(f"Response object: {resp}")
        print(f"Response type: {type(resp)}")
        
        # Handle Gemini response properly
        if hasattr(resp, 'candidates') and resp.candidates:
            response_text = resp.candidates[0].content.parts[0].text
        elif hasattr(resp, 'text'):
            response_text = resp.text
        else:
            response_text = str(resp)
            
        print(f"Response text: {response_text}")
        
        if not response_text or response_text.strip() == "":
            return {"strengths": [], "weaknesses": [], "summary": "No response received"}
        
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
            return {"strengths": [], "weaknesses": [], "summary": f"Failed to parse response: {str(e)}"}