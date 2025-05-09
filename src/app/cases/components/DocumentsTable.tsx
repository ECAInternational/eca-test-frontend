import type { Dispatch, SetStateAction } from 'react';
import React, { useState } from 'react';
import type { PaginationState } from '@tanstack/react-table';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { Select } from '@ecainternational/eca-components';
import { Pagination } from '../components/compact-table';
import { Link } from '@remix-run/react';

export interface Document {
  documentId: string;
  documentName: string;
  documentType: string;
  documentVersion: string;
  documentCreatedOn: string;
  documentStatus: string;
  caseName: string;
  caseId: string;
}

export interface DocumentsTableProps {
  globalFilter: string;
  setGlobalFilter: Dispatch<SetStateAction<string>>;
  documents: Document[];
}

const getStatusIconColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'draft':
      return 'text-visualisation-1-main';
    case 'pending approval':
      return 'text-visualisation-5-main';
    case 'approved':
      return 'text-visualisation-3-main';
    case 'rejected':
      return 'text-visualisation-4-main';
    default:
      return 'text-visualisation-1-main';
  }
};

const DocumentsTable: React.FC<DocumentsTableProps> = (props) => {
  const { globalFilter, setGlobalFilter, documents } = props;
  const { t } = useTranslation();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columnHelper = createColumnHelper<Document>();

  const columns = [
    columnHelper.accessor('documentName', {
      header: () => t('Document Name'),
      cell: (info) => {
        const document = info.row.original;
        return (
          <Link
            to={`/cases/case-documents/${document.documentId}`}
            className="text-neutral-body hover:text-primary-main label-sm-mid flex items-center gap-2"
          >
            {document.documentName}
          </Link>
        );
      },
    }),
    columnHelper.accessor('documentType', {
      header: () => t('Type'),
      cell: (info) => {
        const documentType = info.getValue();
        return (
          <div className="paragraph-sm-mid flex items-center gap-2">
            <span className="paragraph-sm-mid">{documentType}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('documentStatus', {
      header: () => t('Status'),
      cell: (info) => {
        const status = info.getValue();
        return (
          <div className="paragraph-sm-mid flex items-center gap-2">
            <i className={`fi fi-ss-circle ${getStatusIconColor(status)} flex`}></i>
            <span className="paragraph-sm-mid">{status}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('caseName', {
      header: () => t('Case'),
      cell: (info) => {
        const caseName = info.getValue();
        return (
          <div className="paragraph-sm-mid flex items-center gap-2">
            <span className="paragraph-sm-mid">{caseName}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('documentVersion', {
      header: () => t('Version'),
      cell: (info) => {
        const documentVersion = info.getValue();
        return (
          <div className="paragraph-sm-mid flex items-center gap-2">
            <span className="paragraph-sm-mid">{documentVersion}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor('documentCreatedOn', {
      header: () => t('Created On'),
      cell: (info) => {
        const documentCreatedOn = info.getValue();
        return (
          <div className="paragraph-sm-mid flex items-center gap-2">
            <span className="paragraph-sm-mid">{new Date(documentCreatedOn).toLocaleDateString()}</span>
          </div>
        );
      },
    }),
  ];
  const table = useReactTable({
    data: documents,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getFilteredRowModel: getFilteredRowModel(),
    autoResetPageIndex: true,
    enableGlobalFilter: true,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      pagination,
      globalFilter,
    },
  });

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full overflow-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="border-controls-lines-paler bg-neutral-layer-2 text-neutral-detail-bolder border-y text-left">
              {table.getHeaderGroups().map((headerGroup) => (
                headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="label-sm-heavier whitespace-nowrap px-4 py-3"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))
              ))}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => {
              const visibleCells = row.getVisibleCells();
              return (
                <tr
                  key={row.id}
                  className="border-controls-lines-paler hover:bg-neutral-layer-2 border-b transition-colors"
                >
                  {visibleCells.map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between">
        <Pagination table={table} />
        <Select
          name="pageSize"
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            table.setPageSize(Number(e.target.value));
          }}
          variant="tonal"
          className="!label-sm-mid !text-neutral-detail-boldest py-px"
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              {pageSize} {t('per page')}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default DocumentsTable;
