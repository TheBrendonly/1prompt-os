import { PageSection, Creative } from '@/types/editor';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, X, Upload, Plus, Trash2, ChevronDown, MoreHorizontal, ThumbsUp, MessageCircle, Share2, Globe, Search, Bell, Home, Users, PlayCircle, Store } from '@/components/icons';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
const countryCodes = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'IN', flag: '🇮🇳' },
  { code: '+61', country: 'AU', flag: '🇦🇺' },
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
  { code: '+81', country: 'JP', flag: '🇯🇵' },
  { code: '+86', country: 'CN', flag: '🇨🇳' },
  { code: '+55', country: 'BR', flag: '🇧🇷' },
  { code: '+52', country: 'MX', flag: '🇲🇽' },
  { code: '+34', country: 'ES', flag: '🇪🇸' },
  { code: '+39', country: 'IT', flag: '🇮🇹' },
  { code: '+82', country: 'KR', flag: '🇰🇷' },
  { code: '+31', country: 'NL', flag: '🇳🇱' },
  { code: '+46', country: 'SE', flag: '🇸🇪' },
  { code: '+41', country: 'CH', flag: '🇨🇭' },
  { code: '+65', country: 'SG', flag: '🇸🇬' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'SA', flag: '🇸🇦' },
  { code: '+27', country: 'ZA', flag: '🇿🇦' },
  { code: '+7', country: 'RU', flag: '🇷🇺' },
];

interface FormSubmitData {
  name: string;
  email: string;
  phone: string;
}

interface SectionProps {
  section: PageSection;
  isSelected: boolean;
  isEditor: boolean;
  onSelect: () => void;
  onUpdateProperty: (key: string, value: any) => void;
  onFormSubmitSuccess?: (userData: FormSubmitData) => void;
}

export default function FormAISection({ section, isEditor, onUpdateProperty, onFormSubmitSuccess }: SectionProps) {
  const props = section.properties;
  const { toast } = useToast();
  const creatives = (props.creatives as Creative[]) || [];
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', countryCode: '+1' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formConfig, setFormConfig] = useState({
    title: props.heading || 'See How Your Meta Ads Will Look',
    subtitle: props.subheading || 'Click on any ad to submit a test form and see how leads are captured',
    companyPageName: props.companyPageName || 'Your Company',
    companyPageLogo: props.companyPageLogo || null,
    webhookUrl: props.webhookUrl || '',
    successMessage: props.successMessage || 'Thank you! Your information has been submitted successfully.',
  });

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({});
  const [uploadingPageLogo, setUploadingPageLogo] = useState(false);

  const handleImageUpload = async (file: File, index: number) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid file', description: 'Please upload JPG, PNG, or WebP', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    try {
      setUploadingIndex(index);
      setUploadProgress(prev => ({ ...prev, [index]: 0 }));

      const fileExt = file.name.split('.').pop();
      const fileName = `${section.id}/${index}-${Date.now()}.${fileExt}`;
      const filePath = `demo-creatives/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('demo-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('demo-assets')
        .getPublicUrl(filePath);

      const newCreatives = [...creatives];
      newCreatives[index].imageUrl = publicUrl;
      onUpdateProperty('creatives', newCreatives);
      
      setUploadProgress(prev => ({ ...prev, [index]: 100 }));
      toast({ title: 'Success', description: 'Image uploaded successfully' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setUploadingIndex(null);
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[index];
          return newProgress;
        });
      }, 1000);
    }
  };

  const handlePageLogoUpload = async (file: File) => {
    try {
      setUploadingPageLogo(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `company-logo-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('demo-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('demo-assets')
        .getPublicUrl(filePath);

      setFormConfig({ ...formConfig, companyPageLogo: publicUrl });
      onUpdateProperty('companyPageLogo', publicUrl);
      toast({ title: 'Success', description: 'Logo uploaded successfully' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({ title: 'Error', description: 'Failed to upload logo', variant: 'destructive' });
    } finally {
      setUploadingPageLogo(false);
    }
  };

  const handleAddCreative = () => {
    if (creatives.length >= 4) {
      toast({ title: 'Limit reached', description: 'Maximum 4 creatives allowed', variant: 'destructive' });
      return;
    }

    const newCreative: Creative = {
      id: `creative-${Date.now()}`,
      format: '1:1',
      imageUrl: '',
      title: 'New Ad Title',
      subtitle: 'Your headline here',
      ctaText: 'Learn More',
      description: 'Description text',
      logo: formConfig.companyPageLogo || '',
      name: formConfig.companyPageName || 'Company Name'
    };
    
    onUpdateProperty('creatives', [...creatives, newCreative]);
    toast({ title: 'Creative Added', description: 'New creative added to gallery' });
  };

  const handleDeleteCreative = (index: number) => {
    const newCreatives = creatives.filter((_, i) => i !== index);
    onUpdateProperty('creatives', newCreatives);
    toast({ title: 'Deleted', description: 'Creative removed from gallery' });
  };

  const handleUpdateCreative = (index: number, field: string, value: any) => {
    const newCreatives = [...creatives];
    newCreatives[index] = { ...newCreatives[index], [field]: value };
    onUpdateProperty('creatives', newCreatives);
  };

  const renderCreative = (creative: Creative, index: number) => {
    // Real Facebook ad aspect ratios
    const getAspectRatioStyle = () => {
      switch (creative.format) {
        case '4:5': return { paddingBottom: '125%' }; // 4:5 Facebook Feed
        case '9:16': return { paddingBottom: '177.78%' }; // 9:16 Stories/Reels
        default: return { paddingBottom: '100%' }; // 1:1 Square
      }
    };
    const aspectRatioStyle = getAspectRatioStyle();
    const isUploading = uploadingIndex === index;
    const progress = uploadProgress[index] || 0;
    
    return (
      <div key={creative.id} className="bg-white rounded-lg shadow-md overflow-hidden" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
        {/* Format Selector */}
        <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between">
          <Label className="text-xs text-gray-600 font-medium">Ad Format</Label>
          <Select
            value={creative.format}
            onValueChange={(value: '1:1' | '4:5' | '9:16') => handleUpdateCreative(index, 'format', value)}
          >
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1:1">Square (1:1)</SelectItem>
              <SelectItem value="4:5">Feed (4:5)</SelectItem>
              <SelectItem value="9:16">Story (9:16)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Facebook Ad Header */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-300">
              {(creative.logo || formConfig.companyPageLogo) ? (
                <img src={creative.logo || formConfig.companyPageLogo} alt="Page logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-500">
                  <span className="text-white font-bold text-sm">
                    {(creative.name || formConfig.companyPageName || 'C').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[15px] text-gray-900 truncate leading-tight">
                {creative.name || formConfig.companyPageName}
              </div>
              <div className="flex items-center gap-1 text-[13px] text-gray-500">
                <span>Sponsored</span>
                <span>·</span>
                <Globe className="w-3 h-3" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleDeleteCreative(index)}
                className="p-1.5 hover:bg-red-50 rounded-full"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
              <button className="p-1.5 hover:bg-gray-100 rounded-full">
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Ad Description */}
        <div className="px-3 pb-2">
          <textarea
            value={creative.description || ''}
            onChange={(e) => {
              handleUpdateCreative(index, 'description', e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
            }}
            className="text-[15px] text-gray-900 w-full bg-transparent border-none outline-none focus:bg-gray-50 rounded resize-none leading-[20px]"
            placeholder="Ad description..."
            style={{ minHeight: '40px', maxHeight: '80px' }}
          />
        </div>

        {/* Ad Media */}
        <div 
          className="relative bg-gray-100 cursor-pointer w-full"
          style={{ position: 'relative' }}
          onClick={() => {
            if (isUploading) return;
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/jpeg,image/jpg,image/png,image/webp';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) handleImageUpload(file, index);
            };
            input.click();
          }}
        >
          <div style={aspectRatioStyle} className="w-full" />
          <div className="absolute inset-0">
            {creative.imageUrl ? (
              <>
                <img src={creative.imageUrl} alt={creative.title} className="w-full h-full object-cover" />
                <button
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateCreative(index, 'imageUrl', '');
                  }}
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Camera className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to upload</p>
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                <Progress value={progress} className="w-3/4 mb-3" />
                <p className="text-white text-sm">Uploading... {progress}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Ad Link Preview / CTA Section */}
        <div className="bg-gray-100 px-3 py-2.5 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-2">
              <input
                type="text"
                value={creative.subtitle || ''}
                onChange={(e) => handleUpdateCreative(index, 'subtitle', e.target.value)}
                className="text-[13px] text-gray-500 uppercase w-full bg-transparent border-none outline-none focus:bg-gray-200 rounded truncate"
                placeholder="WEBSITE.COM"
              />
              <input
                type="text"
                value={creative.title || ''}
                onChange={(e) => handleUpdateCreative(index, 'title', e.target.value)}
                className="text-[15px] font-semibold text-gray-900 w-full bg-transparent border-none outline-none focus:bg-gray-200 rounded truncate"
                placeholder="Headline goes here"
              />
            </div>
            <input
              type="text"
              value={creative.ctaText || 'Learn More'}
              onChange={(e) => handleUpdateCreative(index, 'ctaText', e.target.value)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 text-[15px] font-semibold rounded text-center min-w-[100px]"
              placeholder="CTA"
            />
          </div>
        </div>

        {/* Facebook Reactions Bar */}
        <div className="px-3 py-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-gray-500 text-[13px]">
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                <span className="w-[18px] h-[18px] rounded-full bg-blue-500 flex items-center justify-center">
                  <ThumbsUp className="w-2.5 h-2.5 text-white fill-white" />
                </span>
                <span className="w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center text-[10px]">
                  ❤️
                </span>
              </div>
              <span className="ml-1">128</span>
            </div>
            <div className="flex gap-3">
              <span>24 comments</span>
              <span>12 shares</span>
            </div>
          </div>
        </div>

        {/* Facebook Action Buttons */}
        <div className="px-3 py-1 border-t border-gray-200">
          <div className="flex items-center justify-around">
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-gray-100 rounded-md text-gray-600">
              <ThumbsUp className="w-5 h-5" />
              <span className="font-semibold text-[15px]">Like</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-gray-100 rounded-md text-gray-600">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold text-[15px]">Comment</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-gray-100 rounded-md text-gray-600">
              <Share2 className="w-5 h-5" />
              <span className="font-semibold text-[15px]">Share</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (formConfig.webhookUrl) {
        const fullPhone = formData.phone ? `${formData.countryCode}${formData.phone}` : '';
        await fetch(formConfig.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: fullPhone,
            countryCode: formData.countryCode,
            creative: selectedCreative?.title,
            timestamp: new Date().toISOString()
          }),
        });
      }
      setSubmitted(true);
      toast({ title: 'Success', description: formConfig.successMessage });
      
      // Call the success callback to switch to text-ai tab with user data
      if (onFormSubmitSuccess) {
        const fullPhone = formData.phone ? `${formData.countryCode}${formData.phone}` : '';
        onFormSubmitSuccess({
          name: formData.name,
          email: formData.email,
          phone: fullPhone
        });
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({ title: 'Error', description: 'Failed to submit form', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenForm = (creative: Creative) => {
    setSelectedCreative(creative);
    setFormData({ name: '', email: '', phone: '', countryCode: '+1' });
    setSubmitted(false);
    setFormOpen(true);
  };

  const renderPublicCreative = (creative: Creative) => {
    const getAspectRatioStyle = () => {
      switch (creative.format) {
        case '4:5': return { paddingBottom: '125%' };
        case '9:16': return { paddingBottom: '177.78%' };
        default: return { paddingBottom: '100%' };
      }
    };
    const aspectRatioStyle = getAspectRatioStyle();
    
    return (
      <div key={creative.id} className="bg-white rounded-lg shadow overflow-hidden">
        {/* Facebook Ad Header */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              {(creative.logo || formConfig.companyPageLogo) ? (
                <img src={creative.logo || formConfig.companyPageLogo} alt="Page logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#1877F2]">
                  <span className="text-white font-bold text-base">
                    {(creative.name || formConfig.companyPageName || 'C').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[15px] text-[#050505] leading-tight">
                {creative.name || formConfig.companyPageName || 'Company Name'}
              </div>
              <div className="flex items-center gap-1 text-[13px] text-[#65676B]">
                <span>Sponsored</span>
                <span>·</span>
                <Globe className="w-3 h-3" />
              </div>
            </div>
            <button className="p-2 hover:bg-[#F0F2F5] rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5 text-[#65676B]" />
            </button>
          </div>
        </div>

        {/* Ad Description */}
        <div className="px-4 pb-3">
          <p className="text-[15px] text-[#050505] leading-5">
            {creative.description || 'Check out our latest offer and discover amazing deals waiting for you!'}
          </p>
        </div>

        {/* Ad Media */}
        <div className="relative bg-[#F0F2F5] w-full">
          <div style={aspectRatioStyle} className="w-full" />
          <div className="absolute inset-0">
            {creative.imageUrl ? (
              <img src={creative.imageUrl} alt={creative.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#E4E6EB]">
                <Camera className="w-16 h-16 text-[#BCC0C4] mb-2" />
                <p className="text-[#65676B] text-sm">No image</p>
              </div>
            )}
          </div>
        </div>

        {/* Ad Link Preview / CTA Section */}
        <div className="bg-[#F0F2F5] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-[#65676B] uppercase tracking-wide">
                {creative.subtitle || 'YOURWEBSITE.COM'}
              </p>
              <p className="text-[17px] font-semibold text-[#050505] leading-tight truncate">
                {creative.title || 'Your Headline Here'}
              </p>
            </div>
            <button
              onClick={() => handleOpenForm(creative)}
              className="px-4 py-2.5 bg-[#E4E6EB] hover:bg-[#D8DADF] text-[#050505] text-[15px] font-semibold rounded-md transition-colors whitespace-nowrap"
            >
              {creative.ctaText || 'Learn More'}
            </button>
          </div>
        </div>

        {/* Facebook Reactions Bar */}
        <div className="px-4 py-2.5 bg-white">
          <div className="flex items-center justify-between text-[#65676B] text-[15px]">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1">
                <div className="w-[18px] h-[18px] rounded-full bg-[#1877F2] flex items-center justify-center border-2 border-white">
                  <ThumbsUp className="w-2.5 h-2.5 text-white" style={{ fill: 'white' }} />
                </div>
                <div className="w-[18px] h-[18px] rounded-full bg-[#F33E58] flex items-center justify-center border-2 border-white text-[8px]">
                  ❤️
                </div>
              </div>
              <span>128</span>
            </div>
            <div className="flex gap-4">
              <span className="hover:underline cursor-pointer">24 comments</span>
              <span className="hover:underline cursor-pointer">12 shares</span>
            </div>
          </div>
        </div>

        {/* Facebook Action Buttons */}
        <div className="px-2 py-1 bg-white border-t border-[#CED0D4]">
          <div className="flex items-center">
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-[#F0F2F5] rounded-md text-[#65676B] transition-colors">
              <ThumbsUp className="w-5 h-5" />
              <span className="font-semibold text-[15px]">Like</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-[#F0F2F5] rounded-md text-[#65676B] transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold text-[15px]">Comment</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 hover:bg-[#F0F2F5] rounded-md text-[#65676B] transition-colors">
              <Share2 className="w-5 h-5" />
              <span className="font-semibold text-[15px]">Share</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isEditor) {
    // Public view - Full Facebook-style interface
    return (
      <div className="w-full min-h-screen" style={{ backgroundColor: '#F0F2F5', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
        {/* Facebook Header */}
        <div className="sticky top-0 z-50 bg-white" style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}>
          <div className="max-w-[1920px] mx-auto px-4 h-14 flex items-center justify-between">
            {/* Left - Facebook Logo */}
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 36 36" fill="url(#fb-gradient)" height="40" width="40">
                <defs>
                  <linearGradient x1="50%" x2="50%" y1="97.078%" y2="0%" id="fb-gradient">
                    <stop offset="0%" stopColor="#0062E0" />
                    <stop offset="100%" stopColor="#19AFFF" />
                  </linearGradient>
                </defs>
                <path d="M15 35.8C6.5 34.3 0 26.9 0 18 0 8.1 8.1 0 18 0s18 8.1 18 18c0 8.9-6.5 16.3-15 17.8l-1-.8h-4l-1 .8z" />
                <path fill="white" d="M25 23l.8-5H21v-3.5c0-1.4.5-2.5 2.7-2.5H26V7.4c-1.3-.2-2.7-.4-4-.4-4.1 0-7 2.5-7 7v4h-4.5v5H15v12.7c1 .2 2 .3 3 .3s2-.1 3-.3V23h4z" />
              </svg>
              {/* Search Bar */}
              <div className="relative ml-2 hidden sm:block">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search Facebook"
                  className="w-60 h-10 pl-10 pr-4 rounded-full text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: '#F0F2F5' }}
                />
              </div>
            </div>

            {/* Center - Navigation Icons */}
            <div className="hidden md:flex items-center justify-center flex-1 max-w-[680px]">
              <div className="flex items-center gap-2">
                <button className="w-28 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 text-[#1877F2] border-b-[3px] border-[#1877F2]">
                  <Home className="w-6 h-6" fill="currentColor" />
                </button>
                <button className="w-28 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
                  <PlayCircle className="w-6 h-6" />
                </button>
                <button className="w-28 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
                  <Store className="w-6 h-6" />
                </button>
                <button className="w-28 h-12 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
                  <Users className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Right - User Actions */}
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200" style={{ backgroundColor: '#E4E6EB' }}>
                <svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor">
                  <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm-6 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
                </svg>
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200" style={{ backgroundColor: '#E4E6EB' }}>
                <MessageCircle className="w-5 h-5" fill="currentColor" />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-200 relative" style={{ backgroundColor: '#E4E6EB' }}>
                <Bell className="w-5 h-5" fill="currentColor" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">3</span>
              </button>
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {formConfig.companyPageLogo ? (
                  <img src={formConfig.companyPageLogo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" alt="User" className="w-full h-full object-cover" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex justify-center pt-4">
          {/* Left Sidebar - Hidden on mobile */}
          <div className="hidden lg:block w-[280px] pr-4 sticky top-16 h-fit">
            <div className="space-y-1 px-2">
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-200 text-left">
                <div className="w-9 h-9 rounded-full overflow-hidden">
                  {formConfig.companyPageLogo ? (
                    <img src={formConfig.companyPageLogo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" alt="User" className="w-full h-full object-cover" />
                  )}
                </div>
                <span className="font-medium text-[#050505] text-[15px]">{formConfig.companyPageName || 'User'}</span>
              </button>
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-200 text-left">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #00C6FF 0%, #0068FF 100%)' }}>
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-[#050505] text-[15px]">Friends</span>
              </button>
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-200 text-left">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #23AFFC 0%, #0062E0 100%)' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M12 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-2 4a2 2 0 1 1 4 0 2 2 0 0 1-4 0z" /><path d="M.5 12C.5 5.649 5.649.5 12 .5S23.5 5.649 23.5 12 18.351 23.5 12 23.5.5 18.351.5 12z" /></svg>
                </div>
                <span className="font-medium text-[#050505] text-[15px]">Groups</span>
              </button>
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-200 text-left">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #73ABFF 0%, #0062E0 100%)' }}>
                  <Store className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-[#050505] text-[15px]">Marketplace</span>
              </button>
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-200 text-left">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #6BCCE3 0%, #137DC5 100%)' }}>
                  <PlayCircle className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-[#050505] text-[15px]">Watch</span>
              </button>
            </div>
          </div>

          {/* Center - Feed */}
          <div className="w-full max-w-[590px] px-4">
            {/* Facebook-style Ad Feed */}
            {creatives.length > 0 ? (
              <div className="space-y-4">
                {creatives.slice(0, 4).map((creative) => renderPublicCreative(creative))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No ads to display</p>
              </div>
            )}
          </div>

          {/* Right Sidebar - Hidden on mobile */}
          <div className="hidden xl:block w-[280px] pl-4 sticky top-16 h-fit">
            <div className="mb-4 px-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#65676B] font-semibold text-[17px]">Sponsored</span>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3 cursor-pointer hover:bg-gray-100 rounded-lg p-2 -mx-2">
                  <img 
                    src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=256&h=256&fit=crop" 
                    alt="Sponsored" 
                    className="w-32 h-32 rounded-lg flex-shrink-0 object-cover"
                  />
                  <div>
                    <p className="text-[13px] text-[#050505] font-medium">Grow Your Business</p>
                    <p className="text-[12px] text-[#65676B]">business.com</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-[#CED0D4] pt-4 px-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#65676B] font-semibold text-[17px]">Contacts</span>
                <div className="flex gap-2">
                  <button className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center">
                    <Search className="w-4 h-4 text-[#65676B]" />
                  </button>
                  <button className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center">
                    <MoreHorizontal className="w-4 h-4 text-[#65676B]" />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {[
                  { name: 'Sarah Wilson', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
                  { name: 'Michael Chen', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
                  { name: 'Emily Davis', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
                  { name: 'James Brown', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
                  { name: 'Lisa Anderson', img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop' },
                ].map((contact, i) => (
                  <button key={i} className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-200 text-left">
                    <div className="relative">
                      <img src={contact.img} alt={contact.name} className="w-9 h-9 rounded-full object-cover" />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#31A24C] rounded-full border-2 border-white"></span>
                    </div>
                    <span className="font-medium text-[#050505] text-[15px]">{contact.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form Dialog */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedCreative?.title || 'Get Started'}</DialogTitle>
            </DialogHeader>
            {submitted ? (
              <div className="text-center py-6">
                <p className="text-lg font-medium text-primary">{formConfig.successMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="form-name">Name</Label>
                  <Input
                    id="form-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-email">Email</Label>
                  <Input
                    id="form-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form-phone">Phone</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.countryCode}
                      onValueChange={(value) => setFormData({ ...formData, countryCode: value })}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue>
                          {countryCodes.find(c => c.code === formData.countryCode)?.flag} {formData.countryCode}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.flag} {c.code} {c.country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="form-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                      placeholder="Phone number"
                      className="flex-1"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Editor view
  return (
    <div className="w-full min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Form AI Configuration</h2>
          <p className="text-muted-foreground">Configure your Meta ads and lead capture settings</p>
        </div>

        {/* Configuration Card */}
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Page Name</Label>
            <Input
              id="company-name"
              value={formConfig.companyPageName}
              onChange={(e) => {
                const newName = e.target.value;
                setFormConfig({ ...formConfig, companyPageName: newName });
                onUpdateProperty('companyPageName', newName);
                // Update all existing creatives with the new name
                const updatedCreatives = creatives.map(c => ({ ...c, name: newName }));
                onUpdateProperty('creatives', updatedCreatives);
              }}
              placeholder="Your Company"
            />
            </div>

            <div className="space-y-2">
              <Label>Company Page Logo</Label>
              {formConfig.companyPageLogo ? (
                <div className="flex items-center gap-2">
                  <img src={formConfig.companyPageLogo} alt="Company" className="h-12 w-12 rounded-full object-cover" />
                  <Button variant="outline" size="sm" onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handlePageLogoUpload(file);
                    };
                    input.click();
                  }}>
                    Change
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    setFormConfig({ ...formConfig, companyPageLogo: null });
                    onUpdateProperty('companyPageLogo', null);
                  }}>
                    Remove
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" disabled={uploadingPageLogo} onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handlePageLogoUpload(file);
                  };
                  input.click();
                }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-url">Form Submission Webhook</Label>
            <Input
              id="webhook-url"
              type="url"
              value={formConfig.webhookUrl}
              onChange={(e) => {
                const newUrl = e.target.value;
                setFormConfig({ ...formConfig, webhookUrl: newUrl });
                onUpdateProperty('webhookUrl', newUrl);
                toast({ title: 'Saved', description: 'Webhook URL updated' });
              }}
              placeholder="https://your-webhook-endpoint.com"
            />
            <p className="text-xs text-muted-foreground">
              Form submissions will be sent to this endpoint
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="success-message">Success Message</Label>
            <Input
              id="success-message"
              value={formConfig.successMessage}
              onChange={(e) => {
                const newMessage = e.target.value;
                setFormConfig({ ...formConfig, successMessage: newMessage });
                onUpdateProperty('successMessage', newMessage);
                toast({ title: 'Saved', description: 'Success message updated' });
              }}
              placeholder="Thank you! Your information has been submitted."
            />
          </div>
        </Card>

        {/* Creatives Gallery */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Creative Gallery ({creatives.length}/4)</Label>
            <Button onClick={handleAddCreative} disabled={creatives.length >= 4}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Creative
            </Button>
          </div>

          <Card className="p-8">
            {creatives.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {creatives.map((creative, index) => (
                  <div key={creative.id} className="max-w-[500px]">
                    {renderCreative(creative, index)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg mb-2">No creatives yet</p>
                <p className="text-sm mb-4">Click "Add New Creative" to create your first Meta ad</p>
                <Button onClick={handleAddCreative}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Creative
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
