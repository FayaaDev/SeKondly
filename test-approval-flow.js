const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5001';

async function testApprovalFlow() {
    console.log('🧪 Testing approval email flow...\n');
    
    // First, create a new user
    const userData = {
        email: 'test-approval@example.com',
        password: 'testpassword123',
        firstName: 'Test',
        lastName: 'Doctor',
        phone: '1234567890',
        experience: '5 years',
        institution: 'Test Hospital',
        specialty: 'Internal Medicine',
        level: 'Specialist'
    };
    
    console.log('1. Creating new user...');
    try {
        const createResponse = await fetch(`${API_BASE}/api/onboarding`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });
        
        if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error('❌ User creation failed:', errorText);
            return;
        }
        
        const createResult = await createResponse.json();
        console.log('✅ User created successfully:', createResult.message);
        
        // Extract user ID from the response
        const userId = createResult.userId;
        if (!userId) {
            console.error('❌ No user ID returned from user creation');
            return;
        }
        
        console.log('📧 User ID:', userId);
        
        // Now we need to login as admin to approve the user
        console.log('\n2. Logging in as admin...');
        const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'sekondly.app@gmail.com',
                password: 'AdminSeKondly2024!'
            }),
        });
        
        if (!loginResponse.ok) {
            const errorText = await loginResponse.text();
            console.error('❌ Admin login failed:', errorText);
            return;
        }
        
        const loginResult = await loginResponse.json();
        console.log('✅ Admin login successful');
        
        // Extract the session cookie for authenticated requests
        const setCookieHeader = loginResponse.headers.get('set-cookie');
        const sessionCookie = setCookieHeader ? setCookieHeader.split(';')[0] : '';
        
        console.log('\n3. Approving user...');
        const approveResponse = await fetch(`${API_BASE}/api/admin/approve-user/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': sessionCookie
            },
        });
        
        if (!approveResponse.ok) {
            const errorText = await approveResponse.text();
            console.error('❌ User approval failed:', errorText);
            return;
        }
        
        const approveResult = await approveResponse.json();
        console.log('✅ User approved successfully');
        console.log('📧 Check the logs for approval email status');
        
    } catch (error) {
        console.error('❌ Error during approval flow test:', error);
    }
}

testApprovalFlow();
