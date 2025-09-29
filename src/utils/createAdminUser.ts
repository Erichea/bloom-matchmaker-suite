import { supabase } from '@/integrations/supabase/client';

export const createAdminUser = async () => {
  try {
    // Create admin user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@bloom.com',
      password: 'admin123',
      options: {
        data: {
          first_name: 'Admin',
          last_name: 'User',
        }
      }
    });

    if (authError) {
      console.error('Error creating admin user:', authError);
      return { error: authError };
    }

    if (authData.user) {
      // Create admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'admin'
        });

      if (roleError) {
        console.error('Error creating admin role:', roleError);
        return { error: roleError };
      }

      console.log('Admin user created successfully');
      return { success: true };
    }

    return { error: new Error('User creation failed') };
  } catch (error) {
    console.error('Error in createAdminUser:', error);
    return { error };
  }
};