import ActiveOrgProvider from "@/components/providers/ActiveOrgProvider";
import RealtimeProvider from "@/components/providers/RealtimeProvider";

// The org comes from the slug; every org page shares one realtime stream.
const OrgLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ActiveOrgProvider>
      <RealtimeProvider>{children}</RealtimeProvider>
    </ActiveOrgProvider>
  );
};

export default OrgLayout;
