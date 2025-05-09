import React from 'react';
import { useNavigation } from '@remix-run/react';
import { Select } from '@ecainternational/eca-components';
import applicationData from '~/data/application-data.json';

type TenantSelectorProps = {
  selectedTenantId: string;
  onTenantChange?: (tenantId: string) => void;
};

export default function TenantSelector({ selectedTenantId, onTenantChange }: TenantSelectorProps) {
  const navigation = useNavigation();
  const isChangingTenant = navigation.state === "submitting" && 
    navigation.formData?.get("tenantId") !== selectedTenantId;

  return (
    <Select
      name="tenantId"
      value={selectedTenantId}
      onChange={(e) => {
        const newTenantId = e.currentTarget.value;
        onTenantChange?.(newTenantId);
      }}
      disabled={isChangingTenant}
      className={`!text-neutral-detail-boldest !w-full ${isChangingTenant ? 'opacity-50 cursor-wait' : ''}`}
      aria-label="Select tenant"
    >
      {applicationData.tenants.map(tenant => (
        <option key={tenant.tenantId} value={tenant.tenantId}>
          {tenant.tenantName}
        </option>
      ))}
    </Select>
  );
}