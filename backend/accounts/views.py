from rest_framework import viewsets
from .models import CustomUser
from .serializers import UserSerializer
from rest_framework.decorators import action
from rest_framework.response import Response

class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer

    @action(detail=False, methods=['get'])
    def demo_users(self, request):
        students = CustomUser.objects.filter(role='student')
        teachers = CustomUser.objects.filter(role='teacher')
        admins = CustomUser.objects.filter(role='admin')
        
        return Response({
            'student': UserSerializer(students.first()).data if students.exists() else None,
            'teacher': UserSerializer(teachers.first()).data if teachers.exists() else None,
            'admin': UserSerializer(admins.first()).data if admins.exists() else None,
        })

    @action(detail=False, methods=['post'])
    def login(self, request):
        from django.contrib.auth import authenticate
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({'error': 'Please provide email and password'}, status=400)
            
        try:
            user_obj = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=401)
            
        user = authenticate(username=user_obj.username, password=password)
        if user is not None:
            return Response(UserSerializer(user).data)
        else:
            return Response({'error': 'Invalid credentials'}, status=401)

    @action(detail=False, methods=['post'])
    def create_user(self, request):
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        role = request.data.get('role', 'student')
        gender = request.data.get('gender', 'M')
        
        if not first_name or not last_name:
            return Response({'error': 'First and last name are required'}, status=400)
            
        # Generate email
        clean_first_name = first_name.lower().strip().replace(' ', '')
        clean_last_name = last_name.lower().strip().replace(' ', '')
        
        base_email = f"{clean_first_name}.{clean_last_name}"
        if role == 'admin':
            email = f"{base_email}@emsi.ma"
        elif role == 'teacher':
            email = f"{base_email}@emsi-prof.ma"
        else:
            email = f"{base_email}@emsi-edu.ma"
            
        # Ensure email is unique
        if CustomUser.objects.filter(email=email).exists():
            return Response({'error': 'User with this email already exists'}, status=400)
            
        # Generate matricule
        import uuid
        from datetime import datetime
        current_year = datetime.now().year
        
        if role == 'student':
            matricule = f"S-{current_year}{str(uuid.uuid4())[:4].upper()}"
        else:
            matricule = f"{role[0].upper()}-{str(uuid.uuid4())[:8].upper()}"
        username = f"{role}_{clean_first_name}_{clean_last_name}"
        
        user = CustomUser.objects.create_user(
            username=username,
            email=email,
            password='password123',
            first_name=first_name,
            last_name=last_name,
            role=role,
            gender=gender,
            matricule=matricule
        )
        
        # Create profile
        from .models import StudentProfile, TeacherProfile, AdminProfile
        import json
        if role == 'student':
            filiere = request.data.get('filiere', 'General')
            annee_etude = request.data.get('annee_etude', 1)
            tutor_name = request.data.get('tutor_name', None)
            StudentProfile.objects.create(user=user, filiere=filiere, annee_etude=annee_etude, numero_etudiant=matricule, tutor_name=tutor_name)
        elif role == 'teacher':
            departement = request.data.get('departement', 'General')
            matiere = request.data.get('matiere', [])
            classes = request.data.get('classes', [])
            TeacherProfile.objects.create(
                user=user,
                departement=departement,
                matiere=json.dumps(matiere) if isinstance(matiere, list) else matiere,
                classes=json.dumps(classes) if isinstance(classes, list) else classes
            )
        elif role == 'admin':
            service = request.data.get('service', 'General')
            AdminProfile.objects.create(user=user, service=service)
            
        return Response(UserSerializer(user).data, status=201)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        from django.contrib.auth import authenticate
        email = request.data.get('email')
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not email or not old_password or not new_password:
            return Response({'error': 'Please provide email, old password, and new password'}, status=400)
            
        try:
            user_obj = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
            
        user = authenticate(username=user_obj.username, password=old_password)
        if user is not None:
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password changed successfully'}, status=200)
        else:
            return Response({'error': 'Invalid old password'}, status=400)

    @action(detail=False, methods=['post'])
    def upload_profile_picture(self, request):
        email = request.data.get('email')
        profile_picture = request.FILES.get('profile_picture')
        
        if not email or not profile_picture:
            return Response({'error': 'Please provide email and profile_picture'}, status=400)
            
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
            
        user.profile_picture = profile_picture
        user.save()
        
        return Response(UserSerializer(user).data, status=200)

    @action(detail=False, methods=['post'])
    def remove_profile_picture(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({'error': 'Please provide email'}, status=400)
            
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
            
        user.profile_picture = None
        user.save()
        
        return Response(UserSerializer(user).data, status=200)

    @action(detail=True, methods=['patch'])
    def assign_modules(self, request, pk=None):
        user = self.get_object()
        if user.role != 'teacher':
            return Response({'error': 'Modules can only be assigned to teachers'}, status=400)
            
        modules = request.data.get('modules', [])
        classes = request.data.get('classes', [])
        if not isinstance(modules, list) or not isinstance(classes, list):
            return Response({'error': 'Modules and classes must be provided as lists'}, status=400)
            
        import json
        user.teacher_profile.matiere = json.dumps(modules)
        user.teacher_profile.classes = json.dumps(classes)
        user.teacher_profile.save()
        
        return Response({'message': 'Modules and classes assigned successfully', 'modules': modules, 'classes': classes}, status=200)
