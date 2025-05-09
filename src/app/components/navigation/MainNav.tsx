import { Link } from '@remix-run/react';
import type { FC } from 'react';
import React from 'react';

type Tenant = {
  tenantId: string;
  tenantName: string;
  cases: Array<{
    caseId: string;
    caseName: string;
    documents: Array<{
      documentId: string;
      documentName: string;
      documentType: string;
      documentVersion: string;
      documentCreatedOn: string;
      documentContent: string;
      templateId: string;
      documentStatus: string;
    }>;
  }>;
};

type MainNavProps = {
  selectedTenant: Tenant;
};

const MainNav: FC<MainNavProps> = ({ selectedTenant }) => {
  return (
    <nav id="main-nav" aria-label="Main" className="flex h-full flex-col duration-300 ease-in-out">
      <ol className="grow flex flex-col gap-3 overflow-hidden p-4">
        <li className="flex flex-col justify-between">
          <div className="menuItem relative">
            <Link
              to="/cases/case-documents"
              className="text-neutral-body link selected:bg-controls-element-tonal hover:bg-controls-element-tonal-hover focus-visible:border-controls-highlight flex min-h-5 w-full items-center rounded-md px-3 py-2.5"
              aria-label="Documents"
            >
              <div className="flex w-full items-center gap-3">
                <div className="my-1 ml-1 size-4 text-neutral-detail">
                  <i className="fi fi-rr-document flex" />
                </div>
                <div className="flex flex-1 items-center">
                  <div className="flex-1 text-nowrap text-left text-neutral-body">Documents</div>
                </div>
              </div>
            </Link>
          </div>
        </li>
        {/* START: New Vendor Link */}
        <li className="flex flex-col justify-between">
          <div className="menuItem relative">
            <Link
              to="/vendors"
              className="text-neutral-body link selected:bg-controls-element-tonal hover:bg-controls-element-tonal-hover focus-visible:border-controls-highlight flex min-h-5 w-full items-center rounded-md px-3 py-2.5"
              aria-label="Vendors"
            >
              <div className="flex w-full items-center gap-3">
                <div className="my-1 ml-1 size-4 text-neutral-detail">
                  <i className="fi fi-rr-briefcase flex" /> {/* Using Flaticon briefcase */}
                </div>
                <div className="flex flex-1 items-center">
                  <div className="flex-1 text-nowrap text-left text-neutral-body">Vendors</div>
                </div>
              </div>
            </Link>
          </div>
        </li>
        {/* END: New Vendor Link */}
        <li className="mt-4">
          <div className="px-3">
            <div className="label-xs-heavier text-neutral-detail">Settings</div>
          </div>
        </li>

        <li className="flex flex-col justify-between">
          <div className="menuItem relative">
            <Link
              to="/templates"
              className="text-neutral-body link selected:bg-controls-element-tonal hover:bg-controls-element-tonal-hover focus-visible:border-controls-highlight flex min-h-5 w-full items-center rounded-md px-3 py-2.5"
              aria-label="Templates"
            >
              <div className="flex w-full items-center gap-3">
                <div className="my-1 ml-1 size-4 text-neutral-detail">
                  <i className="fi fi-rr-file-edit flex" />
                </div>
                <div className="flex flex-1 items-center">
                  <div className="flex-1 text-nowrap text-left text-neutral-body">Templates</div>
                </div>
              </div>
            </Link>
          </div>
        </li>
      </ol>
      <div className="mt-auto">
        <div className="border-neutral-detail-palest flex h-16 shrink-0 items-center justify-center border-t">
          <img className="mx-auto h-10 w-auto p-1" src="/prototype/expert-logo.png" alt="eca-expert logo" />
        </div>
      </div>
    </nav>
  );
};

export default MainNav;
