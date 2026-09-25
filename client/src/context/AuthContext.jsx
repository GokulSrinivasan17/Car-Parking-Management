import { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session from localStorage on mount
    useEffect(() => {
        try {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const parsed = JSON.parse(userInfo);
                // Basic sanity check: ensure we have at least an _id and token
                if (parsed && parsed._id && parsed.token) {
                    setUser(parsed);
                } else {
                    localStorage.removeItem('userInfo');
                }
            }
        } catch (e) {
            // Corrupted data — clear it
            localStorage.removeItem('userInfo');
        } finally {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed. Please try again.'
            };
        }
    };

    const register = async (name, email, password, phone) => {
        try {
            const { data } = await api.post('/auth/register', { name, email, password, phone });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed. Please try again.'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
