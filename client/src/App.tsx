import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserList from './pages/UserList';
import UserRegister from './pages/UserRegister';
import FaceTest from './pages/Facetest';
import BulkRegister from './pages/BulkRegister';
import './App.css';

/** Wraps routes that require authentication; redirects to /login when not authenticated. */
function PrivateRoute({ children }: { children: React.ReactElement }) 
{
    const { isAuthenticated } = useAuth();
    
    if (isAuthenticated) 
    {
        return children;
    } 
    else 
    {
        return <Navigate to="/login" replace />;
    }
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    {/* Protected routes wrapped by MainLayout */}
                    <Route
                        element={
                            <PrivateRoute>
                                <MainLayout />
                            </PrivateRoute>
                        }
                    >
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/users" element={<UserList />} />
                        <Route path="/users/new" element={<UserRegister />} />
                        <Route path="/test" element={<FaceTest />} />
                        <Route path="/users/bulk" element={<BulkRegister />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}