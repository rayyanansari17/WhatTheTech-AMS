// tests/fixtures/test-users.ts
// Test data used across all spec files
// These match the profiles table schema exactly

export const TEST_USER = {
  email: 'playwright.test@gmail.com',
  password: 'TestPassword@123',
  full_name: 'Playwright Test User',
  phone: '9999999999',
  age: 21,
  gender: 'male',
  city: 'Hyderabad',
  state: 'Telangana',
  country: 'India',
  institution: 'Test Engineering College',
  degree_type: 'B.E.',
  field_of_study: 'Computer Science',
  year_of_study: '3rd Year',
  year_of_graduation: '2026',
  currently_studying: true,
  role_type: 'developer',
  skills: ['JavaScript', 'React', 'Node.js'],
  tshirt_size: 'M',
  first_hackathon: true,
  dietary_preference: 'vegetarian',
  github: 'https://github.com/testuser',
  linkedin: 'https://linkedin.com/in/testuser',
}

export const TEST_TEAM = {
  team_name: 'Playwright Test Team',
  track: 'web',
  idea_title: 'Test Idea Title',
  idea_desc: 'This is a test idea description for Playwright automated testing.',
  max_members: 4,
}

export const TEST_INVITE_EMAIL = 'playwright.invite@gmail.com'

// Cashfree test card details
export const CASHFREE_TEST_CARDS = {
  success: {
    number: '4111111111111111',
    expiry_month: '12',
    expiry_year: '2026',
    cvv: '123',
    holder_name: 'Test User',
  },
  failure: {
    number: '4000000000000002',
    expiry_month: '12',
    expiry_year: '2026',
    cvv: '123',
    holder_name: 'Test User',
  },
}

// Routes used across tests
export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  profile: '/register/profile',
  team: '/register/team',
  payment: '/register/payment',
  confirmation: '/register/confirmation',
  admin: '/admin',
  adminCheckin: '/admin/checkin',
  adminPayments: '/admin/payments',
  adminTeams: '/admin/teams',
  adminParticipants: '/admin/participants',
}
