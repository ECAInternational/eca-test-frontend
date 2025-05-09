// src/app/routes/vendors._index.tsx
import type { MetaFunction } from '@remix-run/node';
import React, { useState } from 'react'; 
import VendorCard, { type Vendor } from '~/components/VendorCard'; 
import { PlusCircleIcon, SearchIcon, List, LayoutGrid, Edit3, Eye, Briefcase, CheckCircle, XCircle, Clock, Filter, UserCircle } from 'lucide-react'; 
import { Link } from '@remix-run/react'; 
import { getVendors } from '~/data/vendors'; 

export const meta: MetaFunction = () => {
  return [{ title: 'Vendor Management' }];
};

const statusConfig = {
  Active: {
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: <CheckCircle size={14} className="mr-1" />
  },
  Inactive: {
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: <XCircle size={14} className="mr-1" />
  },
  Pending: {
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    icon: <Clock size={14} className="mr-1" />
  }
};

export default function VendorListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card'); 
  const allVendors = getVendors(); 

  const filteredVendors = allVendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vendor.primaryContactName && vendor.primaryContactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    vendor.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 bg-neutral-50 min-h-full">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-800">Vendors</h1>
            <p className="text-sm text-neutral-500 mt-1">Manage your company's vendors and supplier relationships</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            {/* Search Input */}
            <div className="relative w-full md:w-auto">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="search"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full md:w-64 border border-neutral-200 rounded-lg bg-white text-neutral-700 placeholder-neutral-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              />
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-neutral-200 p-0.5 bg-white shadow-sm">
              <button 
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'card' ? 'bg-blue-50 shadow-sm text-blue-600' : 'text-neutral-500 hover:bg-neutral-50'}`}
                aria-label="Card View"
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-blue-50 shadow-sm text-blue-600' : 'text-neutral-500 hover:bg-neutral-50'}`}
                aria-label="List View"
              >
                <List size={18} />
              </button>
            </div>
            
            {/* Add New Vendor Button */}
            <Link
              to="/vendors/new"
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all text-sm whitespace-nowrap"
            >
              <PlusCircleIcon size={18} className="mr-1.5" />
              Add Vendor
            </Link>
          </div>
        </div>
      </header>

      {filteredVendors.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-neutral-100">
          {searchTerm ? (
            <>
              <SearchIcon size={40} className="mx-auto text-neutral-300 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-700 mb-2">No Matching Vendors</h3>
              <p className="text-neutral-500 max-w-md mx-auto">
                No vendors match your search "{searchTerm}". Try different keywords or clear your search.
              </p>
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Clear Search
              </button>
            </>
          ) : (
            <>
              <Briefcase size={40} className="mx-auto text-neutral-300 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-700 mb-2">No Vendors Yet</h3>
              <p className="text-neutral-500 max-w-md mx-auto">
                You haven't added any vendors to your system yet. Add your first vendor to get started.
              </p>
              <Link
                to="/vendors/new"
                className="mt-4 inline-flex items-center text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-4 py-2 shadow-sm"
              >
                <PlusCircleIcon size={16} className="mr-1.5" />
                Add Your First Vendor
              </Link>
            </>
          )}
        </div>
      )}

      {filteredVendors.length > 0 && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-neutral-500">
              Showing <span className="font-medium text-neutral-700">{filteredVendors.length}</span> {filteredVendors.length === 1 ? 'vendor' : 'vendors'}
              {searchTerm && <span> matching "<span className="font-medium">{searchTerm}</span>"</span>}
            </p>
          </div>
          
          {/* Card View */}
          {viewMode === 'card' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVendors.map((vendor) => (
                <VendorCard key={vendor.id} vendor={vendor} />
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-neutral-100">
              <table className="min-w-full divide-y divide-neutral-100">
                <thead>
                  <tr className="bg-neutral-50">
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Vendor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Contact</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-100">
                  {filteredVendors.map((vendor) => {
                    const status = statusConfig[vendor.status];
                    return (
                      <tr key={vendor.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {vendor.logoUrl ? (
                              <img 
                                className="h-10 w-10 rounded object-contain mr-3 border border-neutral-100 bg-white p-1 shadow-sm" 
                                src={vendor.logoUrl} 
                                alt={`${vendor.name} logo`} 
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-neutral-50 flex items-center justify-center text-neutral-400 mr-3 border border-neutral-200 shadow-sm">
                                <Briefcase size={18} />
                              </div>
                            )}
                            <div>
                              <Link 
                                to={`/vendors/${vendor.id}`} 
                                className="text-sm font-medium text-neutral-800 hover:text-blue-600 transition-colors"
                              >
                                {vendor.name}
                              </Link>
                              <p className="text-xs text-neutral-500 mt-0.5">ID: {vendor.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full
                                    ${status.bgColor} ${status.textColor} ${status.borderColor} border`}
                          >
                            {status.icon}
                            {vendor.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">
                          {vendor.primaryContactName ? (
                            <div className="flex items-center">
                              <UserCircle size={16} className="mr-2 text-neutral-400" />
                              {vendor.primaryContactName}
                            </div>
                          ) : (
                            <span className="italic text-neutral-400 flex items-center">
                              <UserCircle size={16} className="mr-2" />
                              Not specified
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-1">
                            <Link 
                              to={`/vendors/${vendor.id}`} 
                              className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded transition-colors" 
                              title="View Details"
                            >
                              <Eye size={16} />
                            </Link>
                            <Link 
                              to={`/vendors/${vendor.id}/edit`} 
                              className="text-neutral-600 hover:text-neutral-800 p-1.5 hover:bg-neutral-100 rounded transition-colors" 
                              title="Edit Vendor"
                            >
                              <Edit3 size={16} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
