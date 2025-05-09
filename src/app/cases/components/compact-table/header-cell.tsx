import type { PropsWithChildren, ThHTMLAttributes } from 'react';

export function HeaderCell(props: PropsWithChildren<ThHTMLAttributes<HTMLTableCellElement>>) {
  const { children, className = '', ...others } = props;
  return (
    <th
      className={`border-neutral-detail-palest label-sm-mid truncate border-y p-2.5 text-center first:rounded-tl-lg first:border-s first:ps-4 first:text-start last:rounded-tr-lg last:border-e ${className}`}
      {...others}
    >
      {children}
    </th>
  );
}