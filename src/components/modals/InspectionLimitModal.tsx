// src/components/modals/InspectionLimitModal.tsx — Hard limit modal
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Crown, Zap, Shield } from 'lucide-react';
import { scaleIn, backdropFade } from '../../lib/animations';

interface InspectionLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: string;
  used: number;
  limit: number;
}

const PLAN_INFO: Record<string, { name: string; nextPlan: string; price: string; icon: typeof Crown }> = {
  free: { name: 'Free', nextPlan: 'Basic', price: 'Rp 699.000/bln', icon: Zap },
  basic: { name: 'Basic', nextPlan: 'Pro', price: 'Rp 1.499.000/bln', icon: Crown },
  pro: { name: 'Pro', nextPlan: 'Pro Max', price: 'Rp 2.999.000/bln', icon: Shield },
  pro_max: { name: 'Pro Max', nextPlan: 'Pro Max', price: 'Rp 2.999.000/bln', icon: Shield },
};

export const InspectionLimitModal = ({
  isOpen,
  onClose,
  plan,
  used,
  limit,
}: InspectionLimitModalProps) => {
  const planInfo = PLAN_INFO[plan] || PLAN_INFO.free;
  const NextIcon = planInfo.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            {...backdropFade}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
            onClick={onClose}
          />

          <motion.div
            {...scaleIn}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-800/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-white/10">
              {/* Header */}
              <div className="bg-red-500/15 p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full -mr-12 -mt-12" />
                <div className="relative z-10">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/15 backdrop-blur-sm rounded-full mb-3 border border-red-400/20">
                    <AlertTriangle className="w-8 h-8 text-red-300" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">Limit Tercapai</h2>
                  <p className="text-sm text-white/60">
                    Kuota inspeksi bulan ini habis
                  </p>
                </div>
              </div>

              {/* Usage Info */}
              <div className="p-5">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60">Paket saat ini</span>
                    <span className="text-sm font-semibold text-white">{planInfo.name}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-white/60">Inspeksi bulan ini</span>
                    <span className="text-sm font-bold text-red-300">{used} / {limit}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Upgrade CTA */}
                {plan !== 'pro_max' && (
                  <div className="bg-gradient-to-br from-blue-500/15 to-indigo-500/15 rounded-xl p-4 border border-blue-400/20 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <NextIcon className="w-5 h-5 text-blue-300" />
                      <div>
                        <p className="text-sm font-semibold text-white">Upgrade ke {planInfo.nextPlan}</p>
                        <p className="text-xs text-white/50">{planInfo.price}</p>
                      </div>
                    </div>
                    <p className="text-xs text-white/60">
                      Dapatkan kuota inspeksi lebih banyak untuk bulan depan.
                    </p>
                  </div>
                )}

                {/* Action */}
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm font-semibold text-white transition-colors"
                >
                  Mengerti
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
