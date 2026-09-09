# FollowApp — Care That Continues

A continuity-of-care platform connecting patients, clinicians, and healthcare organisations after a consultation — ensuring follow-ups, treatment plans, investigations, referrals, and ongoing monitoring don't get lost.

> The consultation is not the end of care. It's the beginning of the follow-up journey.

## Status

🚧 MVP in development — FastAPI backend foundation.

## Stack

- **Backend:** FastAPI + PostgreSQL
- **Frontend:** React (planned)
- **Messaging:** WhatsApp Business API (planned)
- **Automation:** n8n (planned)
- **Hosting:** Render

## Local development

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

## Roadmap

- [x] FastAPI backend foundation + health endpoint
- [ ] PostgreSQL database integration
- [ ] Patient / clinician / admin data models
- [ ] Follow-up engine (care plans, task tracking)
- [ ] Authentication
- [ ] React frontend
- [ ] WhatsApp Business API integration
