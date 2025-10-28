// components/AdvancedChunkedUpload.tsx
'use client';

import { useState, useRef } from 'react';

const CHUNK_SIZE = 1024 * 1024; // 1MB
const MAX_RETRIES = 3;

export default function AdvancedChunkUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  async function uploadChunkWithRetry(
    formData: FormData,
    retries = 0
  ): Promise<any> {
    try {
      const response = await fetch('/api/upload/chunk', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) throw new Error('Upload falhou');
      return await response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') throw error;
      
      if (retries < MAX_RETRIES) {
        console.log(`Tentativa ${retries + 1} falhou, tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
        return uploadChunkWithRetry(formData, retries + 1);
      }
      throw error;
    }
  }

  async function uploadFileInChunks(file: File) {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    abortControllerRef.current = new AbortController();
    setUploading(true);
    setProgress(0);
    setStatus(`Preparando upload de ${totalChunks} chunks...`);

    try {
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunkIndex', chunkIndex.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('fileName', file.name);
        formData.append('fileId', fileId);

        const result = await uploadChunkWithRetry(formData);
        
        const currentProgress = ((chunkIndex + 1) / totalChunks) * 100;
        setProgress(currentProgress);
        setStatus(`Chunk ${chunkIndex + 1}/${totalChunks} enviado`);

        if (chunkIndex === totalChunks - 1) {
          setStatus('✓ Upload completo!');
          console.log('Arquivo:', result.finalPath);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setStatus('Upload cancelado');
      } else {
        console.error('Erro:', error);
        setStatus('✗ Erro no upload');
      }
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  }

  function cancelUpload() {
    abortControllerRef.current?.abort();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    if (!file) return;
    await uploadFileInChunks(file);
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Upload Avançado</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="file" name="file" required className="block w-full" />
        
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={uploading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg
              hover:bg-blue-700 disabled:bg-gray-400"
          >
            {uploading ? 'Enviando...' : 'Enviar'}
          </button>
          
          {uploading && (
            <button
              type="button"
              onClick={cancelUpload}
              className="bg-red-600 text-white py-2 px-4 rounded-lg
                hover:bg-red-700"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {progress > 0 && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm mt-2">{status}</p>
          <p className="font-semibold">{Math.round(progress)}%</p>
        </div>
      )}
    </div>
  );
}