import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'emsight_backend.settings')
django.setup()

from accounts.models import CustomUser
from django.contrib.auth import authenticate

users = CustomUser.objects.all()
for u in users:
    print(f"User: {u.username}, Email: {u.email}")
    for pwd in ['password123', 'admin123', 'owais123']:
        user = authenticate(username=u.username, password=pwd)
        if user is not None:
            print(f"  -> SUCCESS with password: {pwd}")
            break
