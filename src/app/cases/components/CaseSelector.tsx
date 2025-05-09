import React from 'react';
import { Form, useSubmit } from '@remix-run/react';
import { Select } from '@ecainternational/eca-components';
import type { Case } from '~/types/template';

interface CaseSelectorProps {
  selectedCase: Case;
  cases: Case[];
}

export default function CaseSelector({ selectedCase, cases }: CaseSelectorProps) {
  const submit = useSubmit();

  return (
    <Form method="post" className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-neutral-body">Case:</span>
        <div className="w-full">
          <Select
            name="caseId"
            value={selectedCase.caseId}
            onChange={(e) => {
              const form = e.currentTarget.form;
              if (form) {
                submit(form, { method: 'post', action: '.' });
              }
            }}
          >
            {cases.map((c) => (
              <option key={c.caseId} value={c.caseId}>
                {c.caseName}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </Form>
  );
}
