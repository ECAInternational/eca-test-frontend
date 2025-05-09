import type { HTMLAttributes, PropsWithChildren } from 'react';

export function HeaderRow(props: PropsWithChildren<HTMLAttributes<HTMLTableRowElement>>) {
  const { children, className = '', ...others } = props;
  return (
    <tr className={`bg-neutral-layer-2 text-neutral-detail-boldest ${className}`} {...others}>
      {children}
    </tr>
  );
}