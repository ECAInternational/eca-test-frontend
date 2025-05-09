// src/app/components/VendorCard.tsx
import { Link } from '@remix-run/react';
import { Briefcase, UserCircle, ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react';

export interface Vendor {
  id: string;
  name: string;
  status: 'Active' | 'Inactive' | 'Pending';
  primaryContactName?: string;
  logoUrl?: string;
}

interface VendorCardProps {
  vendor: Vendor;
}

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

export default function VendorCard({ vendor }: VendorCardProps) {
  const status = statusConfig[vendor.status];
  
  return (
    <div 
      className="group relative flex flex-col h-full bg-white rounded-xl overflow-hidden transition-all duration-200 
                 hover:shadow-md hover:translate-y-[-2px] border border-neutral-200"
    >
      {/* Subtle accent bar at the top of card based on status */}
      <div className={`h-1 w-full ${status.bgColor}`}></div>
      
      <div className="p-5">
        {/* Logo and Name section */}
        <div className="flex items-start space-x-4 mb-4">
          {vendor.logoUrl ? (
            <div className="flex-shrink-0">
              <img 
                src={vendor.logoUrl}
                alt={`${vendor.name} logo`}
                className="h-14 w-14 object-contain rounded-md border border-neutral-100 bg-white p-1 shadow-sm"
              />
            </div>
          ) : (
            <div className="flex-shrink-0 h-14 w-14 flex items-center justify-center bg-neutral-50 rounded-md border border-neutral-200 shadow-sm">
              <Briefcase size={24} className="text-neutral-400" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-neutral-800 group-hover:text-blue-600 transition-colors truncate">
              <Link to={`/vendors/${vendor.id}`} className="focus:outline-none focus:underline">
                <span className="absolute inset-0" aria-hidden="true" /> {/* Makes the whole card clickable */}
                {vendor.name}
              </Link>
            </h2>
            
            <div className="mt-1 flex items-center">
              <span 
                className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full
                          ${status.bgColor} ${status.textColor} ${status.borderColor} border`}
              >
                {status.icon}
                {vendor.status}
              </span>
              <span className="ml-2 text-xs text-neutral-500">ID: {vendor.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-neutral-100 my-3"></div>
        
        {/* Contact Information */}
        <div className="mt-2">
          <p className="text-sm font-medium text-neutral-700 flex items-center">
            <UserCircle size={16} className="mr-2 text-neutral-400" /> 
            Contact
          </p>
          {vendor.primaryContactName ? (
            <p className="mt-1 text-sm text-neutral-600 pl-7">{vendor.primaryContactName}</p>
          ) : (
            <p className="mt-1 text-sm text-neutral-400 italic pl-7">No primary contact listed</p>
          )}
        </div>
      </div>
      
      {/* Card Footer */}
      <div className="mt-auto px-5 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
        <Link 
          to={`/vendors/${vendor.id}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center group-hover:underline focus:outline-none"
          aria-label={`View details for ${vendor.name}`}
        >
          View Details
          <ExternalLink size={14} className="ml-1 transition-transform group-hover:translate-x-0.5" />
        </Link>
        
        <Link
          to={`/vendors/${vendor.id}/edit`}
          className="text-xs text-neutral-500 hover:text-neutral-700 focus:outline-none focus:underline px-2 py-1 rounded hover:bg-neutral-100"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Edit ${vendor.name}`}
        >
          Edit
        </Link>
      </div>
    </div>
  );
}
