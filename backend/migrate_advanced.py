import sys
from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    # 1. Create all missing tables (DocumentVersion, SecurityAlert, ApiKey, WebhookSubscription, WebhookDelivery)
    db.create_all()
    print("db.create_all() executed.")

    # 2. Check and safely add new columns to existing tables
    with db.engine.connect() as conn:
        dialect = db.engine.dialect.name

        if dialect == "sqlite":
            res = conn.execute(text("PRAGMA table_info(audit_logs)")).fetchall()
            col_names = [r[1] for r in res]
            if "sequence_number" not in col_names:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN sequence_number INTEGER"))
                print("Added sequence_number to audit_logs")
            if "prev_event_hash" not in col_names:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN prev_event_hash VARCHAR(64)"))
                print("Added prev_event_hash to audit_logs")
            if "event_hash" not in col_names:
                conn.execute(text("ALTER TABLE audit_logs ADD COLUMN event_hash VARCHAR(64)"))
                print("Added event_hash to audit_logs")

            res_docs = conn.execute(text("PRAGMA table_info(documents)")).fetchall()
            doc_cols = [r[1] for r in res_docs]
            if "current_version_number" not in doc_cols:
                conn.execute(text("ALTER TABLE documents ADD COLUMN current_version_number INTEGER DEFAULT 1"))
                print("Added current_version_number to documents")
            if "scan_status" not in doc_cols:
                conn.execute(text("ALTER TABLE documents ADD COLUMN scan_status VARCHAR(32) DEFAULT 'clean'"))
                print("Added scan_status to documents")
            if "scan_result" not in doc_cols:
                conn.execute(text("ALTER TABLE documents ADD COLUMN scan_result VARCHAR(255)"))
                print("Added scan_result to documents")
            if "deleted_at" not in doc_cols:
                conn.execute(text("ALTER TABLE documents ADD COLUMN deleted_at DATETIME"))
                print("Added deleted_at to documents")
            conn.commit()
        else:
            # PostgreSQL migration
            conn.execute(text("""
                ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS sequence_number INTEGER;
                ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS prev_event_hash VARCHAR(64);
                ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS event_hash VARCHAR(64);
                ALTER TABLE documents ADD COLUMN IF NOT EXISTS current_version_number INTEGER DEFAULT 1;
                ALTER TABLE documents ADD COLUMN IF NOT EXISTS scan_status VARCHAR(32) DEFAULT 'clean';
                ALTER TABLE documents ADD COLUMN IF NOT EXISTS scan_result VARCHAR(255);
                ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITHOUT TIME ZONE;
            """))
            conn.commit()

    # 3. Retroactively backfill version 1 records for existing active documents without version snapshots
    from app.models import Document, DocumentVersion
    docs = Document.query.all()
    created_v1_count = 0
    for doc in docs:
        if not doc.versions:
            v1 = DocumentVersion(
                document_id=doc.id,
                version_number=1,
                storage_key=doc.storage_key,
                content_type=doc.content_type,
                size_bytes=doc.size_bytes,
                sha256_hash=doc.sha256_hash,
                scan_status="clean",
                scan_result="Existing document verified",
                change_summary="Initial version",
                created_by=doc.owner_id,
                created_at=doc.created_at,
            )
            db.session.add(v1)
            created_v1_count += 1
    if created_v1_count > 0:
        db.session.commit()
        print(f"Backfilled version 1 for {created_v1_count} existing documents.")

    print("Migration completed successfully.")
