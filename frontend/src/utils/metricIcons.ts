import {
  Activity, TrendingUp, BarChart3, PieChart, LineChart, Target, Zap,
  Users, UserPlus, UserCheck, UserMinus, Heart, Star, Award, Trophy,
  ThumbsUp, ThumbsDown, MessageCircle, MessageSquare, Send, Mail,
  Phone, Video, Image, File, FileText, Download, Upload, Share2,
  Eye, EyeOff, Clock, Calendar, Timer, Hourglass, Bell, BellOff,
  CheckCircle, XCircle, AlertCircle, Info, HelpCircle, Settings,
  Sliders, Filter, Search, Bookmark, Tag, Hash, AtSign, Link,
  Globe, MapPin, Navigation, Compass, Map, Briefcase, ShoppingCart,
  CreditCard, DollarSign, TrendingDown, Percent, Calculator
} from '@/components/icons';

type PixelIcon = React.FC<React.SVGProps<SVGSVGElement> & { size?: number | string }>;

export const METRIC_ICONS: PixelIcon[] = [
  Activity, TrendingUp, BarChart3, PieChart, LineChart, Target, Zap,
  Users, UserPlus, UserCheck, UserMinus, Heart, Star, Award, Trophy,
  ThumbsUp, ThumbsDown, MessageCircle, MessageSquare, Send, Mail,
  Phone, Video, Image, File, FileText, Download, Upload, Share2,
  Eye, EyeOff, Clock, Calendar, Timer, Hourglass, Bell, BellOff,
  CheckCircle, XCircle, AlertCircle, Info, HelpCircle, Settings,
  Sliders, Filter, Search, Bookmark, Tag, Hash, AtSign, Link,
  Globe, MapPin, Navigation, Compass, Map, Briefcase, ShoppingCart,
  CreditCard, DollarSign, TrendingDown, Percent, Calculator
];

// Get icon based on metric name/id for consistency
export const getMetricIcon = (metricIdentifier: string): PixelIcon => {
  // Create a simple hash from the string
  let hash = 0;
  for (let i = 0; i < metricIdentifier.length; i++) {
    hash = ((hash << 5) - hash) + metricIdentifier.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const index = Math.abs(hash) % METRIC_ICONS.length;
  return METRIC_ICONS[index];
};
