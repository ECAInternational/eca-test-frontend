import { Outlet } from '@remix-run/react';
import type { FC } from 'react';
import React from 'react';

const CasesLayout: FC = () => {
  return (
    <div className="flex h-full flex-col">
      <Outlet />
    </div>
  );
};

export default CasesLayout;
