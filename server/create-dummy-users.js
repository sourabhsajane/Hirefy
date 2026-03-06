const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('./config/supabase');

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

async function createDummyUsers() {
  console.log('🚀 Creating dummy users...');
  
  for (const userData of dummyUsers) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user
      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert([
          {
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            role: userData.role,
            is_verified: true,
            created_at: new Date().toISOString()
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
  
  console.log('\n🎉 Dummy users creation completed!');
  console.log('\n📋 Test Accounts:');
  console.log('Candidate: candidate@hirefy.com / password123');
  console.log('Recruiter: recruiter@hirefy.com / password123');
  console.log('Admin: admin@hirefy.com / password123');
}

// Run the script
createDummyUsers().catch(console.error);
