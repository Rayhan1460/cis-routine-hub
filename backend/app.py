import os
import sqlite3
import logging
import secrets
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
from excel_parser import parse_excel
import uuid

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DB_FILE = os.environ.get('DATABASE_PATH', 'routines.db')
db_dir = os.path.dirname(DB_FILE)
if db_dir and not os.path.exists(db_dir):
    os.makedirs(db_dir)

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'dev-fallback-key')

# Environment-aware session cookies (Render sets 'RENDER' env var)
is_prod = os.environ.get("FLASK_ENV") == "production" or os.environ.get("RENDER") is not None
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = is_prod
app.config['SESSION_COOKIE_SAMESITE'] = 'None' if is_prod else 'Lax'

# Mail Configuration
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER')
app.config['MAIL_PORT'] = os.environ.get('MAIL_PORT')
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS') == 'True'
mail = Mail(app)

# Allow credentials from production frontend domain
frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
CORS(app, origins=[frontend_url], supports_credentials=True)

# In-memory OTP storage (In production, consider Redis or SQLite)
otp_store = {}

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS admin_config (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS routine_versions (
            id TEXT PRIMARY KEY,
            semester TEXT,
            source_file TEXT,
            uploaded_at TEXT,
            published_at TEXT,
            is_active INTEGER,
            batches_count INTEGER,
            sections_count INTEGER,
            classes_count INTEGER,
            warnings_count INTEGER,
            duplicates_removed INTEGER
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS routine_classes (
            id TEXT PRIMARY KEY,
            routine_version_id TEXT,
            batch TEXT,
            section TEXT,
            semester TEXT,
            day TEXT,
            start_time TEXT,
            end_time TEXT,
            course_code TEXT,
            course_name TEXT,
            teacher TEXT,
            room TEXT,
            FOREIGN KEY (routine_version_id) REFERENCES routine_versions (id)
        )
    ''')
    
    # Initialize admin password if not exists
    c.execute("SELECT value FROM admin_config WHERE key = 'admin_password_hash'")
    row = c.fetchone()
    if not row:
        initial_pw = os.environ.get('ADMIN_PASSWORD', 'default_strong_password')
        hashed = generate_password_hash(initial_pw)
        c.execute("INSERT INTO admin_config (key, value) VALUES (?, ?)", ('admin_password_hash', hashed))
        
    conn.commit()
    conn.close()

init_db()

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("admin_authenticated"):
            logger.warning("Unauthorized access attempt to admin API")
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "service": "CIS Routine Hub API"})

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    password = data.get('password')
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT value FROM admin_config WHERE key = 'admin_password_hash'")
    row = c.fetchone()
    conn.close()
    
    if row and check_password_hash(row[0], password):
        session["admin_authenticated"] = True
        return jsonify({"success": True})
        
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    session.clear()
    return jsonify({"success": True})

@app.route('/api/admin/session', methods=['GET'])
def check_session():
    if session.get("admin_authenticated"):
        return jsonify({"authenticated": True})
    return jsonify({"error": "Unauthorized"}), 401

@app.route('/api/admin/forgot-password', methods=['POST'])
def forgot_password():
    email = request.json.get('email')
    recovery_email = os.environ.get('ADMIN_RECOVERY_EMAIL')
    
    if email == recovery_email:
        otp = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        expiry = datetime.now() + timedelta(minutes=10)
        otp_store[email] = {'otp': otp, 'expiry': expiry, 'attempts': 0}
        
        try:
            msg = Message("Admin Password Reset OTP", sender=app.config['MAIL_USERNAME'], recipients=[email])
            msg.body = f"Your OTP is {otp}. It expires in 10 minutes."
            mail.send(msg)
            logger.info("OTP sent to recovery email.")
        except Exception as e:
            logger.error(f"Failed to send OTP email: {e}")
            
    return jsonify({"message": "If the email matches the configured recovery account, a verification code has been sent."})

@app.route('/api/admin/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email')
    otp = data.get('otp')
    new_password = data.get('new_password')
    
    record = otp_store.get(email)
    if not record:
        return jsonify({"error": "Invalid or expired OTP"}), 400
        
    if datetime.now() > record['expiry']:
        del otp_store[email]
        return jsonify({"error": "OTP expired"}), 400
        
    if record['otp'] != otp:
        record['attempts'] += 1
        if record['attempts'] >= 3:
            del otp_store[email]
            return jsonify({"error": "Too many failed attempts. Request a new OTP."}), 400
        return jsonify({"error": "Invalid OTP"}), 400
        
    # Reset successful
    hashed = generate_password_hash(new_password)
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("UPDATE admin_config SET value = ? WHERE key = 'admin_password_hash'", (hashed,))
    conn.commit()
    conn.close()
    
    del otp_store[email]
    return jsonify({"success": True})


@app.route('/api/admin/routine/process', methods=['POST'])
@require_auth
def process_routine():
    logger.info("Upload routine process started")
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400
        
    filepath = os.path.join("uploads", file.filename)
    os.makedirs("uploads", exist_ok=True)
    file.save(filepath)
    
    try:
        data = parse_excel(filepath)
        logger.info(f"Excel parsed successfully. Classes: {len(data['classes'])}")
    except Exception as e:
        logger.error(f"Failed to parse Excel file {file.filename}: {str(e)}")
        return jsonify({"error": "Unable to process the Excel file. Please try again."}), 500
        
    version_id = str(uuid.uuid4())
    semester = "Fall 2026"
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        INSERT INTO routine_versions (id, semester, source_file, uploaded_at, is_active, 
        batches_count, sections_count, classes_count, warnings_count, duplicates_removed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (version_id, semester, file.filename, datetime.now().isoformat(), 0,
          len(data['batches']), len(data['sections']), len(data['classes']), 
          len(data['warnings']), data['duplicates_removed']))
          
    for cls in data['classes']:
        c.execute('''
            INSERT INTO routine_classes (id, routine_version_id, batch, section, semester, day, start_time, end_time, course_code, course_name, teacher, room)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (str(uuid.uuid4()), version_id, cls['batch'], cls['section'], semester, cls['day'], cls['start_time'], cls['end_time'], cls['course_code'], cls['course_name'], cls['teacher'], cls['room']))
        
    conn.commit()
    conn.close()
    
    return jsonify({
        "version_id": version_id,
        "stats": {
            "batches": len(data['batches']),
            "sections": len(data['sections']),
            "classes": len(data['classes']),
            "warnings": len(data['warnings']),
            "duplicates": data['duplicates_removed']
        }
    })

@app.route('/api/admin/routine/publish', methods=['POST'])
@require_auth
def publish_routine():
    logger.info("Publish routine requested")
    data = request.json
    version_id = data.get('version_id')
    
    if not version_id:
        return jsonify({"error": "version_id is required"}), 400
        
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("UPDATE routine_versions SET is_active = 0")
    c.execute("UPDATE routine_versions SET is_active = 1, published_at = ? WHERE id = ?", 
              (datetime.now().isoformat(), version_id))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True})

@app.route('/api/routines/active', methods=['GET'])
def get_active_routine_metadata():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM routine_versions WHERE is_active = 1 LIMIT 1")
    row = c.fetchone()
    conn.close()
    
    if row:
        return jsonify(dict(row))
    return jsonify({"error": "No active routine"}), 404

@app.route('/api/routines/filter', methods=['GET'])
def filter_routines():
    batch = request.args.get('batch')
    section = request.args.get('section')
    lab_group = request.args.get('lab_group')
    
    if not batch or not section:
        return jsonify([])
        
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("SELECT id FROM routine_versions WHERE is_active = 1 LIMIT 1")
    active_ver = c.fetchone()
    if not active_ver:
        conn.close()
        return jsonify([])
        
    target_sections = [section]
    
    if lab_group and lab_group != 'All':
        target_sections.append(lab_group)
    else:
        # Find recognized lab groups dynamically based on digits suffix
        c.execute("SELECT DISTINCT section FROM routine_classes WHERE routine_version_id = ? AND batch = ?", (active_ver['id'], batch))
        all_sections = [row[0] for row in c.fetchall()]
        for sec in all_sections:
            if sec.startswith(section) and sec != section:
                suffix = sec[len(section):]
                if suffix.isdigit():
                    target_sections.append(sec)
                    
    placeholders = ','.join(['?'] * len(target_sections))
    c.execute(f'''
        SELECT id, routine_version_id, batch, section, semester, day, 
               start_time as startTime, end_time as endTime, 
               course_code as courseCode, course_name as courseName, teacher, room 
        FROM routine_classes 
        WHERE routine_version_id = ? AND batch = ? AND section IN ({placeholders})
    ''', [active_ver['id'], batch, *target_sections])
    
    rows = c.fetchall()
    conn.close()
    
    return jsonify([dict(r) for r in rows])

@app.route('/api/routines/options', methods=['GET'])
def get_options():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    
    c.execute("SELECT id FROM routine_versions WHERE is_active = 1 LIMIT 1")
    active_ver = c.fetchone()
    if not active_ver:
        conn.close()
        return jsonify({"batches": [], "sections": []})
        
    c.execute("SELECT DISTINCT batch FROM routine_classes WHERE routine_version_id = ? ORDER BY batch", (active_ver[0],))
    batches = [r[0] for r in c.fetchall()]
    c.execute("SELECT DISTINCT section FROM routine_classes WHERE routine_version_id = ? ORDER BY section", (active_ver[0],))
    sections = [r[0] for r in c.fetchall()]
    conn.close()
    
    return jsonify({"batches": batches, "sections": sections})

@app.route('/api/routines/search', methods=['GET'])
def search_routines():
    q = request.args.get('q', '').lower()
    if not q:
        return jsonify([])
        
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("SELECT id FROM routine_versions WHERE is_active = 1 LIMIT 1")
    active_ver = c.fetchone()
    if not active_ver:
        conn.close()
        return jsonify([])
        
    query = f"%{q}%"
    c.execute('''
        SELECT id, routine_version_id, batch, section, semester, day, 
               start_time as startTime, end_time as endTime, 
               course_code as courseCode, course_name as courseName, teacher, room 
        FROM routine_classes 
        WHERE routine_version_id = ? 
        AND (LOWER(course_name) LIKE ? OR LOWER(teacher) LIKE ? OR LOWER(room) LIKE ?)
    ''', (active_ver['id'], query, query, query))
    
    rows = c.fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

if __name__ == '__main__':
    app.run(port=5000, debug=True)
