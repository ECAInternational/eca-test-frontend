import type { HTMLAttributes } from 'react';

export interface RowProps extends HTMLAttributes<HTMLTableRowElement> {
  selectable?: boolean;
}
export function Row(props: RowProps) {
  const { children, className = '', selectable = false, ...others } = props;
  const selection =
    'group/selectable-row hover:border-controls-highlight-pale hover:bg-controls-highlight-palest hover:shadow-row-highlight hover:shadow-controls-highlight-pale  focus-visible:border-controls-highlight-pale focus-visible:bg-controls-highlight-palest focus-visible:shadow-row-highlight focus-visible:shadow-controls-highlight-pale cursor-pointer';
  return (
    <tr
      className={`text-neutral-detail-boldest odd:bg-controls-tr-odd-layer1 even:bg-controls-tr-even-layer1 outline outline-0 ${
        selectable ? selection : null
      } ${className}`}
      tabIndex={selectable ? 0 : undefined}
      {...others}
    >
      {children}
    </tr>
  );
}