const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

// Check if Supabase is configured
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Supabase not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Dummy users data
const dummyUsers = [
  {
    email: 'candidate@hirefy.com',
    password: 'password123',
    name: 'John Candidate',
    role: 'candidate'
  },
  {
    email: 'recruiter@hirefy.com',
    password: 'password123',
    name: 'Jane Recruiter',
    role: 'recruiter'
  },
  {
    email: 'admin@hirefy.com',
    password: 'password123',
    name: 'Admin User',
    role: 'admin'
  }
];

async function createRealUsers() {
  console.log('🚀 Creating users in real Supabase database...');
  console.log('📡 Supabase URL:', supabaseUrl);
  
  for (const userData of dummyUsers) {
    try {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`❌ Error checking user ${userData.email}:`, checkError);
        continue;
      }

      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: userData.role
          }
        ])
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error);
      } else {
        console.log(`✅ Created user: ${userData.name} (${userData.email}) as ${userData.role}`);
        console.log(`   Password: ${userData.password}`);
      }
    } catch (error) {
      console.error(`❌ Error processing user ${userData.email}:`, error);
    }
  }
  
  console.log('\n🎉 Real users creation completed!');
  console.log('\n📋 Test Accounts:');
  console.log('Candidate: candidate@hirefy.com / password123');
  console.log('Recruiter: recruiter@hirefy.com / password123');
  console.log('Admin: admin@hirefy.com / password123');
}

// Run the script
createRealUsers().catch(console.error);
