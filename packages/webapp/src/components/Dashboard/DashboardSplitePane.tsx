import * as FF from 'fp-ts/function';
import { debounce } from 'lodash';
import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import SplitPane from 'react-split-pane';
import { withDashboard } from '@/containers/Dashboard/withDashboard';
import { toggleExpendSidebar } from '@/store/dashboard/dashboard.actions';

// NBooks : sur téléphone, la barre latérale démarre repliée (icônes seulement).
const NB_PHONE_MAX_WIDTH = 768;

interface DashboardSplitPaneProps {
  sidebarExpended: boolean;
  children?: React.ReactNode;
}

interface SplitPaneWithChildrenProps {
  allowResize?: boolean;
  split?: 'vertical' | 'horizontal';
  minSize?: number | string;
  maxSize?: number | string;
  defaultSize?: number | string;
  size?: number | string;
  onChange?: (size: number) => void;
  className?: string;
  children?: React.ReactNode;
}

const SplitPaneComponent =
  SplitPane as unknown as React.ComponentType<SplitPaneWithChildrenProps>;

function DashboardSplitPane({
  sidebarExpended,
  children,
}: DashboardSplitPaneProps) {
  const initialSize = 220;
  const dispatch = useDispatch();
  useEffect(() => {
    if (window.innerWidth < NB_PHONE_MAX_WIDTH && sidebarExpended) {
      dispatch(toggleExpendSidebar(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [defaultSize, setDefaultSize] = useState(
    parseInt(localStorage.getItem('dashboard-size') || '', 10) || initialSize,
  );
  const debounceSaveSize = useRef(
    debounce((size: number) => {
      localStorage.setItem('dashboard-size', String(size));
    }, 500),
  );
  const handleChange = (size: number) => {
    debounceSaveSize.current(size);
    setDefaultSize(size);
  };
  return (
    <SplitPaneComponent
      allowResize={sidebarExpended}
      split="vertical"
      minSize={180}
      maxSize={300}
      defaultSize={sidebarExpended ? defaultSize : 50}
      size={sidebarExpended ? defaultSize : 50}
      onChange={handleChange}
      className="primary"
    >
      {children}
    </SplitPaneComponent>
  );
}

export default FF.pipe(
  DashboardSplitPane,
  withDashboard(({ sidebarExpended }) => ({ sidebarExpended })),
);
