// Moved to legacy folder on 2025-10-18 during route cleanup
// Original path: client/pages/AdminAnalytics.tsx
// Reason: No route defined, functionality replaced by UnifiedReports

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Progress } from "../../components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  Users,
  Clock,
  Target,
  MapPin,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";

const AdminAnalytics: React.FC = () => {
  return (
    <div>
      <h1>Admin Analytics (Legacy)</h1>
      <p>This component has been moved to legacy. Please use UnifiedReports instead.</p>
    </div>
  );
};

export default AdminAnalytics;