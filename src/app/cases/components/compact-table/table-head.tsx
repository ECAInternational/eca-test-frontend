import type { HTMLAttributes, PropsWithChildren } from 'react';

export function TableHead(props: PropsWithChildren<HTMLAttributes<HTMLTableSectionElement>>) {
  const { children, className = '', ...others } = props;
  return (
    <thead className={className} {...others}>
      {children}
    </thead>
  );
}