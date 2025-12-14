// Test script for Telegram webhook functionality
import fetch from 'node-fetch';

const baseUrl = 'https://0346a8ac-73d3-49de-a366-7a5643581671-00-48nx3a4w1adm.worf.replit.dev';

// Test data simulating a Telegram bot message
const testMessage = {
    update_id: 123456,
    message: {
        message_id: 1,
        from: {
            id: 987654321,
            is_bot: false,
            first_name: "Test",
            username: "testuser",
            language_code: "en"
        },
        chat: {
            id: -1001234567890,
            title: "BetChat Test Group",
            type: "supergroup"
        },
        date: Math.floor(Date.now() / 1000),
        text: "This is a test message for #event9 from Telegram!"
    }
};

async function testTelegramWebhook() {
    console.log('🧪 Testing Telegram webhook...');
    
    try {
        const response = await fetch(`${baseUrl}/api/telegram/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testMessage)
        });
        
        const result = await response.json();
        
        console.log('✅ Webhook Response:', response.status, result);
        
        if (response.ok) {
            console.log('✅ Telegram webhook is working correctly!');
            console.log('📨 Test message should appear in Event 9 chat');
        } else {
            console.log('❌ Webhook failed with status:', response.status);
        }
        
    } catch (error) {
        console.error('❌ Error testing webhook:', error);
    }
}

// Test webhook with different scenarios
async function testWebhookScenarios() {
    console.log('🔄 Testing various webhook scenarios...\n');
    
    // Test 1: Valid message for existing event
    console.log('Test 1: Valid message for event #event9');
    await testTelegramWebhook();
    
    // Test 2: Message without event hashtag
    console.log('\nTest 2: Message without event hashtag');
    const noEventMessage = {
        ...testMessage,
        message: {
            ...testMessage.message,
            text: "Regular message without event hashtag"
        }
    };
    
    try {
        const response = await fetch(`${baseUrl}/api/telegram/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(noEventMessage)
        });
        
        const result = await response.json();
        console.log('✅ No event hashtag response:', response.status, result);
    } catch (error) {
        console.error('❌ Error:', error);
    }
    
    // Test 3: Message for non-existent event
    console.log('\nTest 3: Message for non-existent event #event999');
    const nonExistentEventMessage = {
        ...testMessage,
        message: {
            ...testMessage.message,
            text: "This message is for #event999 which doesn't exist"
        }
    };
    
    try {
        const response = await fetch(`${baseUrl}/api/telegram/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(nonExistentEventMessage)
        });
        
        const result = await response.json();
        console.log('✅ Non-existent event response:', response.status, result);
    } catch (error) {
        console.error('❌ Error:', error);
    }
    
    console.log('\n🎉 All webhook tests completed!');
}

// Run the tests
testWebhookScenarios();