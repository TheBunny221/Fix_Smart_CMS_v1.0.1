import { Suspense } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { Provider } from "react-redux";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import ErrorBoundary from "./components/ErrorBoundary";
import AppInitializer from "./components/AppInitializer";
import GlobalMessageHandler from "./components/GlobalMessageHandler";
import AuthErrorHandler from "./components/AuthErrorHandler";
import UnifiedLayout from "./components/layouts/UnifiedLayout";
import OtpProvider from "./contexts/OtpContext";
import { SystemConfigProvider } from "./contexts/SystemConfigContext";
import RoleBasedRoute from "./components/RoleBasedRoute";
import RoleBasedDashboard from "./components/RoleBasedDashboard";
import RouteLoader from "./components/RouteLoader";
import { store } from "./store";
import { lazyWithRetry } from "./utils/lazyWithRetry";

const Index = lazyWithRetry(() => import("./pages/Index"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const Register = lazyWithRetry(() => import("./pages/Register"));
const SetPassword = lazyWithRetry(() => import("./pages/SetPassword"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const Unauthorized = lazyWithRetry(() => import("./pages/Unauthorized"));

const CitizenDashboard = lazyWithRetry(
  () => import("./pages/CitizenDashboard"),
);
const WardOfficerDashboard = lazyWithRetry(
  () => import("./pages/WardOfficerDashboard"),
);
const MaintenanceDashboard = lazyWithRetry(
  () => import("./pages/MaintenanceDashboard"),
);
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));

const ComplaintsList = lazyWithRetry(() => import("./pages/ComplaintsList"));
const ComplaintDetails = lazyWithRetry(
  () => import("./pages/ComplaintDetails"),
);
const CreateComplaint = lazyWithRetry(() => import("./pages/CreateComplaint"));
const CitizenComplaintForm = lazyWithRetry(
  () => import("./pages/CitizenComplaintForm"),
);
const GuestComplaintForm = lazyWithRetry(
  () => import("./pages/GuestComplaintForm"),
);
const UnifiedComplaintForm = lazyWithRetry(
  () => import("./pages/UnifiedComplaintForm"),
);
const QuickComplaintPage = lazyWithRetry(
  () => import("./pages/QuickComplaintPage"),
);
const GuestTrackComplaint = lazyWithRetry(
  () => import("./pages/GuestTrackComplaint"),
);
const GuestServiceRequest = lazyWithRetry(
  () => import("./pages/GuestServiceRequest"),
);
const GuestDashboard = lazyWithRetry(() => import("./pages/GuestDashboard"));

const WardTasks = lazyWithRetry(() => import("./pages/WardTasks"));
const WardManagement = lazyWithRetry(() => import("./pages/WardManagement"));

const MaintenanceTasks = lazyWithRetry(
  () => import("./pages/MaintenanceTasks"),
);
const TaskDetails = lazyWithRetry(() => import("./pages/TaskDetails"));

const AdminUsers = lazyWithRetry(() => import("./pages/AdminUsers"));
const UnifiedReports = lazyWithRetry(() => import("./pages/UnifiedReports"));
const AdminConfig = lazyWithRetry(() => import("./pages/AdminConfig"));
const AdminLanguages = lazyWithRetry(() => import("./pages/AdminLanguages"));

const Messages = lazyWithRetry(() => import("./pages/Messages"));
const Settings = lazyWithRetry(() => import("./pages/Settings"));

const renderRoute = (element: React.ReactNode) => (
  <Suspense fallback={<RouteLoader />}>{element}</Suspense>
);

const AppRoutes = () => (
  <Router>
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={renderRoute(<Login />)} />
        <Route path="/register" element={renderRoute(<Register />)} />
        <Route
          path="/set-password/:token"
          element={renderRoute(<SetPassword />)}
        />
        <Route
          path="/guest/complaint"
          element={renderRoute(<GuestComplaintForm />)}
        />
        <Route path="/complaint" element={renderRoute(<QuickComplaintPage />)} />
        <Route
          path="/guest/track"
          element={renderRoute(<GuestTrackComplaint />)}
        />
        <Route
          path="/guest/service-request"
          element={renderRoute(<GuestServiceRequest />)}
        />
        <Route
          path="/guest/dashboard"
          element={renderRoute(<GuestDashboard />)}
        />
        <Route
          path="/unauthorized"
          element={renderRoute(<Unauthorized />)}
        />

        <Route
          path="/"
          element={
            renderRoute(
              <UnifiedLayout>
                <Index />
              </UnifiedLayout>,
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute
                  allowedRoles={[
                    "CITIZEN",
                    "WARD_OFFICER",
                    "MAINTENANCE_TEAM",
                    "ADMINISTRATOR",
                  ]}
                >
                  <RoleBasedDashboard />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />

        <Route
          path="/complaints"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute
                  allowedRoles={[
                    "CITIZEN",
                    "WARD_OFFICER",
                    "MAINTENANCE_TEAM",
                    "ADMINISTRATOR",
                  ]}
                >
                  <ComplaintsList />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />
        <Route
          path="/complaints/create"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute
                  allowedRoles={[
                    "CITIZEN",
                    "WARD_OFFICER",
                    "MAINTENANCE_TEAM",
                    "ADMINISTRATOR",
                  ]}
                >
                  <CreateComplaint />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />
        <Route
          path="/complaints/citizen-form"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute allowedRoles={["CITIZEN"]}>
                  <QuickComplaintPage />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />
        <Route
          path="/complaints/new"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute allowedRoles={["CITIZEN"]}>
                  <QuickComplaintPage />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />
        <Route
          path="/complaints/:id"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute
                  allowedRoles={[
                    "CITIZEN",
                    "WARD_OFFICER",
                    "MAINTENANCE_TEAM",
                    "ADMINISTRATOR",
                  ]}
                >
                  <ComplaintDetails />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />

        <Route
          path="/tasks"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute allowedRoles={["WARD_OFFICER"]}>
                  <WardTasks />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />
        <Route
          path="/ward"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute allowedRoles={["WARD_OFFICER"]}>
                  <WardManagement />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />

        <Route
          path="/maintenance"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute allowedRoles={["MAINTENANCE_TEAM"]}>
                  <MaintenanceTasks />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />
        <Route
          path="/tasks/:id"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute allowedRoles={["MAINTENANCE_TEAM"]}>
                  <TaskDetails />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />

        <Route
          path="/messages"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute
                  allowedRoles={["WARD_OFFICER", "MAINTENANCE_TEAM"]}
                >
                  <Messages />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />

        <Route
          path="/reports"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute
                  allowedRoles={[
                    "WARD_OFFICER",
                    "ADMINISTRATOR",
                    "MAINTENANCE_TEAM",
                  ]}
                >
                  <UnifiedReports />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />

        <Route
          path="/admin/users"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute allowedRoles={["ADMINISTRATOR"]}>
                  <AdminUsers />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />
        <Route
          path="/admin/config"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute allowedRoles={["ADMINISTRATOR"]}>
                  <AdminConfig />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />
        <Route
          path="/admin/languages"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute allowedRoles={["ADMINISTRATOR"]}>
                  <AdminLanguages />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />
        <Route
          path="/admin/analytics"
          element={renderRoute(<Navigate to="/reports" replace />)}
        />
        <Route
          path="/admin/reports-analytics"
          element={renderRoute(<Navigate to="/reports" replace />)}
        />

        <Route
          path="/profile"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute
                  allowedRoles={[
                    "CITIZEN",
                    "WARD_OFFICER",
                    "MAINTENANCE_TEAM",
                    "ADMINISTRATOR",
                  ]}
                >
                  <Profile />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />
        <Route
          path="/settings"
          element={
            renderRoute(
              <UnifiedLayout>
                <RoleBasedRoute
                  allowedRoles={[
                    "CITIZEN",
                    "WARD_OFFICER",
                    "MAINTENANCE_TEAM",
                    "ADMINISTRATOR",
                  ]}
                >
                  <Settings />
                </RoleBasedRoute>
              </UnifiedLayout>,
            )
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
    <Toaster />
    <GlobalMessageHandler />
    <AuthErrorHandler />
  </Router>
);

const App = () => (
  <Provider store={store}>
    <ErrorBoundary>
      <SystemConfigProvider>
        <TooltipProvider>
          <OtpProvider>
            <AppInitializer>
              <AppRoutes />
            </AppInitializer>
          </OtpProvider>
        </TooltipProvider>
      </SystemConfigProvider>
    </ErrorBoundary>
  </Provider>
);

export default App;
