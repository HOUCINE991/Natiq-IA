import React, { useState } from 'react';
import { Language } from '../types';

interface ContactFormProps {
  t: any;
  language: Language;
}

const ContactForm: React.FC<ContactFormProps> = ({ t, language }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t.nameRequired;
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = t.emailRequired;
    if (!formData.message.trim()) newErrors.message = t.messageRequired;
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setStatus('success');
    
    // Construct Mailto link
    const subject = `Natiq AI Contact: ${formData.name}`;
    const body = `${formData.message}\n\nFrom: ${formData.name} (${formData.email})`;
    const mailtoLink = `mailto:zamanfor3@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Small delay to show success state before opening client
    setTimeout(() => {
        window.location.href = mailtoLink;
        setStatus('idle');
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {status === 'success' && (
        <div className="bg-emerald-500/20 text-emerald-300 p-4 rounded-xl text-sm border border-emerald-500/30 mb-4 animate-fade-in">
          {t.messageSent}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">{t.fullName}</label>
        <input
          type="text"
          className={`w-full bg-slate-900 border ${errors.name ? 'border-red-500' : 'border-slate-600'} rounded-xl p-4 text-base text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        {errors.name && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">{t.emailAddress}</label>
        <input
          type="email"
          className={`w-full bg-slate-900 border ${errors.email ? 'border-red-500' : 'border-slate-600'} rounded-xl p-4 text-base text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          dir="ltr"
        />
        {errors.email && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2 ml-1">{t.message}</label>
        <textarea
          rows={5}
          className={`w-full bg-slate-900 border ${errors.message ? 'border-red-500' : 'border-slate-600'} rounded-xl p-4 text-base text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none`}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
        />
        {errors.message && <p className="text-red-400 text-xs mt-1.5 ml-1">{errors.message}</p>}
      </div>

      <button
        type="submit"
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-95 mt-4 touch-manipulation"
      >
        {t.sendMessage}
      </button>
    </form>
  );
};

export default ContactForm;