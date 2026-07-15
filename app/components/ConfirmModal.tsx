'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isDanger?: boolean
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = false
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass-panel border-white/10 rounded-[48px] p-12 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          >
            {/* Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 blur-[80px] opacity-20 ${isDanger ? 'bg-rose-500' : 'bg-brand'}`} />

            <div className="relative z-10 text-center">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-8 border border-white/5 ${isDanger ? 'bg-rose-500/10 text-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.2)]' : 'bg-brand/10 text-brand shadow-[0_0_40px_rgba(212,115,10,0.2)]'}`}>
                {isDanger ? '⚠️' : '❓'}
              </div>

              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4 leading-tight">
                {title}
              </h3>
              
              <p className="text-sm font-medium text-gray-400 leading-relaxed mb-10 px-4 italic">
                {message}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={onConfirm}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] transition-all active:scale-[0.98] shadow-2xl ${
                    isDanger 
                    ? 'bg-rose-500 text-white shadow-rose-500/20 hover:brightness-110' 
                    : 'bg-brand text-white brand-glow hover:brightness-110'
                  }`}
                >
                  {confirmText}
                </button>
                <button
                  onClick={onCancel}
                  className="w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] text-gray-500 hover:text-white transition-all"
                >
                  {cancelText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
