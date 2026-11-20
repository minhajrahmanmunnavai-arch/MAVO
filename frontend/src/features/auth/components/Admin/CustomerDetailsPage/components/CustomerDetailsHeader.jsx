
import React from 'react';
import { Mail, Phone, Calendar } from 'lucide-react';

export default function CustomerDetailsHeader({ customer }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

      <div className="flex items-center gap-4">

        <div className="w-16 h-16 rounded-2xl bg-leniar-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-black font-extrabold text-2xl shadow-lg shadow-blue-600/30">
          {customer.name.charAt(0)}
        </div>

        <div>

          <div className="flex items-center gap-2.5">

            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              {customer.name}
            </h1>

            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {customer.status}
            </span>

          </div>

          <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-4">

            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              {customer.email}
            </span>

            <span className="flex items-center gap-1.5 font-mono">
              <Phone className="w-3.5 h-3.5" />
              {customer.phone}
            </span>

            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Registered {customer.registeredAt}
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}
