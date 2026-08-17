from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.task import Task, Subtask
from app.models.event import Event
from app.models.note import NoteFolder, Note
from app.models.study import Subject, Topic, StudySession
from app.models.expense import Expense
from app.models.document import DocumentVault
from app.models.goal import Goal, Milestone
from app.models.reminder import Reminder
from app.models.notification import Notification
from app.core.security import get_password_hash

def seed_demo_user(db: Session) -> User:
    now = datetime.now(timezone.utc)
    
    # 1. Create User
    user = User(
        email="alex@lifeos.dev",
        hashed_password=get_password_hash("demo123"),
        full_name="Alex Mercer",
        currency="₹",
        theme="dark",
        monthly_budget=25000.0,
        study_daily_target_minutes=120
    )
    db.add(user)
    db.flush()
    
    # 2. Goals & Milestones
    goal1 = Goal(
        user_id=user.id,
        title="Become a Full-Stack Software Engineer",
        description="Master modern web tech, system design, and algorithms to land a top tech role.",
        category="Career",
        target_date=now + timedelta(days=120),
        status="ACTIVE",
        progress_percentage=65
    )
    db.add(goal1)
    db.flush()
    
    m1 = Milestone(goal_id=goal1.id, title="Master Python & FastAPI", is_completed=True, progress_percentage=100, order_index=0)
    m2 = Milestone(goal_id=goal1.id, title="Master React, TypeScript & Tailwind", is_completed=True, progress_percentage=100, order_index=1)
    m3 = Milestone(goal_id=goal1.id, title="Build LifeOS flagship portfolio project", is_completed=False, progress_percentage=75, order_index=2)
    m4 = Milestone(goal_id=goal1.id, title="Practice 100 LeetCode problems", is_completed=False, progress_percentage=40, order_index=3)
    m5 = Milestone(goal_id=goal1.id, title="Apply to 30 companies & interview prep", is_completed=False, progress_percentage=10, order_index=4)
    db.add_all([m1, m2, m3, m4, m5])
    db.flush()

    # 3. Tasks & Subtasks
    t1 = Task(
        user_id=user.id,
        title="Submit Distributed Systems Assignment",
        description="Complete Raft consensus simulation and write 4-page report",
        status="IN_PROGRESS",
        priority="URGENT",
        due_date=now + timedelta(days=1, hours=4),
        category="Academics",
        tags="Coursework, Urgent"
    )
    db.add(t1)
    db.flush()
    st1 = Subtask(task_id=t1.id, title="Research Raft leader election algorithm", is_completed=True)
    st2 = Subtask(task_id=t1.id, title="Write Python simulation script", is_completed=True)
    st3 = Subtask(task_id=t1.id, title="Complete experimental benchmark charts", is_completed=False)
    st4 = Subtask(task_id=t1.id, title="Format final IEEE PDF and submit to portal", is_completed=False)
    db.add_all([st1, st2, st3, st4])

    t2 = Task(
        user_id=user.id,
        title="Pay Electricity & Wi-Fi Bill",
        description="Electricity bill ₹1,420 and Airtel Xstream fiber ₹999",
        status="TODO",
        priority="HIGH",
        due_date=now + timedelta(days=2),
        category="Finance",
        tags="Bills, Monthly"
    )
    t3 = Task(
        user_id=user.id,
        title="Study Java OOP & Polymorphism",
        description="Review abstract classes vs interfaces and practice custom exception handling",
        status="TODO",
        priority="HIGH",
        due_date=now + timedelta(days=3),
        category="Academics",
        tags="Java, Study"
    )
    t4 = Task(
        user_id=user.id,
        title="Update Resume with LifeOS Full-Stack Details",
        description="Highlight FastAPI, PostgreSQL, JWT auth, AI natural language engine",
        status="TODO",
        priority="MEDIUM",
        due_date=now + timedelta(days=5),
        category="Career",
        goal_id=goal1.id,
        milestone_id=m3.id,
        tags="Resume, Portfolio"
    )
    t5 = Task(
        user_id=user.id,
        title="Buy groceries & weekly meal prep",
        status="COMPLETED",
        completed_at=now - timedelta(hours=3),
        priority="LOW",
        category="Personal"
    )
    db.add_all([t2, t3, t4, t5])

    # 4. Calendar Events
    ev1 = Event(
        user_id=user.id,
        title="Java & Data Structures End-Sem Exam",
        description="Hall 4B, 09:30 AM to 12:30 PM. Carry ID card and calculator.",
        event_type="Exam",
        start_time=now + timedelta(days=4, hours=9),
        end_time=now + timedelta(days=4, hours=12),
        location="Hall 4B - Main Block",
        color="#ef4444"
    )
    ev2 = Event(
        user_id=user.id,
        title="Doctor Dental Checkup",
        description="Routine cleaning and checkup appointment",
        event_type="Appointment",
        start_time=now + timedelta(days=2, hours=16),
        end_time=now + timedelta(days=2, hours=17),
        location="Smile Care Clinic, Indiranagar",
        color="#3b82f6"
    )
    ev3 = Event(
        user_id=user.id,
        title="Project Review with Faculty Guide",
        description="Present LifeOS architecture and live demo progress",
        event_type="Meeting",
        start_time=now + timedelta(days=6, hours=11),
        end_time=now + timedelta(days=6, hours=12),
        location="CS Dept Room 204",
        color="#8b5cf6"
    )
    db.add_all([ev1, ev2, ev3])

    # 5. Note Folders & Notes
    f_cs = NoteFolder(user_id=user.id, name="Computer Science", icon="code")
    f_career = NoteFolder(user_id=user.id, name="Career & Tech", icon="briefcase")
    f_personal = NoteFolder(user_id=user.id, name="Personal & Ideas", icon="book-open")
    db.add_all([f_cs, f_career, f_personal])
    db.flush()

    n1 = Note(
        user_id=user.id,
        folder_id=f_cs.id,
        title="Java Collections Cheat Sheet",
        content="""# Java Collections Framework Overview

## Key Interfaces:
1. **List** (Ordered, allows duplicates)
   - `ArrayList`: Resizable array, $O(1)$ random access, $O(n)$ insertion/deletion.
   - `LinkedList`: Doubly linked list, $O(1)$ add/remove at ends.

2. **Set** (No duplicates)
   - `HashSet`: Hash table backed, $O(1)$ average lookups.
   - `TreeSet`: Red-Black tree backed, sorted in $O(\log n)$.

3. **Map** (Key-Value pairs)
   - `HashMap`: Unordered, $O(1)$ average ops.
   - `ConcurrentHashMap`: Thread-safe, segment/bucket locking.
""",
        tags="Java, Collections, CheatSheet",
        is_pinned=True
    )
    n2 = Note(
        user_id=user.id,
        folder_id=f_career.id,
        title="System Design Interview Checklist",
        content="""# System Design Core Principles

- **CAP Theorem**: Consistency vs Availability vs Partition Tolerance.
- **Caching**: Redis / Memcached strategies (Cache-Aside, Write-Through).
- **Database Scaling**: Read replicas, Sharding, Connection Pooling.
- **Load Balancing**: Round Robin, Weighted, Least Connections.
""",
        tags="SystemDesign, Interview"
    )
    db.add_all([n1, n2])

    # 6. Study Subjects & Topics
    sub1 = Subject(
        user_id=user.id,
        name="Java & Object-Oriented Design",
        code="CS-204",
        color="#6366f1",
        exam_date=now + timedelta(days=4),
        target_hours=24
    )
    sub2 = Subject(
        user_id=user.id,
        name="Computer Networks",
        code="CS-301",
        color="#06b6d4",
        exam_date=now + timedelta(days=12),
        target_hours=20
    )
    db.add_all([sub1, sub2])
    db.flush()

    top1 = Topic(subject_id=sub1.id, name="OOP Core Principles & Polymorphism", mastery_percentage=85, difficulty="EASY", is_completed=False)
    top2 = Topic(subject_id=sub1.id, name="Inheritance & Abstract Classes", mastery_percentage=100, difficulty="MEDIUM", is_completed=True)
    top3 = Topic(subject_id=sub1.id, name="Interfaces & Multiple Inheritance", mastery_percentage=60, difficulty="MEDIUM", is_completed=False)
    top4 = Topic(subject_id=sub1.id, name="Collections & Generics", mastery_percentage=40, difficulty="HARD", is_completed=False)
    top5 = Topic(subject_id=sub1.id, name="Multithreading & Concurrency", mastery_percentage=25, difficulty="HARD", is_completed=False)

    top6 = Topic(subject_id=sub2.id, name="OSI & TCP/IP Layer Stack", mastery_percentage=90, difficulty="EASY", is_completed=False)
    top7 = Topic(subject_id=sub2.id, name="Routing Algorithms (Dijkstra, Bellman-Ford)", mastery_percentage=50, difficulty="HARD", is_completed=False)
    db.add_all([top1, top2, top3, top4, top5, top6, top7])

    sess1 = StudySession(user_id=user.id, subject_id=sub1.id, topic_id=top1.id, duration_minutes=50, notes="Completed polymorphism practice problems", session_type="pomodoro")
    sess2 = StudySession(user_id=user.id, subject_id=sub2.id, topic_id=top6.id, duration_minutes=30, notes="Revised subnetting and CIDR notation", session_type="revision")
    db.add_all([sess1, sess2])

    # 7. Expenses
    e1 = Expense(user_id=user.id, title="Groceries & Essentials", amount=2300.0, transaction_type="EXPENSE", category="Food", payment_method="UPI", date=now - timedelta(days=1))
    e2 = Expense(user_id=user.id, title="Monthly Metro Pass", amount=1200.0, transaction_type="EXPENSE", category="Transport", payment_method="UPI", date=now - timedelta(days=3))
    e3 = Expense(user_id=user.id, title="Computer Networks Textbook", amount=850.0, transaction_type="EXPENSE", category="Education", payment_method="Debit Card", date=now - timedelta(days=4))
    e4 = Expense(user_id=user.id, title="Weekend Cafe with friends", amount=620.0, transaction_type="EXPENSE", category="Food", payment_method="UPI", date=now - timedelta(days=2))
    e5 = Expense(user_id=user.id, title="Freelance Web Dev Stipend", amount=18000.0, transaction_type="INCOME", category="Other", payment_method="Net Banking", date=now - timedelta(days=5))
    db.add_all([e1, e2, e3, e4, e5])

    # 8. Document Vault
    d1 = DocumentVault(
        user_id=user.id,
        title="Passport",
        category="Identity",
        document_number="Z4981023",
        issue_date=datetime(2021, 3, 14, tzinfo=timezone.utc),
        expiry_date=datetime(2031, 3, 14, tzinfo=timezone.utc),
        reminder_days_before=90,
        file_name="passport_scan_verified.pdf",
        file_size=1420000,
        notes="Stored safely in physical locker #12"
    )
    d2 = DocumentVault(
        user_id=user.id,
        title="AWS Certified Developer Certificate",
        category="Academic",
        document_number="AWS-DEV-98104",
        issue_date=now - timedelta(days=600),
        expiry_date=now + timedelta(days=26),  # Expiring soon!
        reminder_days_before=30,
        file_name="aws_cert_alex_mercer.pdf",
        file_size=820000,
        notes="Schedule re-certification exam before expiry"
    )
    d3 = DocumentVault(
        user_id=user.id,
        title="Health Insurance Card",
        category="Medical",
        document_number="STAR-HLTH-881290",
        issue_date=now - timedelta(days=100),
        expiry_date=now + timedelta(days=265),
        reminder_days_before=30,
        file_name="health_card_policy.pdf",
        file_size=650000
    )
    db.add_all([d1, d2, d3])

    # 9. Reminders
    r1 = Reminder(user_id=user.id, title="Renew AWS Certification (expires in 26 days)", due_date=now + timedelta(days=26), priority="HIGH", source_module="DOCUMENT")
    r2 = Reminder(user_id=user.id, title="Pay Electricity Bill (due tomorrow)", due_date=now + timedelta(days=1), priority="HIGH", source_module="EXPENSE")
    r3 = Reminder(user_id=user.id, title="Submit Distributed Systems PDF", due_date=now + timedelta(days=1, hours=4), priority="URGENT", source_module="TASK")
    db.add_all([r1, r2, r3])

    # 10. Notifications
    notif1 = Notification(
        user_id=user.id,
        title="🔴 Urgent Assignment Due",
        message="Distributed Systems Assignment is due in less than 28 hours.",
        notification_type="ALERT",
        source_module="TASKS"
    )
    notif2 = Notification(
        user_id=user.id,
        title="📅 Upcoming Exam in 4 Days",
        message="Java & Object-Oriented Design exam is scheduled for Friday at 9:30 AM.",
        notification_type="WARNING",
        source_module="STUDY"
    )
    notif3 = Notification(
        user_id=user.id,
        title="⚠️ Document Expiring Soon",
        message="Your AWS Certified Developer Certificate expires in 26 days.",
        notification_type="WARNING",
        source_module="DOCUMENTS"
    )
    db.add_all([notif1, notif2, notif3])

    db.commit()
    db.refresh(user)
    return user
