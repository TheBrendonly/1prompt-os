import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AttendeeAvatarProps {
  attendeeId?: string;
  displayName?: string;
  className?: string;
  onClick?: (e?: React.MouseEvent) => void;
}

export default function AttendeeAvatar({ attendeeId, displayName, className = "w-8 h-8", onClick }: AttendeeAvatarProps) {
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!attendeeId) return;
    loadPicture(attendeeId);
  }, [attendeeId]);

  const loadPicture = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/unipile-proxy?action=get-attendee-picture&attendee_id=${id}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (res.ok) {
        const blob = await res.blob();
        setPictureUrl(URL.createObjectURL(blob));
      }
    } catch {
      // silently fail - will show fallback
    }
  };

  const initials = displayName
    ? displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "";

  return (
    <Avatar
      className={`${className} shrink-0 ${onClick ? "cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all" : ""}`}
      onClick={onClick}
    >
      {pictureUrl && <AvatarImage src={pictureUrl} alt={displayName || "Profile"} />}
      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
        {initials || <User className="w-4 h-4" />}
      </AvatarFallback>
    </Avatar>
  );
}
