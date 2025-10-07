import { useContext } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout.jsx';
import Home from './pages/home/Home.jsx';
import Login from './pages/login/Login.jsx';
import List from './pages/list/List.jsx';
import Single from './pages/single/Single.jsx';
import New from './pages/new/New.jsx';
import NewHotel from './pages/newHotel/NewHotel.jsx';
import NewRoom from './pages/newRoom/NewRoom.jsx';
import Register from './pages/register/Register.jsx';
import Profile from './pages/profile/Profile.jsx';
import Bookings from './pages/bookings/Bookings.jsx';
import Transactions from './pages/transactions/Transactions.jsx';
import Stats from './pages/stats/Stats.jsx';
import Logs from './pages/logs/Logs.jsx';
import UsersManagement from './pages/users/UsersManagement.jsx';
import { userInputs } from './formSource.js';
import { hotelColumns, roomColumns } from './components/datatable/columns.js';
import { AuthContext } from './context/AuthContext.js';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Home />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <UsersManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:userId"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Single />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/new"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <New inputs={userInputs} title="Add New User" />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hotels"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <List columns={hotelColumns} />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hotels/:productId"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Single />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hotels/new"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <NewHotel />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hotels/:hotelId/edit"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <NewHotel />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rooms"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <List columns={roomColumns} />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rooms/:productId"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Single />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rooms/new"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <NewRoom />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Profile />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Bookings />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Transactions />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Stats />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Logs />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
