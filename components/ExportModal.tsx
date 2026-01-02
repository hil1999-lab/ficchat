import React from 'react';
import { X, Copy, Check } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, title, content }) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-0 relative group">
          <textarea
            readOnly
            value={content}
            className="w-full h-full p-4 font-mono text-xs text-slate-600 bg-slate-50 resize-none outline-none focus:bg-white transition-colors"
          />
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white rounded-b-xl">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 font-medium"
          >
            Close
          </button>
          <button 
            onClick={handleCopy}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 transition-all ${
              copied ? 'bg-green-500' : 'bg-ios-blue hover:bg-blue-600'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>

      </div>
    </div>
  );
};
