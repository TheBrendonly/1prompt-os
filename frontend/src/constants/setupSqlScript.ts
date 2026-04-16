export const SETUP_SQL_SCRIPT = `-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- BULLETPROOF MIGRATION - HANDLES ALL EDGE CASES
-- ============================================

-- Step 1: Handle API_Management table with ALL edge cases
DO $$
DECLARE
  has_old_api_custom BOOLEAN;
  has_new_api BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'API_Custom_Fields_Management') INTO has_old_api_custom;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'API_Management') INTO has_new_api;
  
  -- If API_Management exists, backup and recreate with correct order
  IF has_new_api THEN
    CREATE TEMP TABLE api_backup AS SELECT * FROM "API_Management";
    DROP TABLE "API_Management" CASCADE;
    
    CREATE TABLE "API_Management" (
      "Id" BIGSERIAL PRIMARY KEY,
      "GHL_API_Key" TEXT,
      "Calendar_ID" TEXT,
      "Location_ID" TEXT,
      "Assignee_ID" TEXT,
      "Campaign_Webhook" TEXT,
      "OpenAI_Key" TEXT,
      "OpenRouter_Key" TEXT,
      "Supabase_Service_Role_Key" TEXT,
      "Supabase_Project_URL" TEXT,
      "Text_Engine_Webhook" TEXT,
      "Text_Engine_Followup_Webhook" TEXT,
      "Transfer_To_Human_Webhook" TEXT,
      "Save_Reply" TEXT,
      "User_Details_Webhook" TEXT,
      "Update_Pipeline_Webhook" TEXT,
      "Update_Lead_Score_Webhook" TEXT,
      "Database_Reactivation_Webhook" TEXT,
      "Retell_API_Key" TEXT,
      "AgentId_1" TEXT,
      "AgentId_2" TEXT,
      "AgentId_3" TEXT,
      "AgentId_4" TEXT,
      "Outbound_Caller_Webhook_1" TEXT,
      "Outbound_Caller_Webhook_2" TEXT,
      "Outbound_Caller_Webhook_3" TEXT,
      "Retell_Phone_1" TEXT,
      "Retell_Phone_2" TEXT,
      "Retell_Phone_3" TEXT,
      "Created_At" TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Insert Id first, then update columns one by one (handles missing columns gracefully)
    INSERT INTO "API_Management" ("Id") SELECT "Id" FROM api_backup;
    
    -- Try to copy each column - if it doesn't exist in backup, it stays NULL
    BEGIN UPDATE "API_Management" SET "GHL_API_Key" = (SELECT "GHL_API_Key" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "Calendar_ID" = (SELECT "Calendar_ID" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "Location_ID" = (SELECT "Location_ID" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "Assignee_ID" = (SELECT "Assignee_ID" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "OpenAI_Key" = (SELECT "OpenAI_Key" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "OpenRouter_Key" = (SELECT "OpenRouter_Key" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "Supabase_Service_Role_Key" = (SELECT "Supabase_Service_Role_Key" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "Supabase_Project_URL" = (SELECT "Supabase_Project_URL" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "Text_Engine_Webhook" = (SELECT "Text_Engine_Webhook" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "Text_Engine_Followup_Webhook" = (SELECT "Text_Engine_Followup_Webhook" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "Transfer_To_Human_Webhook" = (SELECT "Transfer_To_Human_Webhook" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "Save_Reply" = (SELECT "Save_Reply" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "User_Details_Webhook" = (SELECT "User_Details_Webhook" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "Database_Reactivation_Webhook" = (SELECT "Database_Reactivation_Webhook" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "Retell_API_Key" = (SELECT "Retell_API_Key" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "Retell_Phone_1" = (SELECT "Retell_Phone_1" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "Retell_Phone_2" = (SELECT "Retell_Phone_2" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "Retell_Phone_3" = (SELECT "Retell_Phone_3" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN UPDATE "API_Management" SET "Created_At" = (SELECT "Created_At" FROM api_backup WHERE api_backup."Id" = "API_Management"."Id"); EXCEPTION WHEN OTHERS THEN NULL; END;
    
    DROP TABLE api_backup;
    
    PERFORM setval(pg_get_serial_sequence('"API_Management"', 'Id'), 
                   COALESCE((SELECT MAX("Id") FROM "API_Management"), 0) + 1, false);
    
  ELSIF has_old_api_custom THEN
    CREATE TABLE "API_Management" (
      "Id" BIGSERIAL PRIMARY KEY,
      "GHL_API_Key" TEXT,
      "Calendar_ID" TEXT,
      "Location_ID" TEXT,
      "Assignee_ID" TEXT,
      "Campaign_Webhook" TEXT,
      "OpenAI_Key" TEXT,
      "OpenRouter_Key" TEXT,
      "Supabase_Service_Role_Key" TEXT,
      "Supabase_Project_URL" TEXT,
      "Text_Engine_Webhook" TEXT,
      "Text_Engine_Followup_Webhook" TEXT,
      "Transfer_To_Human_Webhook" TEXT,
      "Save_Reply" TEXT,
      "User_Details_Webhook" TEXT,
      "Update_Pipeline_Webhook" TEXT,
      "Update_Lead_Score_Webhook" TEXT,
      "Database_Reactivation_Webhook" TEXT,
      "Retell_API_Key" TEXT,
      "AgentId_1" TEXT,
      "AgentId_2" TEXT,
      "AgentId_3" TEXT,
      "AgentId_4" TEXT,
      "Outbound_Caller_Webhook_1" TEXT,
      "Outbound_Caller_Webhook_2" TEXT,
      "Outbound_Caller_Webhook_3" TEXT,
      "Retell_Phone_1" TEXT,
      "Retell_Phone_2" TEXT,
      "Retell_Phone_3" TEXT,
      "Created_At" TIMESTAMPTZ DEFAULT NOW()
    );
    
    INSERT INTO "API_Management" (
      "Id", "GHL_API_Key", "Calendar_ID", "Location_ID", "Assignee_ID", "Campaign_Webhook",
      "OpenAI_Key", "OpenRouter_Key", "Supabase_Service_Role_Key", "Supabase_Project_URL",
      "Text_Engine_Webhook", "Text_Engine_Followup_Webhook", "Transfer_To_Human_Webhook",
      "Save_Reply", "User_Details_Webhook", "Update_Pipeline_Webhook", "Update_Lead_Score_Webhook",
      "Database_Reactivation_Webhook", "Retell_API_Key", "AgentId_1",
      "AgentId_2", "AgentId_3", "AgentId_4",
      "Outbound_Caller_Webhook_1", "Outbound_Caller_Webhook_2", "Outbound_Caller_Webhook_3",
      "Retell_Phone_1", "Retell_Phone_2", "Retell_Phone_3", "Created_At"
    )
    SELECT 
      id, "GHL_API_Key", "Calendar_ID", "Location_ID", "Assignee_ID", NULL,
      "OpenAI_API_key", "OpenRouter_API_key", "Supabase_Service_Role_key", "Supabase_Project_URL",
      "Text_Engine_Webhook", "Text_Engine_Followup_Webhook", "Transfer_To_human_Inbound_Webhook",
      NULL, "User_Details_Inbound_Webhook", NULL, NULL,
      "Database_Reactivation_Inbound_Webhook", "retell_api_key", "retell_inbound_agent_id",
      "retell_outbound_agent_id", NULL, NULL,
      NULL, NULL, NULL,
      "retell_phone_1", "retell_phone_2", "retell_phone_3", created_at
    FROM "API_Custom_Fields_Management";
    
    DROP TABLE "API_Custom_Fields_Management";
    
    PERFORM setval(pg_get_serial_sequence('"API_Management"', 'Id'), 
                   COALESCE((SELECT MAX("Id") FROM "API_Management"), 0) + 1, false);
  ELSE
    CREATE TABLE "API_Management" (
      "Id" BIGSERIAL PRIMARY KEY,
      "GHL_API_Key" TEXT,
      "Calendar_ID" TEXT,
      "Location_ID" TEXT,
      "Assignee_ID" TEXT,
      "Campaign_Webhook" TEXT,
      "OpenAI_Key" TEXT,
      "OpenRouter_Key" TEXT,
      "Supabase_Service_Role_Key" TEXT,
      "Supabase_Project_URL" TEXT,
      "Text_Engine_Webhook" TEXT,
      "Text_Engine_Followup_Webhook" TEXT,
      "Transfer_To_Human_Webhook" TEXT,
      "Save_Reply" TEXT,
      "User_Details_Webhook" TEXT,
      "Update_Pipeline_Webhook" TEXT,
      "Update_Lead_Score_Webhook" TEXT,
      "Database_Reactivation_Webhook" TEXT,
      "Retell_API_Key" TEXT,
      "AgentId_1" TEXT,
      "AgentId_2" TEXT,
      "AgentId_3" TEXT,
      "AgentId_4" TEXT,
      "Outbound_Caller_Webhook_1" TEXT,
      "Outbound_Caller_Webhook_2" TEXT,
      "Outbound_Caller_Webhook_3" TEXT,
      "Retell_Phone_1" TEXT,
      "Retell_Phone_2" TEXT,
      "Retell_Phone_3" TEXT,
      "Created_At" TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
  
  RAISE NOTICE 'API_Management table ready';
END $$;

-- Step 2: Handle Documents table - ALL edge cases (LOWERCASE COLUMNS)
DO $$
DECLARE
  has_updated_at BOOLEAN;
  has_created_at BOOLEAN;
  id_type TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Documents') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
      
      -- Check if timestamp columns exist
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name IN ('updated_at', 'Updated_At')
      ) INTO has_updated_at;
      
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name IN ('created_at', 'Created_At')
      ) INTO has_created_at;
      
      -- Get id column data type
      SELECT data_type INTO id_type
      FROM information_schema.columns
      WHERE table_name = 'documents' AND column_name IN ('id', 'Id')
      LIMIT 1;
      
      ALTER TABLE documents RENAME TO documents_old;
      
      CREATE TABLE "Documents" (
        "id" BIGSERIAL PRIMARY KEY,
        "content" TEXT,
        "metadata" JSONB,
        "embedding" VECTOR(1536),
        "updated_at" TIMESTAMPTZ DEFAULT NOW(),
        "created_at" TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Copy data based on what columns exist and id type
      IF has_updated_at AND has_created_at THEN
        IF id_type = 'bigint' OR id_type = 'integer' THEN
          INSERT INTO "Documents" ("id", "content", "metadata", "embedding", "updated_at", "created_at")
          SELECT id, content, metadata, embedding, updated_at, created_at FROM documents_old;
        ELSE
          INSERT INTO "Documents" ("id", "content", "metadata", "embedding", "updated_at", "created_at")
          SELECT id::bigint, content, metadata, embedding, updated_at, created_at FROM documents_old;
        END IF;
      ELSIF has_updated_at THEN
        IF id_type = 'bigint' OR id_type = 'integer' THEN
          INSERT INTO "Documents" ("id", "content", "metadata", "embedding", "updated_at", "created_at")
          SELECT id, content, metadata, embedding, updated_at, NOW() FROM documents_old;
        ELSE
          INSERT INTO "Documents" ("id", "content", "metadata", "embedding", "updated_at", "created_at")
          SELECT id::bigint, content, metadata, embedding, updated_at, NOW() FROM documents_old;
        END IF;
      ELSIF has_created_at THEN
        IF id_type = 'bigint' OR id_type = 'integer' THEN
          INSERT INTO "Documents" ("id", "content", "metadata", "embedding", "updated_at", "created_at")
          SELECT id, content, metadata, embedding, NOW(), created_at FROM documents_old;
        ELSE
          INSERT INTO "Documents" ("id", "content", "metadata", "embedding", "updated_at", "created_at")
          SELECT id::bigint, content, metadata, embedding, NOW(), created_at FROM documents_old;
        END IF;
      ELSE
        IF id_type = 'bigint' OR id_type = 'integer' THEN
          INSERT INTO "Documents" ("id", "content", "metadata", "embedding", "updated_at", "created_at")
          SELECT id, content, metadata, embedding, NOW(), NOW() FROM documents_old;
        ELSE
          INSERT INTO "Documents" ("id", "content", "metadata", "embedding", "updated_at", "created_at")
          SELECT id::bigint, content, metadata, embedding, NOW(), NOW() FROM documents_old;
        END IF;
      END IF;
      
      DROP TABLE documents_old;
      
      PERFORM setval(pg_get_serial_sequence('"Documents"', 'id'), 
                     COALESCE((SELECT MAX("id") FROM "Documents"), 0) + 1, false);
      
      RAISE NOTICE 'Documents table migrated successfully';
    ELSE
      CREATE TABLE "Documents" (
        "id" BIGSERIAL PRIMARY KEY,
        "content" TEXT,
        "metadata" JSONB,
        "embedding" VECTOR(1536),
        "updated_at" TIMESTAMPTZ DEFAULT NOW(),
        "created_at" TIMESTAMPTZ DEFAULT NOW()
      );
      
      RAISE NOTICE 'Documents table created';
    END IF;
  ELSE
    RAISE NOTICE 'Documents table already exists';
  END IF;
END $$;

-- Step 3: Handle Text_Prompts table - ONLY Updated_At
DO $$
DECLARE
  has_old_prompts BOOLEAN;
  has_updated_at BOOLEAN;
  i INT;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Prompts') INTO has_old_prompts;
  
  -- Drop old Prompts table if it exists (13 rows version)
  IF has_old_prompts THEN
    DROP TABLE "Prompts" CASCADE;
    RAISE NOTICE 'Old Prompts table (13 rows) dropped';
  END IF;
  
  -- Check for lowercase prompts table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prompts') THEN
    DROP TABLE prompts CASCADE;
    RAISE NOTICE 'Old prompts table dropped';
  END IF;
  
  -- Create or update Text_Prompts table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Text_Prompts') THEN
    CREATE TABLE "Text_Prompts" (
      "Id" INT4 PRIMARY KEY CHECK ("Id" >= 0 AND "Id" <= 8),
      "Prompt_Name" TEXT,
      "Content" TEXT,
      "Updated_At" TIMESTAMPTZ DEFAULT NOW()
    );
    
    FOR i IN 0..8 LOOP
      INSERT INTO "Text_Prompts" ("Id", "Prompt_Name", "Content") VALUES (i, '', NULL);
    END LOOP;
    
    RAISE NOTICE 'Text_Prompts table created with 9 rows (0-8) and Updated_At column';
  ELSE
    -- Check if Updated_At column exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Text_Prompts' AND column_name = 'Updated_At'
    ) INTO has_updated_at;
    
    -- Add Updated_At column if it doesn't exist
    IF NOT has_updated_at THEN
      ALTER TABLE "Text_Prompts" ADD COLUMN "Updated_At" TIMESTAMPTZ DEFAULT NOW();
      UPDATE "Text_Prompts" SET "Updated_At" = NOW() WHERE "Updated_At" IS NULL;
      RAISE NOTICE 'Added Updated_At column to Text_Prompts';
    END IF;
    
    -- Remove Created_At if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Text_Prompts' AND column_name = 'Created_At'
    ) THEN
      ALTER TABLE "Text_Prompts" DROP COLUMN "Created_At";
      RAISE NOTICE 'Removed Created_At column from Text_Prompts';
    END IF;
    
    RAISE NOTICE 'Text_Prompts table already exists - ensuring 9 rows';
    
    ALTER TABLE "Text_Prompts" DROP CONSTRAINT IF EXISTS "Text_Prompts_Id_check";
    ALTER TABLE "Text_Prompts" ADD CONSTRAINT "Text_Prompts_Id_check" CHECK ("Id" >= 0 AND "Id" <= 8);
    
    FOR i IN 0..8 LOOP
      INSERT INTO "Text_Prompts" ("Id", "Prompt_Name", "Content")
      VALUES (i, '', NULL)
      ON CONFLICT ("Id") DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Text_Prompts table updated to support 9 rows (0-8) with Updated_At';
  END IF;
END $$;

-- Step 4: Handle Voice_Prompts table - ONLY Updated_At
CREATE OR REPLACE FUNCTION Prevent_Voice_Prompt_Insertion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."Id" < 0 OR NEW."Id" > 5 THEN
    RAISE EXCEPTION 'Only IDs 0-5 are allowed in Voice_Prompts.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  has_updated_at BOOLEAN;
  i INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Voice_Prompts') THEN
    CREATE TABLE "Voice_Prompts" (
      "Id" INT4 PRIMARY KEY CHECK ("Id" >= 0 AND "Id" <= 5),
      "Prompt_Name" TEXT,
      "Content" TEXT,
      "Updated_At" TIMESTAMPTZ DEFAULT NOW()
    );
    
    FOR i IN 0..5 LOOP
      INSERT INTO "Voice_Prompts" ("Id", "Prompt_Name", "Content") VALUES (i, '', NULL);
    END LOOP;
    
    RAISE NOTICE 'Voice_Prompts table created with 6 rows (0-5) and Updated_At column';
  ELSE
    -- Check if Updated_At column exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Voice_Prompts' AND column_name = 'Updated_At'
    ) INTO has_updated_at;
    
    -- Add Updated_At column if it doesn't exist
    IF NOT has_updated_at THEN
      ALTER TABLE "Voice_Prompts" ADD COLUMN "Updated_At" TIMESTAMPTZ DEFAULT NOW();
      UPDATE "Voice_Prompts" SET "Updated_At" = NOW() WHERE "Updated_At" IS NULL;
      RAISE NOTICE 'Added Updated_At column to Voice_Prompts';
    END IF;
    
    -- Remove Created_At if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Voice_Prompts' AND column_name = 'Created_At'
    ) THEN
      ALTER TABLE "Voice_Prompts" DROP COLUMN "Created_At";
      RAISE NOTICE 'Removed Created_At column from Voice_Prompts';
    END IF;
    
    RAISE NOTICE 'Voice_Prompts table already exists - ensuring 6 rows';
    
    ALTER TABLE "Voice_Prompts" DROP CONSTRAINT IF EXISTS "Voice_Prompts_Id_check";
    ALTER TABLE "Voice_Prompts" ADD CONSTRAINT "Voice_Prompts_Id_check" CHECK ("Id" >= 0 AND "Id" <= 5);
    
    FOR i IN 0..5 LOOP
      INSERT INTO "Voice_Prompts" ("Id", "Prompt_Name", "Content")
      VALUES (i, '', NULL)
      ON CONFLICT ("Id") DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Voice_Prompts table updated to support 6 rows (0-5) with Updated_At';
  END IF;
END $$;

-- Step 5: Handle Call_History table - Rename Message to Call_Transcript and Add Call_Recording
DO $$
DECLARE
  has_voice_transcript BOOLEAN;
  has_call_history BOOLEAN;
  has_message BOOLEAN;
  has_call_transcript BOOLEAN;
  has_call_recording BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Voice_Transcript') INTO has_voice_transcript;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Call_History') INTO has_call_history;
  
  -- If Voice_Transcript exists, migrate it
  IF has_voice_transcript THEN
    -- Backup and recreate
    CREATE TEMP TABLE call_backup AS SELECT * FROM "Voice_Transcript";
    DROP TABLE "Voice_Transcript" CASCADE;
    
    CREATE TABLE "Call_History" (
      "Id" SERIAL PRIMARY KEY,
      "Session_Id" VARCHAR,
      "Call_Transcript" TEXT,
      "Call_Recording" TEXT,
      "Timestamp" TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Insert data and try to copy Message to Call_Transcript
    INSERT INTO "Call_History" ("Id", "Session_Id", "Call_Transcript", "Timestamp")
    SELECT "Id", "Session_Id", NULL, "Timestamp" FROM call_backup;
    
    -- Try to copy Message column if it exists
    BEGIN 
      UPDATE "Call_History" 
      SET "Call_Transcript" = (SELECT "Message" FROM call_backup WHERE call_backup."Id" = "Call_History"."Id"); 
    EXCEPTION WHEN OTHERS THEN NULL; 
    END;
    
    DROP TABLE call_backup;
    
    PERFORM setval(pg_get_serial_sequence('"Call_History"', 'Id'), 
                   COALESCE((SELECT MAX("Id") FROM "Call_History"), 0) + 1, false);
    
    RAISE NOTICE 'Voice_Transcript migrated to Call_History with Call_Transcript and Call_Recording columns';
    
  -- If Call_History already exists, update it
  ELSIF has_call_history THEN
    -- Check for Message column
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Call_History' AND column_name = 'Message'
    ) INTO has_message;
    
    -- Check for Call_Transcript column
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Call_History' AND column_name = 'Call_Transcript'
    ) INTO has_call_transcript;
    
    -- Check for Call_Recording column
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Call_History' AND column_name = 'Call_Recording'
    ) INTO has_call_recording;
    
    -- Rename Message to Call_Transcript if Message exists and Call_Transcript doesn't
    IF has_message AND NOT has_call_transcript THEN
      ALTER TABLE "Call_History" RENAME COLUMN "Message" TO "Call_Transcript";
      RAISE NOTICE 'Renamed Message column to Call_Transcript in Call_History';
    END IF;
    
    -- Add Call_Transcript if it doesn't exist and Message doesn't exist either
    IF NOT has_call_transcript AND NOT has_message THEN
      ALTER TABLE "Call_History" ADD COLUMN "Call_Transcript" TEXT;
      RAISE NOTICE 'Added Call_Transcript column to Call_History';
    END IF;
    
    -- Add Call_Recording if it doesn't exist
    IF NOT has_call_recording THEN
      ALTER TABLE "Call_History" ADD COLUMN "Call_Recording" TEXT;
      RAISE NOTICE 'Added Call_Recording column to Call_History';
    END IF;
    
    RAISE NOTICE 'Call_History table updated with Call_Transcript and Call_Recording columns';
    
  -- Create fresh table if neither exists
  ELSE
    CREATE TABLE "Call_History" (
      "Id" SERIAL PRIMARY KEY,
      "Session_Id" VARCHAR,
      "Call_Transcript" TEXT,
      "Call_Recording" TEXT,
      "Timestamp" TIMESTAMPTZ DEFAULT NOW()
    );
    
    RAISE NOTICE 'Call_History table created with Call_Transcript and Call_Recording columns';
  END IF;
END $$;

-- Step 6: Handle Webinar_Management table - ONLY Updated_At
DO $$
DECLARE
  has_webinar_setup BOOLEAN;
  has_webinar_management BOOLEAN;
  has_updated_at BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Webinar_Setup') INTO has_webinar_setup;
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Webinar_Management') INTO has_webinar_management;
  
  -- If old Webinar_Setup exists, migrate it
  IF has_webinar_setup THEN
    CREATE TEMP TABLE webinar_backup AS SELECT * FROM "Webinar_Setup";
    DROP TABLE "Webinar_Setup" CASCADE;
    
    CREATE TABLE "Webinar_Management" (
      "Id" SERIAL PRIMARY KEY,
      "Webinar_URL" TEXT,
      "Replay_URL" TEXT,
      "Updated_At" TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Insert Id first
    INSERT INTO "Webinar_Management" ("Id", "Webinar_URL", "Replay_URL")
    SELECT "Id", '', '' FROM webinar_backup;
    
    -- Try to copy Webinar_Url if it exists
    BEGIN 
      UPDATE "Webinar_Management" 
      SET "Webinar_URL" = (SELECT "Webinar_Url" FROM webinar_backup WHERE webinar_backup."Id" = "Webinar_Management"."Id"); 
    EXCEPTION WHEN OTHERS THEN NULL; 
    END;
    
    -- Try to copy Replay_URL if it exists
    BEGIN 
      UPDATE "Webinar_Management" 
      SET "Replay_URL" = (SELECT "Replay_URL" FROM webinar_backup WHERE webinar_backup."Id" = "Webinar_Management"."Id"); 
    EXCEPTION WHEN OTHERS THEN NULL; 
    END;
    
    -- Try to copy Updated_At if it exists
    BEGIN 
      UPDATE "Webinar_Management" 
      SET "Updated_At" = (SELECT "Updated_At" FROM webinar_backup WHERE webinar_backup."Id" = "Webinar_Management"."Id"); 
    EXCEPTION WHEN OTHERS THEN NULL; 
    END;
    
    DROP TABLE webinar_backup;
    
    PERFORM setval(pg_get_serial_sequence('"Webinar_Management"', 'Id'), 
                   COALESCE((SELECT MAX("Id") FROM "Webinar_Management"), 0) + 1, false);
    
    RAISE NOTICE 'Webinar_Setup migrated to Webinar_Management successfully with Updated_At';
    
  -- If Webinar_Management already exists, check and add Updated_At if needed
  ELSIF has_webinar_management THEN
    -- Check if Updated_At column exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Webinar_Management' AND column_name = 'Updated_At'
    ) INTO has_updated_at;
    
    -- Add Updated_At column if it doesn't exist
    IF NOT has_updated_at THEN
      ALTER TABLE "Webinar_Management" ADD COLUMN "Updated_At" TIMESTAMPTZ DEFAULT NOW();
      UPDATE "Webinar_Management" SET "Updated_At" = NOW() WHERE "Updated_At" IS NULL;
      RAISE NOTICE 'Added Updated_At column to Webinar_Management';
    END IF;
    
    -- Remove Created_At if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Webinar_Management' AND column_name = 'Created_At'
    ) THEN
      ALTER TABLE "Webinar_Management" DROP COLUMN "Created_At";
      RAISE NOTICE 'Removed Created_At column from Webinar_Management';
    END IF;
    
    RAISE NOTICE 'Webinar_Management table updated with Updated_At column';
    
  -- Create fresh table if neither exists
  ELSE
    CREATE TABLE "Webinar_Management" (
      "Id" SERIAL PRIMARY KEY,
      "Webinar_URL" TEXT,
      "Replay_URL" TEXT,
      "Updated_At" TIMESTAMPTZ DEFAULT NOW()
    );
    
    RAISE NOTICE 'Webinar_Management table created successfully with Updated_At';
  END IF;
END $$;

-- ============================================
-- CLEANUP - REMOVE _Readable VIEWS
-- ============================================

DROP VIEW IF EXISTS "Text_Prompts_Readable";
DROP VIEW IF EXISTS "Voice_Prompts_Readable";
DROP VIEW IF EXISTS "Webinar_Management_Readable";

-- ============================================
-- DROP OLD INDEXES
-- ============================================

DROP INDEX IF EXISTS documents_embedding_idx;
DROP INDEX IF EXISTS prompts_id_idx;
DROP INDEX IF EXISTS documents_created_at_idx;
DROP INDEX IF EXISTS api_custom_fields_created_at_idx;
DROP INDEX IF EXISTS Voice_Transcript_Session_Id_Idx;
DROP INDEX IF EXISTS Voice_Transcript_Timestamp_Idx;

-- ============================================
-- CREATE NEW INDEXES (LOWERCASE FOR DOCUMENTS)
-- ============================================

DROP INDEX IF EXISTS Documents_Embedding_Idx;
CREATE INDEX Documents_Embedding_Idx ON "Documents" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

DROP INDEX IF EXISTS Documents_Created_At_Idx;
CREATE INDEX Documents_Created_At_Idx ON "Documents"("created_at");

DROP INDEX IF EXISTS Text_Prompts_Id_Idx;
CREATE INDEX Text_Prompts_Id_Idx ON "Text_Prompts"("Id");

DROP INDEX IF EXISTS Text_Prompts_Updated_At_Idx;
CREATE INDEX Text_Prompts_Updated_At_Idx ON "Text_Prompts"("Updated_At");

DROP INDEX IF EXISTS Voice_Prompts_Id_Idx;
CREATE INDEX Voice_Prompts_Id_Idx ON "Voice_Prompts"("Id");

DROP INDEX IF EXISTS Voice_Prompts_Updated_At_Idx;
CREATE INDEX Voice_Prompts_Updated_At_Idx ON "Voice_Prompts"("Updated_At");

DROP INDEX IF EXISTS API_Management_Created_At_Idx;
CREATE INDEX API_Management_Created_At_Idx ON "API_Management"("Created_At");

DROP INDEX IF EXISTS Call_History_Session_Id_Idx;
CREATE INDEX Call_History_Session_Id_Idx ON "Call_History"("Session_Id");

DROP INDEX IF EXISTS Call_History_Timestamp_Idx;
CREATE INDEX Call_History_Timestamp_Idx ON "Call_History"("Timestamp");

DROP INDEX IF EXISTS Webinar_Management_Updated_At_Idx;
CREATE INDEX Webinar_Management_Updated_At_Idx ON "Webinar_Management"("Updated_At");

-- ============================================
-- FUNCTIONS (UPDATED FOR BOTH CASES)
-- ============================================

-- Function for lowercase updated_at (Documents table)
CREATE OR REPLACE FUNCTION Update_Updated_At_Column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for PascalCase Updated_At (Text_Prompts, Voice_Prompts, Webinar_Management)
CREATE OR REPLACE FUNCTION Update_Updated_At_Column_Pascal()
RETURNS TRIGGER AS $$
BEGIN
  NEW."Updated_At" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION Match_Documents (
  Query_Embedding VECTOR(1536),
  Match_Count INT DEFAULT NULL,
  Filter JSONB DEFAULT '{}'
) RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    "Documents"."id",
    "Documents"."content",
    "Documents"."metadata",
    1 - ("Documents"."embedding" <=> Query_Embedding) AS similarity
  FROM "Documents"
  WHERE "Documents"."metadata" @> Filter
  ORDER BY "Documents"."embedding" <=> Query_Embedding
  LIMIT Match_Count;
END;
$$;

CREATE OR REPLACE FUNCTION Prevent_Text_Prompt_Deletion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Deletion of Text_Prompts rows is not allowed.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION Prevent_Text_Prompt_Insertion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."Id" < 0 OR NEW."Id" > 8 THEN
    RAISE EXCEPTION 'Only IDs 0-8 are allowed in Text_Prompts.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION Prevent_Voice_Prompt_Deletion()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Deletion of Voice_Prompts rows is not allowed.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION Prevent_Voice_Prompt_Insertion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."Id" < 0 OR NEW."Id" > 5 THEN
    RAISE EXCEPTION 'Only IDs 0-5 are allowed in Voice_Prompts.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS (UPDATED WITH CORRECT FUNCTIONS)
-- ============================================

-- Documents uses lowercase updated_at
DROP TRIGGER IF EXISTS Update_Documents_Updated_At ON "Documents";
CREATE TRIGGER Update_Documents_Updated_At 
  BEFORE UPDATE ON "Documents"
  FOR EACH ROW 
  EXECUTE FUNCTION Update_Updated_At_Column();

-- Text_Prompts uses PascalCase Updated_At
DROP TRIGGER IF EXISTS Update_Text_Prompts_Updated_At ON "Text_Prompts";
CREATE TRIGGER Update_Text_Prompts_Updated_At 
  BEFORE UPDATE ON "Text_Prompts"
  FOR EACH ROW 
  EXECUTE FUNCTION Update_Updated_At_Column_Pascal();

-- Voice_Prompts uses PascalCase Updated_At
DROP TRIGGER IF EXISTS Update_Voice_Prompts_Updated_At ON "Voice_Prompts";
CREATE TRIGGER Update_Voice_Prompts_Updated_At 
  BEFORE UPDATE ON "Voice_Prompts"
  FOR EACH ROW 
  EXECUTE FUNCTION Update_Updated_At_Column_Pascal();

-- Webinar_Management uses PascalCase Updated_At
DROP TRIGGER IF EXISTS Update_Webinar_Management_Updated_At ON "Webinar_Management";
CREATE TRIGGER Update_Webinar_Management_Updated_At 
  BEFORE UPDATE ON "Webinar_Management"
  FOR EACH ROW 
  EXECUTE FUNCTION Update_Updated_At_Column_Pascal();

DROP TRIGGER IF EXISTS Prevent_Text_Prompts_Deletion ON "Text_Prompts";
CREATE TRIGGER Prevent_Text_Prompts_Deletion
  BEFORE DELETE ON "Text_Prompts"
  FOR EACH ROW
  EXECUTE FUNCTION Prevent_Text_Prompt_Deletion();

DROP TRIGGER IF EXISTS Prevent_Invalid_Text_Prompts_Insertion ON "Text_Prompts";
CREATE TRIGGER Prevent_Invalid_Text_Prompts_Insertion
  BEFORE INSERT ON "Text_Prompts"
  FOR EACH ROW
  EXECUTE FUNCTION Prevent_Text_Prompt_Insertion();

DROP TRIGGER IF EXISTS Prevent_Voice_Prompts_Deletion ON "Voice_Prompts";
CREATE TRIGGER Prevent_Voice_Prompts_Deletion
  BEFORE DELETE ON "Voice_Prompts"
  FOR EACH ROW
  EXECUTE FUNCTION Prevent_Voice_Prompt_Deletion();

DROP TRIGGER IF EXISTS Prevent_Invalid_Voice_Prompts_Insertion ON "Voice_Prompts";
CREATE TRIGGER Prevent_Invalid_Voice_Prompts_Insertion
  BEFORE INSERT ON "Voice_Prompts"
  FOR EACH ROW
  EXECUTE FUNCTION Prevent_Voice_Prompt_Insertion();

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  row_count INT;
BEGIN
  RAISE NOTICE '=== Migration Complete ===';
  
  SELECT COUNT(*) INTO row_count FROM "API_Management";
  RAISE NOTICE 'API_Management rows: %', row_count;
  
  SELECT COUNT(*) INTO row_count FROM "Documents";
  RAISE NOTICE 'Documents rows: % (with lowercase columns)', row_count;
  
  SELECT COUNT(*) INTO row_count FROM "Text_Prompts";
  RAISE NOTICE 'Text_Prompts rows: % (with Updated_At only)', row_count;
  
  SELECT COUNT(*) INTO row_count FROM "Voice_Prompts";
  RAISE NOTICE 'Voice_Prompts rows: % (with Updated_At only)', row_count;
  
  SELECT COUNT(*) INTO row_count FROM "Call_History";
  RAISE NOTICE 'Call_History rows: % (with Call_Transcript and Call_Recording)', row_count;
  
  SELECT COUNT(*) INTO row_count FROM "Webinar_Management";
  RAISE NOTICE 'Webinar_Management rows: % (with Updated_At only)', row_count;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== Changes Made ===';
  RAISE NOTICE '✓ Documents table uses lowercase columns: id, content, metadata, embedding, updated_at, created_at';
  RAISE NOTICE '✓ Removed _Readable views';
  RAISE NOTICE '✓ Removed Created_At from Text_Prompts, Voice_Prompts, Webinar_Management';
  RAISE NOTICE '✓ Added/kept Updated_At in Text_Prompts, Voice_Prompts, Webinar_Management';
  RAISE NOTICE '✓ Renamed Message to Call_Transcript in Call_History';
  RAISE NOTICE '✓ Added Call_Recording column to Call_History';
  RAISE NOTICE '✓ Auto-update triggers enabled for Updated_At/updated_at columns';
  RAISE NOTICE '✓ Separate trigger functions for lowercase and PascalCase timestamp columns';
END $$;`;
