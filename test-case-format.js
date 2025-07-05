// Test script to check if the server is returning the format field
const API_BASE = 'https://sekondly.app';

async function testCaseFormat() {
  try {
    console.log('Testing case format response from server...');
    
    // First, let's check if we can get existing cases and see their format
    const casesResponse = await fetch(`${API_BASE}/api/cases`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (casesResponse.ok) {
      const cases = await casesResponse.json();
      console.log('\nExisting cases sample (first case):');
      if (cases.length > 0) {
        const firstCase = cases[0];
        console.log('Case ID:', firstCase.id);
        console.log('Title:', firstCase.title);
        console.log('Format field present:', 'format' in firstCase);
        console.log('Format value:', firstCase.format);
        console.log('All fields:', Object.keys(firstCase));
      } else {
        console.log('No cases found');
      }
    } else {
      console.log('Failed to fetch cases:', casesResponse.status);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCaseFormat();
