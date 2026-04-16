import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, CheckCircle, AlertCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";

interface ConfigItem {
  name: string;
  isConfigured: boolean;
  description: string;
  scrollToId?: string;
}

interface ConfigStatusBarProps {
  configs: ConfigItem[];
}

export function ConfigStatusBar({ configs }: ConfigStatusBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const { clientId } = useParams();

  // Derive status directly from configs to avoid flickering
  const allConfigured = configs.every(config => config.isConfigured);
  const someConfigured = configs.some(config => config.isConfigured);

  const getStatusColor = () => {
    if (allConfigured) return "border-green-500/30 bg-green-500/10";
    if (someConfigured) return "border-amber-500/30 bg-amber-500/10";
    return "border-red-500/30 bg-red-500/10";
  };

  const getStatusText = () => {
    if (allConfigured) return "APIs and Webhooks Configured";
    if (someConfigured) return "Partial Configuration";
    return "Configuration Required";
  };

  const handleConfigureClick = (scrollToId?: string) => {
    navigate(`/client/${clientId}/api`);
    
    if (scrollToId) {
      setTimeout(() => {
        const element = document.getElementById(scrollToId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 2000);
        }
      }, 100);
    }
  };

  return (
    <Card className={`material-surface border-2 mb-6 transition-all ${getStatusColor()}`}>
      <CardContent className="py-3">
        {/* Collapsed View */}
        <div className="flex items-center justify-between">
          <p className="font-medium text-foreground [font-size:13px]">{getStatusText()}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 [font-size:13px]"
          >
            {isExpanded ? "Hide details" : "See more"}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="mt-4 space-y-3 pt-3 border-t border-foreground/20">
            {configs.map((config, index) => (
              <div 
                key={index} 
                onClick={() => handleConfigureClick(config.scrollToId)}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 flex-1">
                  {config.isConfigured ? (
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-foreground [font-size:13px]">{config.name}</p>
                    <p className="text-muted-foreground [font-size:13px]">{config.description}</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
