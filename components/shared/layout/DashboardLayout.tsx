import React from "react";

import Navbar from "./navbar";
import Sidebar from "./sidebar";

interface DashboardLayoutProps {
  title: string;
  children?: React.ReactNode;
}

// Stays a server component: `children` is rendered on the server even though
// Sidebar is a client island, so page content never gets pulled into the
// client bundle by this wrapper.
const DashboardLayout = React.memo(
  ({ title, children }: DashboardLayoutProps) => {
    return (
      <div className="fixed inset-0 flex overflow-hidden bg-background font-sans text-[13px] text-text-strong">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar title={title} />
          <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    );
  },
);

DashboardLayout.displayName = "DashboardLayout";

export default DashboardLayout;
