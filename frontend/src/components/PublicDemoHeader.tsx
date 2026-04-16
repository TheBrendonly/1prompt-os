interface PublicDemoHeaderProps {
  logoUrl?: string;
}

export default function PublicDemoHeader({ logoUrl }: PublicDemoHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-center px-8">
        {logoUrl && (
          <div className="flex items-center">
            <img
              src={logoUrl}
              alt="Client Logo"
              className="h-10 w-auto object-contain max-w-[200px]"
            />
          </div>
        )}
      </div>
    </header>
  );
}
