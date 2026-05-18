-- Phase 2b: scope todos and sertifikat to workspace_id
ALTER TABLE todos DROP COLUMN IF EXISTS batch_id;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE sertifikat ADD COLUMN IF NOT EXISTS workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE;
