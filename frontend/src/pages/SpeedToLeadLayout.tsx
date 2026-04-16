import { useParams, useNavigate, useLocation, Outlet } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePageHeader } from '@/contexts/PageHeaderContext';

export default function SpeedToLeadLayout() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isContacts = location.pathname.includes('/contacts');
  const currentTab = isContacts ? 'contacts' : 'dashboard';

  usePageHeader({
    title: 'Speed to Lead',
    breadcrumbs: [
      { label: isContacts ? 'Contacts' : 'Dashboard' },
    ],
  });

  const handleTabChange = (value: string) => {
    const basePath = `/client/${clientId}/speed-to-lead`;
    navigate(value === 'contacts' ? `${basePath}/contacts` : `${basePath}/dashboard`);
  };

  const tabStyle = { height: '38px', fontFamily: "'VT323', monospace", fontSize: '18px' };

  return (
    <div className="container mx-auto max-w-7xl space-y-6">
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="w-full" style={{ height: '42px' }}>
          <TabsTrigger value="dashboard" className="flex-1 uppercase" style={tabStyle}>Dashboard</TabsTrigger>
          <TabsTrigger value="contacts" className="flex-1 uppercase" style={tabStyle}>Contacts</TabsTrigger>
        </TabsList>
      </Tabs>
      <Outlet />
    </div>
  );
}
