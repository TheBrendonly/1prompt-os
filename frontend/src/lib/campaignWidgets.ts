import { supabase } from '@/integrations/supabase/client';

export const defaultCampaignWidgets = [
  // Separator: Overview
  { analytics_type: "engagement_campaign", widget_type: "separator", title: "Overview",              width: "full",    sort_order: 0,  config: { section: "Overview" }, color: "#3b82f6" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "Total Enrolled",      width: "quarter", sort_order: 1,  config: { stat_key: "total_enrolled",      section: "Overview", icon: "users" }, color: "#3b82f6" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "Total Engaged",       width: "quarter", sort_order: 2,  config: { stat_key: "total_engaged",       section: "Overview", icon: "send" }, color: "#3b82f6" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "Total Replied",       width: "quarter", sort_order: 3,  config: { stat_key: "total_replied",       section: "Overview", icon: "message-circle" }, color: "#3b82f6" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "Reply Rate",          width: "quarter", sort_order: 4,  config: { stat_key: "reply_rate",          section: "Overview", icon: "percent", suffix: "%" }, color: "#3b82f6" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "Currently Active",    width: "quarter", sort_order: 5,  config: { stat_key: "currently_active",    section: "Overview", icon: "activity" }, color: "#3b82f6" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "Finished (No Reply)", width: "quarter", sort_order: 6,  config: { stat_key: "sequence_complete",   section: "Overview", icon: "check-circle" }, color: "#3b82f6" },

  // Separator: SMS
  { analytics_type: "engagement_campaign", widget_type: "separator", title: "SMS",                   width: "full",    sort_order: 7,  config: { section: "SMS" }, color: "#10b981" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "SMS Engaged",         width: "quarter", sort_order: 8,  config: { stat_key: "sms_engaged",         section: "SMS", icon: "smartphone" }, color: "#10b981" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "SMS Replies",         width: "quarter", sort_order: 9,  config: { stat_key: "sms_replies",         section: "SMS", icon: "message-circle" }, color: "#10b981" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "SMS Reply Rate",      width: "quarter", sort_order: 10, config: { stat_key: "sms_reply_rate",      section: "SMS", icon: "percent", suffix: "%" }, color: "#10b981" },

  // Separator: WhatsApp
  { analytics_type: "engagement_campaign", widget_type: "separator", title: "WhatsApp",              width: "full",    sort_order: 11, config: { section: "WhatsApp" }, color: "#06b6d4" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "WhatsApp Engaged",    width: "quarter", sort_order: 12, config: { stat_key: "whatsapp_engaged",    section: "WhatsApp", icon: "message-square" }, color: "#06b6d4" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "WhatsApp Replies",    width: "quarter", sort_order: 13, config: { stat_key: "whatsapp_replies",    section: "WhatsApp", icon: "message-circle" }, color: "#06b6d4" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "WhatsApp Reply Rate", width: "quarter", sort_order: 14, config: { stat_key: "whatsapp_reply_rate", section: "WhatsApp", icon: "percent", suffix: "%" }, color: "#06b6d4" },

  // Separator: Voice
  { analytics_type: "engagement_campaign", widget_type: "separator", title: "Voice",                 width: "full",    sort_order: 15, config: { section: "Voice" }, color: "#8b5cf6" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "Phone Calls Made",    width: "quarter", sort_order: 16, config: { stat_key: "phone_calls_made",    section: "Voice", icon: "smartphone" }, color: "#8b5cf6" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "Phone Pickups",       width: "quarter", sort_order: 17, config: { stat_key: "phone_pickups",       section: "Voice", icon: "check-circle" }, color: "#8b5cf6" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "Phone Pickup Rate",   width: "quarter", sort_order: 18, config: { stat_key: "phone_pickup_rate",   section: "Voice", icon: "percent", suffix: "%" }, color: "#8b5cf6" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "Voicemails",          width: "quarter", sort_order: 18.1, config: { stat_key: "phone_voicemails",    section: "Voice", icon: "voicemail" }, color: "#8b5cf6" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "Avg Call Duration",   width: "quarter", sort_order: 18.2, config: { stat_key: "phone_avg_duration",  section: "Voice", icon: "clock", suffix: "s", null_label: "N/A" }, color: "#8b5cf6" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "Call Spend",          width: "quarter", sort_order: 18.3, config: { stat_key: "phone_call_spend",    section: "Voice", icon: "dollar-sign", prefix: "$" }, color: "#8b5cf6" },

  // Separator: Bookings
  { analytics_type: "engagement_campaign", widget_type: "separator", title: "Bookings",              width: "full",    sort_order: 19, config: { section: "Bookings" }, color: "#ec4899" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "Appointments Booked",  width: "quarter", sort_order: 20, config: { stat_key: "appointments_booked",  section: "Bookings", icon: "calendar" }, color: "#ec4899" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "Booking Rate",         width: "quarter", sort_order: 21, config: { stat_key: "booking_rate",         section: "Bookings", icon: "percent", suffix: "%" }, color: "#ec4899" },

  // Separator: Timing
  { analytics_type: "engagement_campaign", widget_type: "separator", title: "Timing",                width: "full",    sort_order: 22, config: { section: "Timing" }, color: "#f59e0b" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "Avg First Engagement", width: "quarter", sort_order: 23, config: { stat_key: "avg_first_engagement_minutes", section: "Timing", icon: "clock", suffix: " min", null_label: "N/A" }, color: "#f59e0b" },
  { analytics_type: "engagement_campaign", widget_type: "number_card", title: "Avg Response Time",    width: "quarter", sort_order: 24, config: { stat_key: "avg_response_minutes",         section: "Timing", icon: "clock", suffix: " min", null_label: "N/A" }, color: "#f59e0b" },

  // Separator: Step Performance
  { analytics_type: "engagement_campaign", widget_type: "separator", title: "Step Performance",      width: "full",    sort_order: 25, config: { section: "Step Performance" }, color: "#f59e0b" },
  { analytics_type: "engagement_campaign", widget_type: "bar_horizontal", title: "Replies by Step",          width: "half", sort_order: 26, config: { chart_key: "replies_by_step",    section: "Step Performance" }, color: "#f59e0b" },
  { analytics_type: "engagement_campaign", widget_type: "doughnut",       title: "Reply Distribution by Step", width: "half", sort_order: 27, config: { chart_key: "replies_by_step",    section: "Step Performance" }, color: "#8b5cf6" },

  // Separator: Charts
  { analytics_type: "engagement_campaign", widget_type: "separator", title: "Charts",               width: "full",    sort_order: 28, config: { section: "Charts" }, color: "#3b82f6" },
  { analytics_type: "engagement_campaign", widget_type: "line",           title: "Engagements Over Time",  width: "half", sort_order: 29, config: { chart_key: "engagements_by_day",   section: "Charts" }, color: "#3b82f6" },
  { analytics_type: "engagement_campaign", widget_type: "line",           title: "Replies Over Time",      width: "half", sort_order: 30, config: { chart_key: "replies_by_day",       section: "Charts" }, color: "#10b981" },
  { analytics_type: "engagement_campaign", widget_type: "bar_vertical",   title: "Peak Response Hour",     width: "half", sort_order: 31, config: { chart_key: "replies_by_hour",      section: "Charts" }, color: "#f59e0b" },
  { analytics_type: "engagement_campaign", widget_type: "bar_vertical",   title: "Replies by Day of Week", width: "half", sort_order: 32, config: { chart_key: "replies_by_dow",       section: "Charts" }, color: "#8b5cf6" },
  { analytics_type: "engagement_campaign", widget_type: "bar_horizontal", title: "Channel Comparison",     width: "half", sort_order: 33, config: { chart_key: "channel_distribution", section: "Charts" }, color: "#06b6d4" },
  { analytics_type: "engagement_campaign", widget_type: "doughnut",       title: "Reply vs No Reply",      width: "half", sort_order: 34, config: { chart_key: "reply_vs_no_reply",    section: "Charts" }, color: "#3b82f6" },
  { analytics_type: "engagement_campaign", widget_type: "line",           title: "Bookings Over Time",     width: "half", sort_order: 35, config: { chart_key: "bookings_by_day",      section: "Charts" }, color: "#ec4899" },
].map((widget, index) => ({
  ...widget,
  sort_order: index,
}));

export async function insertDefaultCampaignWidgets(clientId: string, campaignId: string) {
  const rows = defaultCampaignWidgets.map(({ color, ...w }) => ({
    ...w,
    client_id: clientId,
    campaign_id: campaignId,
    is_active: true,
  }));

  const { error } = await (supabase as any)
    .from('dashboard_widgets')
    .insert(rows);

  if (error) {
    console.error('Failed to insert default campaign widgets:', error);
  }
}
