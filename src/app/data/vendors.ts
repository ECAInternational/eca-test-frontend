// src/app/data/vendors.ts
import type { Vendor } from '~/components/VendorCard';

// Changed to let to allow modification
let mockVendors: Vendor[] = [
  { id: '1', name: 'Acme Corp', status: 'Active', primaryContactName: 'John Doe', logoUrl: 'https://via.placeholder.com/100x40?text=Acme+Corp' },
  { id: '2', name: 'Beta Solutions', status: 'Inactive', primaryContactName: 'Jane Smith', logoUrl: 'https://via.placeholder.com/100x40?text=Beta+Sol' },
  { id: '3', name: 'Gamma Innovations', status: 'Active', primaryContactName: 'Mike Ross', logoUrl: 'https://via.placeholder.com/100x40?text=Gamma+Inc' },
  { id: '4', name: 'Delta Services', status: 'Pending', primaryContactName: 'Sarah Connor', logoUrl: 'https://via.placeholder.com/100x40?text=Delta+Co' },
  { id: '5', name: 'Epsilon Logistics', status: 'Active', primaryContactName: 'Bruce Wayne', logoUrl: 'https://via.placeholder.com/100x40?text=Epsilon' },
  { id: '6', name: 'Zeta Technologies', status: 'Active', primaryContactName: 'Clark Kent', logoUrl: 'https://via.placeholder.com/100x40?text=Zeta+Tech' },
];

// Simple ID generator (for mock purposes)
let nextId = mockVendors.length + 1;

export function getVendors(): Vendor[] {
  return mockVendors;
}

export function getVendorById(id: string): Vendor | undefined {
  return mockVendors.find(vendor => vendor.id === id);
}

export function addVendor(vendorData: Omit<Vendor, 'id'>): Vendor {
  const newVendor: Vendor = {
    id: String(nextId++),
    ...vendorData,
  };
  mockVendors.push(newVendor);
  return newVendor;
}

export function updateVendor(id: string, updates: Partial<Omit<Vendor, 'id'>>): Vendor | undefined {
  const vendorIndex = mockVendors.findIndex(vendor => vendor.id === id);
  if (vendorIndex === -1) {
    return undefined; // Vendor not found
  }
  const updatedVendor = {
    ...mockVendors[vendorIndex],
    ...updates,
  };
  mockVendors[vendorIndex] = updatedVendor;
  return updatedVendor;
}

export function deleteVendor(id: string): boolean {
  const initialLength = mockVendors.length;
  mockVendors = mockVendors.filter(vendor => vendor.id !== id);
  return mockVendors.length < initialLength; // Return true if a vendor was deleted
}

// Note: For a real app, operations like add, update, delete would interact with a database.
// Modifying the mockVendors array directly here won't persist changes across requests
// in a typical serverless environment if the module is re-initialized (e.g. on server restart in dev).
// However, for the duration of a session where the module remains in memory, changes will appear to persist.
