import type { Dispatch, FC, SetStateAction } from 'react';
import React from 'react';
import { TextInput } from '@ecainternational/eca-components';

interface DocumentsControlBarProps {
  setGlobalFilter: Dispatch<SetStateAction<string>>;
}

const DocumentsControlBar: FC<DocumentsControlBarProps> = ({ setGlobalFilter }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-4">
        <TextInput
          name="search"
          type="text"
          placeholder="Search documents..."
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGlobalFilter(e.target.value)}
          variant="tonal"
          icon="fi-rr-search"
          className="w-[300px]"
        />
      </div>
    </div>
  );
};

export default DocumentsControlBar;