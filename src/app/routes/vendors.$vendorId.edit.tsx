// src/app/routes/vendors.$vendorId.edit.tsx
import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Link, Form, useLoaderData, useActionData } from '@remix-run/react';
import React from 'react';
import type { Vendor } from '~/components/VendorCard';
import { getVendorById, updateVendor } from '~/data/vendors'; // Import the function to get a vendor and updateVendor

// Define an interface for the action data, especially errors
interface ActionData {
  errors?: {
    vendorName?: string;
    form?: string;
  };
  vendor?: Vendor; // To pre-fill form on error
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: data?.vendor ? `Edit: ${data.vendor.name}` : 'Vendor Not Found' }];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const vendorId = params.vendorId;
  if (!vendorId) {
    throw new Response("Vendor ID missing", { status: 400 });
  }
  const vendor = getVendorById(vendorId);
  if (!vendor) {
    throw new Response("Vendor Not Found", { status: 404 });
  }
  return json({ vendor });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const vendorId = params.vendorId;
  if (!vendorId) {
    throw new Response("Vendor ID missing for action", { status: 400 });
  }

  const formData = await request.formData();
  const vendorName = formData.get('vendorName');
  const primaryContactName = formData.get('primaryContactName');
  const status = formData.get('status') as Vendor['status'];

  console.log('Updating Vendor Data:', { vendorId, vendorName, primaryContactName, status });

  if (typeof vendorName !== 'string' || vendorName.trim().length === 0) {
    const currentVendor = getVendorById(vendorId); // Re-fetch for form prefill on error
    return json<ActionData>({ errors: { vendorName: 'Vendor name is required' }, vendor: currentVendor }, { status: 400 });
  }

  // --- Actual Update using updateVendor ---
  try {
    const updated = updateVendor(vendorId, {
      name: vendorName,
      primaryContactName: primaryContactName as string || undefined,
      status: status,
      // logoUrl is not on this form, so it won't be updated here
    });

    if (!updated) {
      // This case should ideally be caught by the loader, but as a safeguard:
      const currentVendor = getVendorById(vendorId);
      return json<ActionData>({ errors: { form: 'Failed to find vendor to update.' }, vendor: currentVendor }, { status: 404 });
    }
    console.log(`Vendor ${vendorId} data updated:`, updated);
  } catch (error) {
    console.error('Error updating vendor:', error);
    const currentVendor = getVendorById(vendorId);
    return json<ActionData>({ errors: { form: 'An unexpected error occurred while updating.' }, vendor: currentVendor }, { status: 500 });
  }
  // --- End of Actual Update ---
  
  return redirect(`/vendors/${vendorId}`); // Redirect back to the vendor detail page
}

export default function EditVendorPage() {
  // useLoaderData provides data from the loader function
  // useActionData provides data from the action function (e.g., validation errors)
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>(); // Use the explicit ActionData type
  
  // If actionData exists (e.g., on validation error), and it includes vendor data (re-fetched on error),
  // use that. Otherwise, use the vendor data from the loader.
  const vendor = actionData?.vendor || loaderData.vendor;
  const errors = actionData?.errors;

  return (
    <div className="p-8 bg-neutral-layer-1 min-h-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-title">Edit: {vendor.name}</h1>
      </header>
      
      <div className="bg-white shadow-md rounded-lg p-6 max-w-2xl mx-auto">
        <Form method="post" className="space-y-6" key={vendor.id}> {/* Add key to reset form state if vendor changes */}
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
                  defaultValue={vendor.name}
                  aria-invalid={errors?.vendorName ? true : undefined}
                  aria-describedby="vendorName-error"
                  required
                />
              </div>
              {errors?.vendorName && (
                <p className="mt-1 text-sm text-red-600" id="vendorName-error">
                  {errors.vendorName}
                </p>
              )}
              {/* Added a general form error display */}
              {errors?.form && (
                <p className="mt-2 text-sm text-red-600" id="form-error">
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
                  defaultValue={vendor.primaryContactName || ''}
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
                  defaultValue={vendor.status}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

          <div className="mt-8 pt-6 border-t border-neutral-detail-faintest flex items-center justify-end space-x-3">
            <Link
              to={`/vendors/${vendor.id}`}
              className="bg-neutral-layer-elevated-normal hover:bg-neutral-layer-elevated-hover border border-neutral-detail-strong text-neutral-body-strong font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md flex items-center space-x-2 transition-colors duration-200"
            >
              Save Changes
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
