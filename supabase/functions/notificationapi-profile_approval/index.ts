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
    const { userId, icon, url } = await req.json();

    await notificationapi.send({
      notificationId: 'profile_approval',
      user: {
        id: userId
      },
      mergeTags: {
        icon: icon,
        url: url
      }
    });

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
