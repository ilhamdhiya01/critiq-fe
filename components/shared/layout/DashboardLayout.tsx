import React from "react";

import OrgSetupBanner from "@/components/shared/org-setup-banner";
import { APP_CONTENT_ID } from "@/const/layout.constant";

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
        <div id={APP_CONTENT_ID} className="flex min-w-0 flex-1 flex-col">
          <Navbar title={title} />
          {/* --main-pad is also read by PR detail's sticky bar and diff headers
              to pin flush under the navbar. */}
          <main className="container mx-auto min-h-0 flex-1 overflow-y-auto p-(--main-pad) [--main-pad:1rem] sm:[--main-pad:1.5rem]">
            <OrgSetupBanner />
            {children}
          </main>
        </div>
      </div>
    );
  },
);

DashboardLayout.displayName = "DashboardLayout";

export default DashboardLayout;
