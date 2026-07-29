import React, { useEffect } from 'react';
import Button from './Button';

const ConfirmModal = ({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, loading = false, onConfirm, onClose }) => {
    useEffect(() => {
        if (!open) return undefined;
        const handleKey = (event) => event.key === 'Escape' && !loading && onClose();
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, loading, onClose]);
    if (!open) return null;
    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={(e) => e.target === e.currentTarget && !loading && onClose()}>
        <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl dark:bg-gray-900">
            <h2 id="confirm-title" className="text-2xl font-black text-gray-900 dark:text-white">{title}</h2>
            <p className="mt-3 leading-relaxed text-gray-600 dark:text-gray-300">{message}</p>
            <div className="mt-7 flex justify-end gap-3"><Button variant="secondary" disabled={loading} onClick={onClose}>{cancelLabel}</Button><Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>{confirmLabel}</Button></div>
        </div>
    </div>;
};
export default ConfirmModal;
