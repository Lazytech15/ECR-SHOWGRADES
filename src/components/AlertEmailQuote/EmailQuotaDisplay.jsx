import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

const API_URL = 'https://ecr-api-connection-database.netlify.app/.netlify/functions/service-database';

const EmailQuotaDisplay = ({ csvRowCount = 0 }) => {
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const response = await fetch(`${API_URL}/email-quota`);
        if (!response.ok) {
          throw new Error('Failed to fetch quota information');
        }
        const data = await response.json();
        setQuotaInfo(data);
        setError(null);
      } catch (err) {
        setError('Failed to load email quota information');
      } finally {
        setLoading(false);
      }
    };

    fetchQuota();
    // Refresh quota every minute
    const interval = setInterval(fetchQuota, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <div className="flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!quotaInfo) return null;

  const willExceedQuota = csvRowCount > quotaInfo.remainingEmails;
  const quotaPercentage = (quotaInfo.emailsSentToday / 500) * 100;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Email Quota Status</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Emails Sent Today:</span>
          <span className="font-semibold">{quotaInfo.emailsSentToday}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Remaining Quota:</span>
          <span className="font-semibold">{quotaInfo.remainingEmails}</span>
        </div>

        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block text-blue-600">
                Usage: {quotaPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-100">
            <div 
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                quotaPercentage > 90 ? 'bg-red-500' : quotaPercentage > 70 ? 'bg-yellow-500' : 'bg-blue-500'
              }`}
              style={{ width: `${quotaPercentage}%` }}
            ></div>
          </div>
        </div>

        {csvRowCount > 0 && (
          <div className="mt-4 p-4 rounded-lg border">
            <h4 className="font-medium mb-2">CSV Upload Check</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Records to Process:</span>
                <span className="font-semibold">{csvRowCount}</span>
              </div>
              
              {willExceedQuota ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
                  <div className="flex items-center text-red-700">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span>Warning: Not enough quota for all records. {csvRowCount - quotaInfo.remainingEmails} emails will not be sent.</span>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-2">
                  <div className="flex items-center text-green-700">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Sufficient quota available for all records</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-2">
          Last Updated: {new Date(quotaInfo.lastUpdated).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default EmailQuotaDisplay;