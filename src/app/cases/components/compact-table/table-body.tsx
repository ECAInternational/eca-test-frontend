import type { HTMLAttributes, PropsWithChildren } from 'react';

export function TableBody(props: PropsWithChildren<HTMLAttributes<HTMLTableSectionElement>>) {
  const { children, className = '', ...others } = props;
  return (
    <tbody className={className} {...others}>
      {children}
    </tbody>
  );
}