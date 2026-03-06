const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
  console.log('⚠️  Supabase environment variables not set. Using mock configuration for development.');
  const { supabase, supabaseAdmin } = require('./supabase-mock');
  module.exports = { supabase, supabaseAdmin };
} else {
  // Client for regular operations
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Admin client for operations requiring service role
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  module.exports = { supabase, supabaseAdmin };
}
