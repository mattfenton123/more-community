import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("Error fetching buckets:", error.message);
  } else {
    console.log("Buckets:", data.map(b => b.name));
    
    // Check if 'uploads' bucket exists, create it if not
    const uploadsBucket = data.find(b => b.name === 'uploads');
    if (!uploadsBucket) {
      console.log("Creating 'uploads' bucket...");
      const { data: createData, error: createError } = await supabase.storage.createBucket('uploads', {
        public: true,
        allowedMimeTypes: ['image/*', 'video/*'],
        fileSizeLimit: 52428800 // 50MB
      });
      if (createError) {
        console.error("Error creating bucket:", createError.message);
      } else {
        console.log("Bucket created successfully:", createData);
      }
    } else {
      console.log("'uploads' bucket already exists, and public:", uploadsBucket.public);
    }
  }
}

checkBuckets();
