# TrustVault — Production Deployment Guide

This guide details how to configure, package, deploy, and operate TrustVault in a high-availability production environment.

---

## 1. Production Architecture Overview

In production, the application separates the static frontend SPA from the backend API and database:

```
[ Internet Traffic ]
        │ (HTTPS :443)
        ▼
[ Cloudflare / AWS CloudFront / Nginx ]
   ├── Static Assets (/*) ──────────► [ Frontend Static Hosting (Vercel / Cloudflare Pages / S3) ]
   └── API Requests (/api/*) ───────► [ Gunicorn WSGI Cluster (4 Workers) ]
                                            │
                                            ├──► [ Managed PostgreSQL 16 (RDS / Cloud SQL) ]
                                            └──► [ Private S3 Bucket (AWS S3 / Cloudflare R2) ]
```

---

## 2. Production Environment Checklist

Before deploying TrustVault to production, verify each requirement:

- [ ] **Cryptographic Secret Key**: Generate with `python -c "import secrets; print(secrets.token_hex(32))"`. Never reuse development secret keys.
- [ ] **Database Connection String**: Production PostgreSQL URL with SSL mode required (`sslmode=require`).
- [ ] **Strict CORS Configuration**: Set `FRONTEND_ORIGIN` to your exact production domain (e.g. `https://vault.acme.example`). No wildcards (`*`).
- [ ] **Secure Cookies**: Ensure `SESSION_COOKIE_SECURE=true` and `SESSION_COOKIE_SAMESITE=Lax`.
- [ ] **Disable Seed Endpoint**: Set `ENVIRONMENT=production` to disable the `/api/v1/seed` and `/simulate-tamper` endpoints.
- [ ] **Private Cloud Storage**: Configure `STORAGE_PROVIDER=s3` with `AWS_STORAGE_BUCKET_NAME`. Ensure the bucket is **strictly private** with public access blocked.
- [ ] **Database Migrations**: Run Alembic migrations during continuous deployment pipelines.
- [ ] **Rate Limiting Persistence**: Configure Redis backend for `Flask-Limiter` if scaling to multiple WSGI worker instances.

---

## 3. Backend Deployment (Docker / Linux Server)

### 3.1 Production WSGI Configuration (`gunicorn`)
Install `gunicorn` in the production environment:
```bash
pip install gunicorn
```

Launch the production WSGI server with 4 worker processes:
```bash
gunicorn --workers 4 \
         --threads 2 \
         --bind 0.0.0.0:5000 \
         --access-logfile - \
         --error-logfile - \
         --timeout 60 \
         wsgi:app
```

### 3.2 Production Dockerfile Example
```dockerfile
FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY . .

ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=wsgi.py
ENV ENVIRONMENT=production

EXPOSE 5000

CMD ["gunicorn", "--workers", "4", "--threads", "2", "--bind", "0.0.0.0:5000", "wsgi:app"]
```

---

## 4. Frontend Deployment (Static Hosting)

### 4.1 Production Build
Compile TypeScript and bundle optimized assets:
```bash
cd frontend
npm ci
npm run build
```
This produces optimized HTML, CSS, and JS in `frontend/dist/`.

### 4.2 Single Page Application (SPA) Routing Rewrite
Configure the web server to rewrite all non-file requests to `/index.html`:

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name vault.example.com;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 5. Database Setup & Migrations

### 5.1 Initialize & Run Migrations
On the production server or during the release phase:
```bash
flask db upgrade
```

### 5.2 Backup and Restore Procedures

**Automated Daily Backup:**
```bash
pg_dump -Fc --no-acl --no-owner -h <db_host> -U <db_user> -d <db_name> > trustvault_backup_$(date +%Y%m%d).dump
```

**Point-in-Time Restore:**
```bash
pg_restore -h <db_host> -U <db_user> -d <db_name> --clean --if-exists trustvault_backup_20261023.dump
```

---

## 6. S3-Compatible Storage Setup

To use AWS S3, Cloudflare R2, or MinIO:

1. Create a bucket with **Block All Public Access** enabled.
2. Create an IAM User with limited least-privilege permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::your-trustvault-bucket/*"
       }
     ]
   }
   ```
3. Set environment variables:
   ```env
   STORAGE_PROVIDER=s3
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_STORAGE_BUCKET_NAME=your-trustvault-bucket
   AWS_S3_REGION_NAME=us-east-1
   ```
