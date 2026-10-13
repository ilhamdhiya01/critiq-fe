import RealtimeProvider from "@/components/providers/RealtimeProvider";

// Every org page shares one realtime stream for the active org.
const OrgLayout = ({ children }: { children: React.ReactNode }) => {
  return <RealtimeProvider>{children}</RealtimeProvider>;
};

export default OrgLayout;
