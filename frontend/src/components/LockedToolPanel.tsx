import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lock } from "@/components/icons";

interface LockedToolPanelProps {
  toolName: string;
}

export default function LockedToolPanel({ toolName }: LockedToolPanelProps) {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();

  return (
    <div className="relative flex flex-col h-[calc(100vh-8rem)]">
      {/* Blurred background to simulate workspace */}
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] z-10" />

      {/* Lock overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center groove-border">
            <Lock className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2
            className="text-foreground font-medium"
            style={{ fontSize: "22px", fontFamily: "'VT323', monospace" }}
          >
            {toolName} IS LOCKED
          </h2>
          <p
            className="text-muted-foreground max-w-sm"
            style={{ fontSize: "13px", fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Please go to Credentials and set up the connection to unlock this tool.
          </p>
          <Button
            onClick={() => navigate(`/client/${clientId}/credentials`)}
            className="mt-2 font-medium"
          >
            Complete Setup
          </Button>
        </div>
      </div>
    </div>
  );
}
