import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Volume2,
  Image as ImageIcon,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { ConceptMediaAttachment } from '../types/learning';
import {
  uploadMediaFileToDrive,
  deleteMediaFileFromDrive,
  getAccessToken,
  googleSignIn,
} from '../utils/googleDriveService';

interface MediaUploadDropzoneProps {
  attachments: ConceptMediaAttachment[];
  onChangeAttachments: (attachments: ConceptMediaAttachment[]) => void;
  onPreviewAttachment: (attachment: ConceptMediaAttachment) => void;
  isGoogleDriveSignedIn: boolean;
  onSignInSuccess?: () => void;
}

export const MediaUploadDropzone: React.FC<MediaUploadDropzoneProps> = ({
  attachments,
  onChangeAttachments,
  onPreviewAttachment,
  isGoogleDriveSignedIn,
  onSignInSuccess,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressMsg, setUploadProgressMsg] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tempCaption, setTempCaption] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    setErrorMessage(null);

    let token = await getAccessToken();
    if (!token) {
      // Prompt user to sign in
      try {
        const signinRes = await googleSignIn();
        if (signinRes?.accessToken) {
          token = signinRes.accessToken;
          if (onSignInSuccess) onSignInSuccess();
        } else {
          setErrorMessage('Debes conectar tu cuenta de Google Drive para subir archivos.');
          return;
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Error al iniciar sesión con Google');
        return;
      }
    }

    setIsUploading(true);
    const newUploadedList: ConceptMediaAttachment[] = [...attachments];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgressMsg(`Subiendo "${file.name}" a Google Drive (${i + 1}/${files.length})...`);
      try {
        const uploaded = await uploadMediaFileToDrive(token, file, tempCaption.trim() || undefined);
        newUploadedList.push(uploaded);
      } catch (uploadErr: any) {
        console.error('Upload error:', uploadErr);
        setErrorMessage(`Error al subir "${file.name}": ${uploadErr.message}`);
      }
    }

    setTempCaption('');
    setIsUploading(false);
    setUploadProgressMsg('');
    onChangeAttachments(newUploadedList);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAttachment = async (attachment: ConceptMediaAttachment) => {
    const token = await getAccessToken();
    if (token) {
      try {
        const deleted = await deleteMediaFileFromDrive(
          token,
          attachment.driveFileId,
          attachment.name
        );
        if (!deleted) return; // User canceled confirmation
      } catch (err: any) {
        console.warn('Could not delete from Drive remote:', err);
      }
    }

    // Remove from local list
    const updated = attachments.filter((a) => a.id !== attachment.id);
    onChangeAttachments(updated);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3 text-left">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
          <span>Archivos Multimedia en Google Drive (Imágenes, Audios y PDFs)</span>
        </label>
        <span className="text-[11px] font-mono text-slate-500">
          {attachments.length} archivo{attachments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Google Sign-in Prompt if not authenticated */}
      {!isGoogleDriveSignedIn && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-300 space-y-0.5">
            <span className="font-semibold text-white block">Conectar con Google Drive</span>
            <p className="text-slate-400 text-[11px]">
              Sube tus imágenes, audios de pronunciación y PDFs directamente a tu cuenta sin límites locales.
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                const res = await googleSignIn();
                if (res && onSignInSuccess) onSignInSuccess();
              } catch (err: any) {
                setErrorMessage(err.message || 'Error al iniciar sesión');
              }
            }}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-colors shrink-0 flex items-center gap-2 cursor-pointer shadow"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <span>Conectar con Google</span>
          </button>
        </div>
      )}

      {/* Upload Dropzone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-indigo-400 bg-indigo-950/20 scale-[0.99]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,audio/*,.pdf,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-2">
            <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
            <span className="text-xs font-medium text-slate-200">{uploadProgressMsg}</span>
            <span className="text-[11px] text-slate-500">Guardando de forma segura en Google Drive...</span>
          </div>
        ) : (
          <div className="space-y-1.5 py-1">
            <div className="flex items-center justify-center gap-2 text-indigo-400">
              <ImageIcon className="w-4 h-4" />
              <Volume2 className="w-4 h-4" />
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-slate-200">
              Arrastra archivos aquí o haz clic para explorar
            </p>
            <p className="text-[11px] text-slate-500">
              Soporta imágenes (PNG, JPG, SVG, WebP), audios (MP3, WAV, M4A) y documentos PDF
            </p>
          </div>
        )}
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Attached Media List */}
      {attachments.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Archivos Adjuntos al Concepto
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {attachments.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 hover:border-slate-700 transition-colors"
              >
                <div
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => onPreviewAttachment(item)}
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-950 flex items-center justify-center text-indigo-400 shrink-0 border border-slate-800 overflow-hidden">
                    {item.mediaType === 'image' ? (
                      item.thumbnailLink ? (
                        <img
                          src={item.thumbnailLink}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )
                    ) : item.mediaType === 'audio' ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                      <span className="capitalize">{item.mediaType}</span>
                      {item.sizeBytes > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{formatFileSize(item.sizeBytes)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreviewAttachment(item)}
                    className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Ver o reproducir"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAttachment(item)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar de Google Drive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
