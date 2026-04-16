import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from '@/providers/AuthProvider'

// Creator Mode: double-click any blurred element to temporarily reveal it
document.addEventListener('dblclick', (e) => {
  const target = (e.target as HTMLElement).closest('.creator-blur, .creator-blur-heavy');
  if (target && !target.classList.contains('creator-revealed')) {
    target.classList.add('creator-revealed');
  }
});

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
