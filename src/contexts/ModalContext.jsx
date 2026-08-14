import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ModalContext = createContext(null);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'confirm', // 'confirm', 'alert', 'success', 'error'
    title: '',
    message: '',
    confirmText: 'ตกลง',
    cancelText: 'ยกเลิก',
    onConfirm: null,
    onCancel: null,
  });

  const showModal = useCallback((options) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: options.type || 'confirm',
        title: options.title || '',
        message: options.message || '',
        confirmText: options.confirmText || 'ตกลง',
        cancelText: options.cancelText || 'ยกเลิก',
        onConfirm: () => {
          setModalState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setModalState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  }, []);

  const showConfirm = useCallback((message, options = {}) => {
    return showModal({
      type: 'confirm',
      title: options.title || 'ยืนยันการดำเนินการ',
      message,
      ...options
    });
  }, [showModal]);

  const showAlert = useCallback((message, options = {}) => {
    return showModal({
      type: options.type || 'error',
      title: options.title || 'แจ้งเตือน',
      message,
      confirmText: options.confirmText || 'รับทราบ',
      ...options,
    });
  }, [showModal]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && modalState.isOpen && modalState.type === 'confirm') {
        modalState.onCancel && modalState.onCancel();
      } else if (e.key === 'Escape' && modalState.isOpen && modalState.type !== 'confirm') {
        modalState.onConfirm && modalState.onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalState]);

  return (
    <ModalContext.Provider value={{ showConfirm, showAlert }}>
      {children}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start md:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl flex flex-col overflow-hidden max-h-[calc(100svh-2rem)] md:max-h-[85dvh] min-h-0 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col items-center text-center space-y-4">
              
              {/* Icon Based on Type */}
              {modalState.type === 'confirm' && (
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-8 h-8 text-blue-500" />
                </div>
              )}
              {modalState.type === 'error' && (
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                  <X className="w-8 h-8 text-red-500" />
                </div>
              )}
              {modalState.type === 'success' && (
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
              )}
              {modalState.type === 'alert' && (
                <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Info className="w-8 h-8 text-amber-500" />
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {modalState.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                  {modalState.message}
                </p>
              </div>

            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center space-x-3 bg-slate-50/50 dark:bg-slate-800/50">
              {modalState.type === 'confirm' && (
                <button
                  onClick={modalState.onCancel}
                  className="flex-1 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {modalState.cancelText}
                </button>
              )}
              <button
                onClick={modalState.onConfirm}
                className={`flex-1 px-4 py-2.5 rounded-xl text-white font-semibold shadow-sm transition-colors ${
                  modalState.type === 'error' ? 'bg-red-500 hover:bg-red-600' :
                  modalState.type === 'success' ? 'bg-emerald-500 hover:bg-emerald-600' :
                  'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};
