import type { PropsWithChildren, TdHTMLAttributes } from 'react';

export function Cell(props: PropsWithChildren<TdHTMLAttributes<HTMLTableCellElement>>) {
  const { children, className = '', ...others } = props;
  return (
    <td
      className={`border-neutral-detail-palest/50 paragraph-sm-mid group-hover/selectable-row:border-controls-highlight-pale group-focus-visible/selectable-row:border-controls-highlight-pale truncate border-b p-2.5 text-center first:border-s first:ps-4 first:text-start last:border-e ${className}`}
      {...others}
    >
      {children}
    </td>
  );
}