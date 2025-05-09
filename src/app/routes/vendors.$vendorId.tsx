// src/app/routes/vendors.$vendorId.tsx
import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node'; 
import { useLoaderData, Link, Form } from '@remix-run/react'; 
import React from 'react';
import type { Vendor } from '~/components/VendorCard'; 
import { getVendorById, deleteVendor } from '~/data/vendors'; 

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: data?.vendor ? `Vendor: ${data.vendor.name}` : 'Vendor Not Found' }];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const vendorId = params.vendorId;
  const vendor = getVendorById(vendorId ?? '');

  if (!vendor) {
    throw new Response("Vendor Not Found", { status: 404 });
  }
  return json({ vendor });
}

// Placeholder action for delete (will be fleshed out later)
export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'delete') {
    const vendorId = params.vendorId;
    if (!vendorId) {
      // This should not happen if the form is set up correctly
      throw new Response("Vendor ID missing for delete action", { status: 400 });
    }
    console.log(`Attempting to delete vendor with ID: ${vendorId}`);
    
    try {
      const success = deleteVendor(vendorId);
      if (success) {
        console.log(`Vendor ${vendorId} deleted successfully (mocked).`);
      } else {
        // This might happen if the vendor was already deleted or ID is wrong
        // Though getVendorById in loader should prevent access to non-existent vendors
        console.warn(`Failed to delete vendor ${vendorId} (mocked - perhaps not found).`);
        // Optionally, you could return an error to the UI here instead of redirecting,
        // but for a delete action, redirecting to a list is common.
      }
    } catch (error) {
      console.error('Error during mock deletion:', error);
      // Handle error, perhaps return a message to the UI
      // For now, we'll still attempt to redirect
    }

    return redirect('/vendors'); // Redirect to vendor list after attempting delete
  }

  // Handle other intents or throw an error if intent is unknown
  return json({ error: 'Invalid intent' }, { status: 400 });
}


export default function VendorDetailPage() {
  const { vendor } = useLoaderData<typeof loader>();

  const getStatusColor = (status: Vendor['status']) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8 bg-neutral-layer-1 min-h-full">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-title">
          {vendor.name}
        </h1>
        <div className="flex space-x-3">
          <Link
            to={`/vendors/${vendor.id}/edit`}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
          >
            Edit
          </Link>
          <Form method="post" onSubmit={(event) => {
            if (!confirm(`Are you sure you want to delete ${vendor.name}?`)) {
              event.preventDefault();
            }
          }}>
            <input type="hidden" name="intent" value="delete" />
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
            >
              Delete
            </button>
          </Form>
        </div>
      </header>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            {vendor.logoUrl ? (
              <img src={vendor.logoUrl} alt={`${vendor.name} logo`} className="h-20 w-auto object-contain rounded border border-neutral-detail-pale mb-4" />
            ) : (
              <div className="h-20 w-full bg-neutral-layer-2 rounded flex items-center justify-center text-neutral-detail-strong mb-4 text-sm">
                No Logo Available
              </div>
            )}
          </div>
          <div className="md:col-span-2 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-neutral-body-subtle">Vendor ID</h3>
              <p className="text-neutral-body-strong">{vendor.id}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-body-subtle">Status</h3>
              <p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(vendor.status)}`}>
                  {vendor.status}
                </span>
              </p>
            </div>
            {vendor.primaryContactName && (
              <div>
                <h3 className="text-sm font-medium text-neutral-body-subtle">Primary Contact</h3>
                <p className="text-neutral-body-strong">{vendor.primaryContactName}</p>
              </div>
            )}
             {/* Add more fields as needed */}
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-neutral-detail-faintest">
          <Link to="/vendors" className="text-blue-600 hover:text-blue-800 font-medium">
            &larr; Back to Vendor List
          </Link>
        </div>
      </div>
    </div>
  );
}
