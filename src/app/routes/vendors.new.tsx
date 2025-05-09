// src/app/routes/vendors.new.tsx
import type { MetaFunction, ActionFunctionArgs } from '@remix-run/node';
import { Link, Form, useActionData, redirect } from '@remix-run/react';
import React from 'react';
import { addVendor } from '~/data/vendors';
import type { Vendor } from '~/components/VendorCard';

export const meta: MetaFunction = () => {
  return [{ title: 'Add New Vendor' }];
};

// Placeholder action function - in a real app, this would save to a database
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const vendorName = formData.get('vendorName') as string;
  const primaryContactName = formData.get('primaryContactName') as string;
  const status = formData.get('status') as Vendor['status'];

  console.log('New Vendor Data from form:', { vendorName, primaryContactName, status });

  // Basic validation example
  if (typeof vendorName !== 'string' || vendorName.trim().length === 0) {
    return { errors: { vendorName: 'Vendor name is required' }, values: { primaryContactName, status} }; // Pass back other values
  }

  // Call addVendor to actually add the vendor to our mock data
  try {
    const newVendor = addVendor({
      name: vendorName,
      primaryContactName: primaryContactName || undefined, // Handle empty string as undefined
      status: status || 'Pending', // Default status if not provided
      logoUrl: '', // Default empty logo, can be updated later
    });
    console.log('Successfully added vendor:', newVendor);
  } catch (error) {
    console.error('Error adding vendor:', error);
    // Potentially return an error to the UI
    return { errors: { form: 'Failed to add vendor. Please try again.' }, values: { vendorName, primaryContactName, status } };
  }

  return redirect('/vendors'); // Redirect back to the vendor list after submission
}

export default function NewVendorPage() {
  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors;
  const values = actionData?.values;

  return (
    <div className="p-8 bg-neutral-layer-1 min-h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-title">Add New Vendor</h1>
      </header>
      
      <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
        <Form method="post" className="space-y-6">
            <div>
              <label htmlFor="vendorName" className="block text-sm font-medium text-neutral-body-strong">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="vendorName"
                  id="vendorName"
                  className="block w-full shadow-sm sm:text-sm border-neutral-detail-strong rounded-md p-2 bg-neutral-layer-2 text-neutral-body placeholder-neutral-detail focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Acme Corp"
                  aria-describedby="vendorName-error"
                  defaultValue={values?.vendorName || ''} // Pre-fill on error
                  required
                />
              </div>
              {errors?.vendorName && (
                <p className="mt-1 text-sm text-red-600" id="vendorName-error">
                  {errors.vendorName}
                </p>
              )}
              {errors?.form && (
                <p className="mt-1 text-sm text-red-600" id="form-error">
                  {errors.form}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="primaryContactName" className="block text-sm font-medium text-neutral-body-strong">
                Primary Contact Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="primaryContactName"
                  id="primaryContactName"
                  className="block w-full shadow-sm sm:text-sm border-neutral-detail-strong rounded-md p-2 bg-neutral-layer-2 text-neutral-body placeholder-neutral-detail focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., John Doe"
                  defaultValue={values?.primaryContactName || ''} // Pre-fill on error
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-neutral-body-strong">
                Status
              </label>
              <div className="mt-1">
                <select
                  id="status"
                  name="status"
                  className="block w-full shadow-sm sm:text-sm border-neutral-detail-strong rounded-md p-2 bg-neutral-layer-2 text-neutral-body focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={values?.status || 'Pending'} // Pre-fill on error
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

          <div className="mt-8 pt-6 border-t border-neutral-detail-faintest flex items-center justify-end space-x-3">
            <Link
              to="/vendors"
              className="bg-neutral-layer-elevated-normal hover:bg-neutral-layer-elevated-hover border border-neutral-detail-strong text-neutral-body-strong font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md flex items-center space-x-2 transition-colors duration-200"
            >
              Save Vendor
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
