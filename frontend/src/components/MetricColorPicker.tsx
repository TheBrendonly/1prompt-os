import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Paintbrush, Save } from '@/components/icons';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MetricColorPickerProps {
  clientId: string;
  metricName: string;
  currentColor: string;
  onColorChange: (color: string) => void;
}

const presetColors = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function MetricColorPicker({ 
  clientId, 
  metricName, 
  currentColor, 
  onColorChange 
}: MetricColorPickerProps) {
  const [color, setColor] = useState(currentColor);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Sync local state with prop changes
  useEffect(() => {
    setColor(currentColor);
  }, [currentColor]);

  const handleSaveColor = async () => {
    const now = new Date().toISOString();
    try {
      // Try update first (works without unique constraints)
      const { data: updated, error: updateError } = await supabase
        .from('metric_color_preferences')
        .update({ color, updated_at: now })
        .eq('client_id', clientId)
        .eq('metric_name', metricName)
        .select('id');

      if (updateError) throw updateError;

      if (!updated || updated.length === 0) {
        // Insert when no existing row
        const { error: insertError } = await supabase
          .from('metric_color_preferences')
          .insert({ client_id: clientId, metric_name: metricName, color, updated_at: now });
        if (insertError) throw insertError;
      }

      onColorChange(color);
      setOpen(false);
      toast({ title: 'Success', description: 'Metric color updated successfully.' });
    } catch (error) {
      console.error('Error saving color preference:', error);
      toast({ title: 'Error', description: 'Failed to update metric color.', variant: 'destructive' });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-background/80"
          onClick={(e) => e.stopPropagation()}
        >
          <Paintbrush className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end" side="top" sideOffset={5}>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-sm mb-2">Change Color</h4>
            <div className="flex gap-2">
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-2">Quick colors:</p>
            <div className="grid grid-cols-4 gap-2">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className="w-full h-8 rounded border-2 transition-all hover:scale-110"
                  style={{ 
                    backgroundColor: presetColor,
                    borderColor: color === presetColor ? '#000' : 'transparent'
                  }}
                  title={presetColor}
                />
              ))}
            </div>
          </div>

          <Button 
            onClick={handleSaveColor}
            className="w-full"
            size="sm"
          >
            <Save className="h-3 w-3 mr-1" />
            Save Color
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
