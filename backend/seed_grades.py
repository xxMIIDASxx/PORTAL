import random
from django.contrib.auth import get_user_model
from portal.models import ReportCard, Grade

User = get_user_model()
students = User.objects.filter(role='student')

past_years = ['2023-2024', '2024-2025']
semesters = ['S1', 'S2']
subjects = ['Mathematics', 'Physics', 'Computer Science', 'Web Development', 'Databases', 'Soft Skills', 'Networking', 'Machine Learning', 'Cloud Computing']
eval_types = ['CC', 'EF', 'TP']

created_count = 0
grades_count = 0

for student in students:
    for year in past_years:
        for sem in semesters:
            # Check if report card already exists
            if ReportCard.objects.filter(student=student, academic_year=year, semester=sem).exists():
                continue
                
            # Random general average between 9.0 and 17.5
            avg = round(random.uniform(9.0, 17.5), 2)
            
            rc = ReportCard.objects.create(
                student=student,
                academic_year=year,
                semester=sem,
                general_average=avg
            )
            created_count += 1
            
            # Create 4-6 random grades for this report card
            num_grades = random.randint(4, 6)
            sampled_subjects = random.sample(subjects, num_grades)
            
            for subj in sampled_subjects:
                # Grade between 6 and 20
                grade_val = round(random.uniform(6.0, 20.0), 2)
                is_rattrapage = grade_val < 10 and random.choice([True, False])
                if is_rattrapage:
                    grade_val = round(random.uniform(10.0, 13.0), 2)
                    
                Grade.objects.create(
                    report_card=rc,
                    subject=subj,
                    evaluation_type=random.choice(eval_types),
                    value=grade_val,
                    is_rattrapage=is_rattrapage
                )
                grades_count += 1

print(f"Successfully generated {created_count} past report cards and {grades_count} grades for {students.count()} students.")
