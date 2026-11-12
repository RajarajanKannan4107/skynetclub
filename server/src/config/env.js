import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env if available
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || process.env.CORS_ORIGIN || 'http://localhost:5173',

  supabase: {
    url: process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key',
  },

  storage: {
    submissionsBucket: process.env.STORAGE_BUCKET_SUBMISSIONS || 'task-submissions',
    projectsBucket: process.env.STORAGE_BUCKET_PROJECTS || 'project-thumbnails',
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '15', 10),
  },

  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

// Safety check for production environment
if (config.isProduction) {
  if (
    !process.env.SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
  ) {
    console.warn(
      '⚠️ [SECURITY WARNING]: Production environment detected without configured SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'
    );
  }
}
