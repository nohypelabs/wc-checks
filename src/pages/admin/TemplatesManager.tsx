// src/pages/admin/TemplatesManager.tsx - Inspection Templates Management
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export const TemplatesManager = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 via-orange-500 to-red-500 p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 text-white mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Templates Management</h1>
            <p className="text-orange-100">Manage inspection templates</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8">
        {/* Coming Soon Card */}
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Templates Management
          </h2>
          <p className="text-gray-600 mb-6">
            This feature is coming soon. You'll be able to create and manage custom inspection templates here.
          </p>
          <div className="flex flex-col gap-3">
            <div className="p-4 bg-gray-50 rounded-xl text-left">
              <h3 className="font-medium text-gray-900 mb-1">
                📋 Create Custom Templates
              </h3>
              <p className="text-sm text-gray-600">
                Design inspection forms with custom questions and categories
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-left">
              <h3 className="font-medium text-gray-900 mb-1">
                🔄 Template Versions
              </h3>
              <p className="text-sm text-gray-600">
                Manage template versions and track changes over time
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-left">
              <h3 className="font-medium text-gray-900 mb-1">
                📊 Default Templates
              </h3>
              <p className="text-sm text-gray-600">
                Set default templates for different location types
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
