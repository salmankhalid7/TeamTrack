import { useState, useCallback } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { useGenerateTasks, useDisciplines } from '../../../api/queries';
import { useToast } from '../../ui/Toast';

export function PDFUploader({ onClose }) {
  const [file, setFile] = useState(null);
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const { data: disciplines = [] } = useDisciplines();
  const generateTasks = useGenerateTasks();
  const toast = useToast();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        toast.error('Please upload a PDF file');
      }
    }
  }, [toast]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const extractPdfText = async (file) => {
    // Use pdf.js or similar library to extract text
    // For now, we'll use a simple approach with FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          // In production, use pdf.js for proper text extraction
          // const pdf = await pdfjsLib.getDocument(e.target.result).promise;
          // let fullText = '';
          // for (let i = 1; i <= pdf.numPages; i++) {
          //   const page = await pdf.getPage(i);
          //   const content = await page.getTextContent();
          //   fullText += content.items.map(item => item.str).join(' ') + '\n';
          // }
          // resolve(fullText);
          
          // Placeholder - pass raw text (in production, extract properly)
          resolve(e.target.result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file); // Note: PDFs need proper parsing, not readAsText
    });
  };

  const handleUpload = async () => {
    if (!file || !selectedDiscipline) {
      toast.warning('Please select a discipline and PDF file');
      return;
    }

    setIsUploading(true);
    setProgress(10);

    try {
      // 1. Upload PDF to Cloudinary for storage
      setProgress(30);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'training-plans');

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
        { method: 'POST', body: formData }
      );

      if (!cloudinaryResponse.ok) {
        throw new Error('Failed to upload PDF to storage');
      }

      const cloudinaryData = await cloudinaryResponse.json();
      setProgress(60);

      // 2. Extract text from PDF
      const pdfText = await extractPdfText(file);
      setProgress(80);

      // 3. Generate tasks using Edge Function
      const disciplineName = disciplines.find(d => d.id === selectedDiscipline)?.name;
      
      await generateTasks.mutateAsync({
        pdfText,
        disciplineId: selectedDiscipline,
        disciplineName,
      });

      setProgress(100);
      toast.success('PDF uploaded and tasks generated! Review them in the Tasks tab.');
      
      // Close after short delay
      setTimeout(() => {
        onClose();
      }, 1000);

    } catch (error) {
      toast.error(error.message || 'Failed to process PDF');
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <h3 className="font-semibold text-[#2b2d42] mb-2">Upload Training Plan</h3>
      <p className="text-sm text-[#2b2d42] text-opacity-60 mb-6">
        Upload a PDF containing the training curriculum. AI will break it into daily tasks.
      </p>

      {/* Discipline Select */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#2b2d42] text-opacity-90 mb-1.5">
          Select Discipline
        </label>
        <select
          value={selectedDiscipline}
          onChange={(e) => setSelectedDiscipline(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-[rgba(43,45,66,0.12)] text-[#2b2d42] bg-white focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1"
        >
          <option value="">Choose discipline...</option>
          {disciplines.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${dragActive 
            ? 'border-[#0080c8] bg-[#92dce5] bg-opacity-10' 
            : 'border-[rgba(43,45,66,0.12)] hover:border-[#0080c8]'
          }
          ${file ? 'bg-[#f8f7f9]' : ''}
        `}
      >
        {file ? (
          <div className="space-y-2">
            <div className="w-12 h-12 bg-[#92dce5] bg-opacity-30 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-[#0080c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-medium text-[#2b2d42]">{file.name}</p>
            <p className="text-sm text-[#2b2d42] text-opacity-50">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </p>
            <button
              onClick={() => setFile(null)}
              className="text-sm text-[#0080c8] hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-[#f8f7f9] rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-[#2b2d42] text-opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-[#2b2d42] font-medium">
                Drop PDF here or click to browse
              </p>
              <p className="text-sm text-[#2b2d42] text-opacity-50">
                Only PDF files supported
              </p>
            </div>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload">
              <Button variant="secondary" size="sm" type="button" as="span">
                Browse Files
              </Button>
            </label>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#2b2d42] text-opacity-70">
              {progress < 80 ? 'Uploading PDF...' : 'Generating tasks...'}
            </span>
            <span className="font-medium text-[#2b2d42]">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-[#f8f7f9] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0080c8] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button
          onClick={handleUpload}
          disabled={!file || !selectedDiscipline || isUploading}
          isLoading={isUploading}
          className="flex-1"
        >
          {isUploading ? 'Processing...' : 'Upload & Generate Tasks'}
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={isUploading}>
          Cancel
        </Button>
      </div>
    </Card>
  );
}