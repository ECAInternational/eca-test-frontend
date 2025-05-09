import type { HTMLAttributes, PropsWithChildren } from 'react';

export function Table(props: PropsWithChildren<HTMLAttributes<HTMLTableElement>>) {
  const { children, className = '', ...others } = props;
  return (
    <table className={`w-full table-fixed border-separate border-spacing-0 ${className}`} {...others}>
      {children}
    </table>
  );
}