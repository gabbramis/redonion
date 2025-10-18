"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Section = "dashboard" | "media" | "profile";

interface UserPlan {
  name: string;
  tier: "basico" | "estandar" | "premium";
  billing: "monthly" | "annual";
  price: number;
  features: string[];
  startDate: string;
}

export default function ClientPanel() {
  const [user, setUser] = useState<{ email?: string; user_metadata?: { full_name?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection] = useState<Section>("dashboard");
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [customMessage, setCustomMessage] = useState<string>("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUserAndFetchPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);

      // Fetch user plan from Supabase
      const { data: planData, error } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      console.log('🔍 User ID:', user.id);
      console.log('🔍 Plan Data:', planData);
      console.log('🔍 Error:', error);

      if (planData && !error) {
        console.log('✅ Found active plan:', planData.plan_name);
        setUserPlan({
          name: planData.plan_name,
          tier: planData.plan_tier,
          billing: planData.billing_type,
          price: planData.price,
          features: planData.features || [],
          startDate: planData.start_date,
        });
      } else {
        console.log('❌ No active plan found');
        // No active plan found - user needs to subscribe
        setUserPlan(null);
      }

      // Fetch custom message from client panel settings
      const { data: settingsData } = await supabase
        .from('client_panel_settings')
        .select('dashboard_settings')
        .eq('user_id', user.id)
        .single();

      if (settingsData?.dashboard_settings?.customMessage) {
        setCustomMessage(settingsData.dashboard_settings.customMessage);
      }

      setLoading(false);
    };

    checkUserAndFetchPlan();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <>
        {!userPlan ? (
          <NoPlanSection />
        ) : (
          <>
            {activeSection === "dashboard" && <DashboardSection userPlan={userPlan} customMessage={customMessage} />}
            {activeSection === "media" && <MediaSection />}
            {activeSection === "profile" && <ProfileSection user={user} userPlan={userPlan} />}
          </>
        )}
    </>
  );
}

// Dashboard Section Component
function DashboardSection({ userPlan, customMessage }: { userPlan: UserPlan; customMessage: string }) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 sm:p-8 text-white"
      >
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">¡Bienvenido de vuelta!</h2>
        <p className="text-red-100">
          Tu {userPlan.name} está activo y en funcionamiento.
        </p>
      </motion.div>

      {/* Plan Active Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Suscripción Activa</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tu plan {userPlan.name} está funcionando correctamente
            </p>
          </div>
        </div>
      </motion.div>

      {/* Custom Message from Admin */}
      {customMessage && customMessage.trim() !== '' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 sm:p-8 shadow-lg border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Mensaje de tu Equipo RedOnion
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {customMessage}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Media Upload Section Component
function MediaSection() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; type: string; size: number; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const supabase = createClient();

  // Fetch existing uploads on mount
  useEffect(() => {
    const fetchUploads = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('media_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setUploadedFiles(data.map(file => ({
          id: file.id,
          name: file.file_name,
          type: file.file_type,
          size: file.file_size,
          url: file.public_url || '',
        })));
      }
    };

    fetchUploads();
  }, [supabase]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    setUploadError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUploadError("Usuario no autenticado");
      setUploading(false);
      return;
    }

    for (const file of Array.from(files)) {
      try {
        // Validate file size (50MB max)
        if (file.size > 50 * 1024 * 1024) {
          setUploadError(`${file.name} excede el tamaño máximo de 50MB`);
          continue;
        }

        // Generate unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${file.type.startsWith('image') ? 'images' : 'videos'}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('client-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('client-media')
          .getPublicUrl(filePath);

        // Save to database
        const { data: dbData, error: dbError } = await supabase
          .from('media_uploads')
          .insert({
            user_id: user.id,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_path: filePath,
            public_url: publicUrl,
          })
          .select()
          .single();

        if (dbError) throw dbError;

        // Add to local state
        if (dbData) {
          setUploadedFiles(prev => [...prev, {
            id: dbData.id,
            name: dbData.file_name,
            type: dbData.file_type,
            size: dbData.file_size,
            url: dbData.public_url || '',
          }]);
        }
      } catch (err) {
        const error = err as Error;
        setUploadError(`Error al subir ${file.name}: ${error.message}`);
      }
    }

    setUploading(false);
  };

  const handleDeleteFile = async (fileId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) return;

    try {
      // Get storage path from database
      const { data: fileData } = await supabase
        .from('media_uploads')
        .select('storage_path')
        .eq('id', fileId)
        .single();

      if (fileData) {
        // Delete from storage
        await supabase.storage
          .from('client-media')
          .remove([fileData.storage_path]);
      }

      // Delete from database
      await supabase
        .from('media_uploads')
        .delete()
        .eq('id', fileId);

      // Remove from local state
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      const error = err as Error;
      setUploadError(`Error al eliminar: ${error.message}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Subir Contenido
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Sube imágenes y videos para tus publicaciones y campañas.
        </p>
      </motion.div>

      {/* Error Message */}
      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg"
        >
          {uploadError}
        </motion.div>
      )}

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg"
      >
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            dragActive
              ? "border-red-500 bg-red-50 dark:bg-red-900/10"
              : "border-gray-300 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500"
          }`}
        >
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Arrastra y suelta tus archivos aquí
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            o haz clic para seleccionar archivos
          </p>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`inline-block px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors ${
              uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {uploading ? 'Subiendo...' : 'Seleccionar Archivos'}
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Formatos soportados: JPG, PNG, GIF, MP4, MOV (Max. 50MB)
          </p>
        </div>
      </motion.div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Archivos Subidos ({uploadedFiles.length})
          </h3>
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                    {file.type.startsWith("image") ? (
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Profile Section Component
function ProfileSection({ user, userPlan }: { user: { email?: string; user_metadata?: { full_name?: string } } | null; userPlan: UserPlan }) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mi Perfil
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Información de tu cuenta y plan actual.
        </p>
      </motion.div>

      {/* User Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Información Personal
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Nombre Completo</label>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {user?.user_metadata?.full_name || "No especificado"}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Correo Electrónico</label>
            <p className="text-lg font-medium text-gray-900 dark:text-white">{user?.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Plan Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-gradient-to-br from-red-600 to-orange-600 rounded-xl p-6 shadow-lg text-white"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">{userPlan.name}</h3>
            <p className="text-red-100">
              {userPlan.billing === "monthly" ? "Facturación Mensual" : "Facturación Anual"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">${userPlan.price}</p>
            <p className="text-sm text-red-100">USD/mes</p>
          </div>
        </div>
        <div className="bg-white/10 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-100 mb-2">Fecha de inicio</p>
          <p className="font-semibold">{new Date(userPlan.startDate).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <button className="w-full px-4 py-2 bg-white text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors">
          Cambiar Plan
        </button>
      </motion.div>

      {/* Plan Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Características de tu Plan
        </h3>
        <div className="space-y-3">
          {userPlan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
// No Plan Section - shown when user hasn't subscribed yet
function NoPlanSection() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-8 sm:p-12 shadow-lg text-center max-w-md"
      >
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          No tienes un plan activo
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Necesitas suscribirte a un plan para acceder a tu panel de cliente y todas las funcionalidades.
        </p>

        <button
          onClick={() => router.push("/dashboard/client")}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
        >
          Ver Planes Disponibles
        </button>
      </motion.div>
    </div>
  );
}
