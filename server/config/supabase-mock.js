// Mock Supabase configuration for development without actual Supabase setup
const mockSupabase = {
  from: (table) => ({
    select: (columns) => ({
      eq: (column, value) => ({
        single: () => Promise.resolve({ data: null, error: null })
      }),
      order: (column, options) => Promise.resolve({ data: [], error: null })
    }),
    insert: (data) => ({
      select: (columns) => ({
        single: () => Promise.resolve({ 
          data: {
            id: 'mock-id-' + Date.now(),
            email: data[0].email,
            name: data[0].name,
            role: data[0].role,
            password: data[0].password
          }, 
          error: null 
        })
      })
    }),
    update: (data) => ({
      eq: (column, value) => Promise.resolve({ data: [], error: null })
    })
  })
};

module.exports = { 
  supabase: mockSupabase, 
  supabaseAdmin: mockSupabase 
};
