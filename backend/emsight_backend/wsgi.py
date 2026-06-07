"""
WSGI config for emsight_backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os
import sys
from pathlib import Path
from django.core.wsgi import get_wsgi_application

# 1. Define the base directory (this points to your 'backend' folder)
# __file__ is wsgi.py, parent is emsight_backend, parent.parent is backend
BASE_DIR = Path(__file__).resolve().parent.parent

# 2. Add the base directory to Python's path so Vercel can find 'emsight_backend'
if str(BASE_DIR) not in sys.path:
    sys.path.append(str(BASE_DIR))

# 3. Standard Django WSGI setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'emsight_backend.settings')

application = get_wsgi_application()

# 4. Vercel requirement: expose 'app' variable for serverless functions
app = application