// Tailwind's `lg`: the sidebar is a drawer below it, docked from it up.
export const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";
// Tailwind's `sm`.
export const SM_UP_MEDIA_QUERY = "(min-width: 640px)";

export const SIDEBAR_ID = "app-sidebar";

// The content column beside the sidebar; inert while the mobile drawer is
// open so focus stays in the drawer.
export const APP_CONTENT_ID = "app-content";

// PR detail's compact sticky bar. File headers in the diff pin right below
// it, so both read this one value.
export const PR_STICKY_BAR_HEIGHT_PX = 60;
