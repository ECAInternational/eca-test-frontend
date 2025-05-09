import type { Table } from '@tanstack/react-table';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export function Pagination<T>({
  table,
  boundaryCount = 1,
  siblingCount = 1,
}: {
  table: Table<T>;
  boundaryCount?: number;
  siblingCount?: number;
}) {
  const { t } = useTranslation();
  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  };
  const page = pageIndex + 1;
  const startPages = range(1, Math.min(boundaryCount, pageCount));
  const endPages = range(Math.max(pageCount - boundaryCount + 1, boundaryCount + 1), pageCount);

  const siblingsStart = Math.max(
    Math.min(
      // Natural start
      page - siblingCount,
      // Lower boundary when page is high
      pageCount - boundaryCount - siblingCount * 2 - 1,
    ),
    // Greater than startPages
    boundaryCount + 2,
  );

  const siblingsEnd = Math.min(
    Math.max(
      // Natural end
      page + siblingCount,
      // Upper boundary when page is low
      boundaryCount + siblingCount * 2 + 2,
    ),
    // Less than endPages
    pageCount - boundaryCount - 1,
  );

  // Boundaries between start/end pages and siblings
  const startBoundary = boundaryCount + 1;
  const endBoundary = pageCount - boundaryCount;

  const showStartEllipsis = siblingsStart > boundaryCount + 2;
  const showStartBoundary = showStartEllipsis ? false : startBoundary < endBoundary;

  const siblings = range(siblingsStart, siblingsEnd);

  const showEndEllipsis = siblingsEnd < pageCount - boundaryCount - 1;
  const showEndBoundary = showEndEllipsis ? false : endBoundary > boundaryCount;

  // Basic list of items to render
  // for example itemList = [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]
  const itemList = [
    ...startPages,
    ...(showStartEllipsis ? ['start-ellipsis'] : []),
    ...(showStartBoundary ? [startBoundary] : []),
    ...siblings,
    ...(showEndEllipsis ? ['end-ellipsis'] : []),
    ...(showEndBoundary ? [endBoundary] : []),

    ...endPages,
  ];

  return (
    <div className="flex">
      {pageCount === 1 ? null : (
        <>
          <PaginationButton
            name="previousPage"
            aria-label={t('Go to previous page')}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <i className="fi fi-rr-angle-small-left flex" />
          </PaginationButton>
          {itemList.map((item) => {
            return item === 'start-ellipsis' || item === 'end-ellipsis' ? (
              <div
                key={item}
                className="text-neutral-detail-bold label-sm-mid m-0.5 flex size-8 items-center justify-center rounded"
              >
                <i className="fi fi-rr-menu-dots mt-3 flex" />
              </div>
            ) : (
              <PaginationButton
                key={item}
                name={`goToPage${item}`}
                aria-label={`${t('Go to page')} ${item}`}
                onClick={() => table.setPageIndex((item as number) - 1)}
                selected={(item as number) - 1 === pageIndex}
              >
                {item}
              </PaginationButton>
            );
          })}
          <PaginationButton
            name="nextPage"
            aria-label={t('Go to next page')}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <i className="fi fi-rr-angle-small-right flex" />
          </PaginationButton>
        </>
      )}
    </div>
  );
}

export interface PaginationButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  name: string;
  id?: string;
  children: ReactNode;
  className?: string;
  selected?: boolean;
}

export function PaginationButton(props: PaginationButtonProps) {
  const { name, id, children, className = '', selected, ...others } = props;
  return (
    <button
      id={id || name}
      name={name}
      className={`text-neutral-detail-bold label-sm-mid m-0.5 flex size-8 items-center justify-center rounded border outline-1 outline-offset-1 focus:outline-none ${
        selected
          ? 'border-controls-highlight bg-states-info-palest text-neutral-detail-bolder'
          : 'border-neutral-detail-palest hover:border-neutral-detail-paler hover:outline-neutral-detail-paler focus-visible:border-controls-highlight focus-visible:text-controls-highlight focus-visible:outline-controls-highlight hover:outline disabled:pointer-events-none disabled:opacity-50'
      } ${className}`}
      type="button"
      aria-current={selected ? 'page' : undefined}
      {...others}
    >
      {children}
    </button>
  );
}