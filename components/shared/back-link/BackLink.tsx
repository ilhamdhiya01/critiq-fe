import Link from "next/link";
import React from "react";

import Icon from "@/components/ui/icon/Icon";

interface BackLinkProps {
  href: string;
  label: string;
}

const BackLink = React.memo(({ href, label }: BackLinkProps) => (
  <Link
    href={href}
    className="flex w-fit items-center gap-1.5 text-xs text-text-faint transition-colors hover:text-text-nav"
  >
    <Icon icon="TbChevronLeft" size={13} />
    {label}
  </Link>
));

BackLink.displayName = "BackLink";

export default BackLink;
