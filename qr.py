from flask import Flask, request, jsonify
from flask_cors import CORS
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from datetime import datetime
from flasgger import Swagger

app = Flask(__name__)
CORS(app)

# Swagger config
swagger = Swagger(app)

# Google Sheets Setup
SCOPE = [
    'https://spreadsheets.google.com/feeds',
    'https://www.googleapis.com/auth/drive'
]

SPREADSHEET_ID = '1obO1W6o3hPzcjcISFmGVQDBYv9V_PCxcPsCUx8NAePY'


# ===================== SHEETS HELPERS =====================

def get_sheets_client():
    creds = ServiceAccountCredentials.from_json_keyfile_name('credentials.json', SCOPE)
    return gspread.authorize(creds)


def get_worksheet(sheet_name):
    client = get_sheets_client()
    spreadsheet = client.open_by_key(SPREADSHEET_ID)
    return spreadsheet.worksheet(sheet_name)


# ===================== VALIDATION DATA =====================

def get_valid_enrollments():
    try:
        worksheet = get_worksheet('ValidEnrollments')
        enrollments = worksheet.col_values(1)[1:]
        return [e.strip() for e in enrollments if e.strip()]
    except:
        return []


def get_valid_codes():
    try:
        worksheet = get_worksheet('ValidCodes')
        codes = worksheet.col_values(1)[1:]
        return [c.strip() for c in codes if c.strip()]
    except:
        return []


# ===================== MULTIPLIER LOGIC =====================

def get_code_multiplier(secret_code):
    """
    Returns multiplier for a QR code from CodeMultipliers sheet
    Default = 1 if not found
    """
    try:
        worksheet = get_worksheet('CodeMultipliers')
        records = worksheet.get_all_records()

        for r in records:
            if str(r.get('SecretCode', '')).strip() == secret_code:
                return int(r.get('Multiplier', 1))

        return 1
    except:
        return 1


# ===================== CLAIM CHECKS =====================

def is_code_claimed(secret_code):
    try:
        worksheet = get_worksheet('ClaimTimestamps')
        codes = worksheet.col_values(1)[1:]
        return secret_code in codes
    except:
        return False


def get_student_claims(enrollment_no):
    try:
        worksheet = get_worksheet('StudentClaims')
        all_records = worksheet.get_all_records()
        return [
            record for record in all_records
            if str(record.get('EnrollmentNo', '')).strip() == enrollment_no
        ]
    except:
        return []


# ===================== ADD CLAIM =====================

def add_claim(enrollment_no, secret_code):
    """
    Adds claim AND stores multiplier at time of claim
    """
    try:
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        multiplier = get_code_multiplier(secret_code)

        # StudentClaims: EnrollmentNo | SecretCode | Timestamp | Multiplier
        claims_sheet = get_worksheet('StudentClaims')
        claims_sheet.append_row([enrollment_no, secret_code, timestamp, multiplier])

        # ClaimTimestamps: SecretCode | EnrollmentNo | Timestamp
        timestamps_sheet = get_worksheet('ClaimTimestamps')
        timestamps_sheet.append_row([secret_code, enrollment_no, timestamp])

        return True
    except:
        return False


# ===================== SCORE CALCULATION =====================

def get_student_score(enrollment_no):
    claims = get_student_claims(enrollment_no)
    total = 0

    for c in claims:
        total += int(c.get('Multiplier', 1))

    return total


# ===================== API ROUTES =====================

@app.route('/api/submit', methods=['POST'])
def submit_code():
    data = request.get_json()

    enrollment_no = str(data.get('enrollment_no', '')).strip()
    secret_code = str(data.get('secret_code', '')).strip()

    if not enrollment_no or not secret_code:
        return jsonify({'success': False, 'message': 'Missing data'}), 400

    if enrollment_no not in get_valid_enrollments():
        return jsonify({'success': False, 'message': 'Invalid enrollment'}), 400

    if secret_code not in get_valid_codes():
        return jsonify({'success': False, 'message': 'Invalid code'}), 400

    if is_code_claimed(secret_code):
        return jsonify({'success': False, 'message': 'Already claimed'}), 400

    if add_claim(enrollment_no, secret_code):
        score = get_student_score(enrollment_no)
        return jsonify({'success': True, 'score': score})

    return jsonify({'success': False}), 500


# ===================== LEADERBOARD =====================

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    worksheet = get_worksheet('StudentClaims')
    records = worksheet.get_all_records()

    scores = {}

    for r in records:
        e = r.get('EnrollmentNo')
        multiplier = int(r.get('Multiplier', 1))

        scores[e] = scores.get(e, 0) + multiplier

    leaderboard = sorted(
        [{'enrollment_no': k, 'score': v} for k, v in scores.items()],
        key=lambda x: x['score'],
        reverse=True
    )

    return jsonify({'leaderboard': leaderboard})


# ===================== STUDENT INFO =====================

@app.route('/api/student/<enrollment_no>', methods=['GET'])
def get_student_info(enrollment_no):
    claims = get_student_claims(enrollment_no)
    score = get_student_score(enrollment_no)

    return jsonify({
        'enrollment_no': enrollment_no,
        'score': score,
        'claims': claims
    })


# ===================== HEALTH =====================

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})


# ===================== RUN =====================

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
