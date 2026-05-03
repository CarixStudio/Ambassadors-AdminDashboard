import { supabase } from './supabase';

export type NotificationType = 'info' | 'reminder' | 'prayer' | 'event' | 'donation' | 'announcement' | 'system';

export interface CreateNotificationParams {
  user_id: string;
  title: string;
  message: string;
  type?: NotificationType;
  metadata?: any;
}

export const notificationRepo = {
  /**
   * Create a notification for a specific user
   */
  create: async (params: CreateNotificationParams) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          user_id: params.user_id,
          title: params.title,
          message: params.message,
          type: params.type || 'info',
          metadata: params.metadata,
          is_read: false
        }]);

      if (error) {
        console.error('[NotificationRepo] Error creating notification:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[NotificationRepo] Unexpected error:', err);
      return false;
    }
  },

  /**
   * Notify all admins about an event
   */
  notifyAdmins: async (title: string, message: string, metadata?: any) => {
    try {
      // Get all admin user IDs directly from profiles.role_claim
      const { data: adminProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .in('role_claim', ['admin', 'super_admin', 'pastor']);
      
      if (profileError) throw profileError;
      const userIds = adminProfiles?.map(p => p.id) || [];

      if (userIds.length === 0) return false;

      // 2. Create notifications for all admins
      const notifications = userIds.map(uid => ({
        user_id: uid,
        title,
        message,
        type: 'info' as NotificationType,
        metadata,
        is_read: false
      }));

      const { error: insertError } = await supabase.from('notifications').insert(notifications);
      
      if (insertError) {
        console.error('[NotificationRepo] Error bulk creating notifications:', insertError);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[NotificationRepo] Unexpected error in notifyAdmins:', err);
      return false;
    }
  }
};
