import React from 'react';
import { For } from '@/components';
import { getFooterLinks } from '@/constants/footerLinks';
import { useDashboardMeta } from '@/hooks/query';

interface FooterLinkItemProps {
  title: string;
  link: string;
}

function FooterLinkItem({ title, link }: FooterLinkItemProps) {
  return (
    <div className="">
      <a href={link} target="_blank" rel="noopener noreferrer">
        {title}
      </a>
    </div>
  );
}

export default function DashboardFooter() {
  const { data: meta } = useDashboardMeta();
  const footerLinks = getFooterLinks((meta as any)?.rbooksSourceUrl);

  if (!footerLinks.length) return null;

  return (
    <div
      className="dashboard__footer"
      style={{
        position: 'fixed',
        right: 12,
        bottom: 4,
        zIndex: 10,
        fontSize: 11,
      }}
    >
      <div className="footer-links">
        <For render={FooterLinkItem} of={footerLinks} />
      </div>
    </div>
  );
}
