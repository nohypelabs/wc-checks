// src/pages/RegisterPage.tsx - IMPROVED

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Tables } from '../types/database.types';
import { Eye, EyeOff, User, Mail, Phone, Briefcase, UserPlus, Loader2, AlertCircle } from 'lucide-react';

// Type dari database
type Occupation = Tables<'user_occupations'>;

const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  occupation_id: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [loadingOccupations, setLoadingOccupations] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // Fetch occupations
  useEffect(() => {
    const fetchOccupations = async () => {
      try {
        const { data, error } = await supabase
          .from('user_occupations')
          .select('*')
          .eq('is_active', true)
          .order('display_name');

        if (error) throw error;

        // Filter to only show allowed occupations (exclude administrator)
        const allowedOccupations = ['cleaning_staff', 'doctor', 'visitor', 'nurse', 'staff', 'supervisor'];
        const filteredData = (data || []).filter(occ => allowedOccupations.includes(occ.name));

        // Transform dengan default values
        setOccupations(filteredData.map(occ => ({
          ...occ,
          icon: occ.icon || '👤',
          color: occ.color || '#3B82F6',
          description: occ.description || '',
        })));
      } catch (error) {
        console.error('Error fetching occupations:', error);
        setOccupations([]);
      } finally {
        setLoadingOccupations(false);
      }
    };

    fetchOccupations();
  }, []);

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    let userId: string | null = null;

    try {
      // 1. Auth signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      userId = authData.user.id;

      // 2. Create profile (occupation_id langsung di users table)
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          full_name: data.full_name,
          password_hash: 'supabase_auth',
          occupation_id: data.occupation_id || null,
          is_active: true,
          phone: data.phone?.trim() || null,
          profile_photo_url: null,
          last_login_at: null,
          created_at: authData.user.created_at, // Use Supabase auth timestamp
        });

      if (profileError) {
        // CRITICAL: Profile creation failed but auth user exists
        // Attempt cleanup by signing out the newly created user
        await supabase.auth.signOut();

        throw new Error(
          `Failed to create profile: ${profileError.message}\n` +
          'Your authentication account was created but profile setup failed. ' +
          'Please try registering again with the same email.'
        );
      }

      setSuccessMessage('Registrasi berhasil! Silakan periksa email Anda untuk verifikasi akun.');

      // Redirect after showing success message
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error: any) {
      console.error('Registration error:', error);

      let userMessage = error.message;

      // Handle specific error cases
      if (error.message.includes('password_hash')) {
        userMessage = 'Kesalahan konfigurasi database. Silakan hubungi administrator.';
      } else if (error.message.includes('users_pkey')) {
        userMessage = 'Pengguna dengan email ini sudah ada.';
      } else if (error.message.includes('User already registered')) {
        userMessage = 'Email ini sudah terdaftar. Silakan coba masuk.';
      } else if (error.message.includes('Failed to create profile')) {
        userMessage = 'Gagal membuat profil. Silakan coba lagi.';
      }

      setError(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Signup Container */}
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src="/logo.png"
              alt="Proservice Indonesia Logo"
              className="h-20 w-auto"
              onError={(e) => {
                // If logo fails, hide and show text fallback
                const img = e.target as HTMLImageElement;
                img.style.display = 'none';
                const fallback = img.nextElementSibling;
                if (fallback) fallback.className = '';
              }}
            />
            <div className="hidden w-16 h-16 bg-blue-600 rounded-2xl shadow-lg flex items-center justify-center">
              <span className="text-3xl">🚽</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Proservice Indonesia
          </h1>
          <p className="text-gray-600">
            Buat akun untuk memulai inspeksi
          </p>
        </div>

        {/* Signup Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Kesalahan</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Berhasil</p>
                <p className="text-sm text-green-700 mt-1">{successMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('full_name')}
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Masukkan nama lengkap Anda"
                  disabled={isLoading}
                />
              </div>
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className="block w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="email.anda@example.com"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Nomor Telepon (Opsional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('phone')}
                  type="tel"
                  className="block w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="081234567890"
                  disabled={isLoading}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Occupation */}
            <div>
              <label htmlFor="occupation_id" className="block text-sm font-medium text-gray-700 mb-2">
                Jabatan (Opsional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-gray-400" />
                </div>
                {loadingOccupations ? (
                  <div className="block w-full pl-10 pr-3 py-3 bg-gray-100 border border-gray-300 rounded-lg">
                    <span className="text-gray-500">Memuat...</span>
                  </div>
                ) : (
                  <select
                    {...register('occupation_id')}
                    className="block w-full pl-10 pr-3 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                    disabled={isLoading}
                  >
                    <option value="">Pilih jabatan Anda</option>
                    {occupations.map((occ) => (
                      <option key={occ.id} value={occ.id}>
                        {occ.icon} {occ.display_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="block w-full pl-4 pr-12 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Masukkan kata sandi Anda"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors"
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="block w-full pl-4 pr-12 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Konfirmasi kata sandi Anda"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors"
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              style={{
                boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)',
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Membuat Akun...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Buat Akun</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Sudah punya akun?
              </span>
            </div>
          </div>

          {/* Login Button */}
          <Link
            to="/login"
            className="w-full bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-4 rounded-lg border-2 border-blue-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-150 flex items-center justify-center gap-2"
          >
            <span>Masuk ke Akun</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            © 2025 Proservice Indonesia. Hak cipta dilindungi.
          </p>
          <p className="mt-2">
            <a href="#" className="text-blue-600 hover:text-blue-700">
              Kebijakan Privasi
            </a>
            {' · '}
            <a href="#" className="text-blue-600 hover:text-blue-700">
              Ketentuan Layanan
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};