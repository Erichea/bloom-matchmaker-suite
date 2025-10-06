import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import notificationapi from 'npm:notificationapi-node-server-sdk';

notificationapi.init(
  'yq42fwnkajoxhxdkvoatkocrgr',
  'u090nyyshm44j5pd5yq62d4o8zih4u1zu8u7qpmsrpe8us6vunamqcrdyj',
  {
    baseURL: 'https://api.eu.notificationapi.com'
  }
);

serve(async (req) => {
  try {
    const body = await req.json();
    console.log('Received request body:', JSON.stringify(body));

    const { userId, matchName, icon, url } = body;

    console.log('Parsed parameters:', { userId, matchName, icon, url });

    if (!userId) {
      throw new Error('userId is required');
    }

    console.log('Sending notification to NotificationAPI...');

    await notificationapi.send({
      notificationId: 'new_match',
      user: {
        id: userId
      },
      mergeTags: {
        matchName: matchName,
        icon: icon,
        url: url
      }
    });

    console.log('Notification sent successfully to user:', userId);

    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    console.error('Error details:', error.message, error.stack);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
