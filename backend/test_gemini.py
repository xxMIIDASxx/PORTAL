import os
import django
import json
from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'emsight_backend.settings')
django.setup()

# Community module removed from EMSI PORTAL. This utility is retained for reference only.

cv_text = """
John Doe
Software Engineer
Experience with Python, Django, React, and Docker.
Strong communication and teamwork skills.
"""

job_requirements = """
We are looking for a software engineer with strong experience in Python and Django.
Bonus points for React and Docker experience.
Must have excellent communication skills.
"""

score, suggestions = analyze_cv(cv_text, job_requirements)
print(f"Score: {score}")
print(f"Suggestions: {suggestions}")
