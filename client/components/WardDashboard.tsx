import React from "react";
import AllComplaintCard from "./AllComplaintCard";

interface WardDashboardProps {
  wardId: string;
}

const WardDashboard: React.FC<WardDashboardProps> = ({ wardId }) => {
  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">🏢 Ward Dashboard 📊</h1>
            <p className="text-primary-foreground/80">
              Monitor and manage complaints for Ward {wardId}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AllComplaintCard wardId={wardId} />
      </div>
    </div>
  );
};

export default WardDashboard;
