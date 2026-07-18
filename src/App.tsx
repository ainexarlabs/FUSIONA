import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/components/AuthProvider';
import { RequireAuth } from '@/components/RequireAuth';
import { About } from '@/pages/client/About';
import { Home } from '@/pages/client/Home';
import { PropertyDetail } from '@/pages/client/PropertyDetail';
import { Login } from '@/pages/admin/Login';
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { Dashboard } from '@/pages/admin/Dashboard';
import { PropertyForm } from '@/pages/admin/PropertyForm';
import { MunicipalityCodes } from '@/pages/admin/MunicipalityCodes';
import { VisitRequests } from '@/pages/admin/VisitRequests';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nosotros" element={<About />} />
        <Route path="/propiedades/:folio" element={<PropertyDetail />} />

        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="propiedades/nueva" element={<PropertyForm />} />
          <Route path="propiedades/:id" element={<PropertyForm />} />
          <Route path="visitas" element={<VisitRequests />} />
          <Route path="ajustes" element={<MunicipalityCodes />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
