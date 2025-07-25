// Base URL for API calls — change this if deploying to a live server
const apiBaseURL = 'http://localhost:3000';

// grab the JWT and build headers
const authHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};