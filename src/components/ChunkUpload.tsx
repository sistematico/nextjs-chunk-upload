// components/ChunkedUpload.tsx
'use client';

import { useState } from 'react';

const CHUNK_SIZE = 1024 * 1024; // 1MB por chunk

export default function ChunkedUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  async function uploadFileInChunks(file: File) {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setUploading(true);
    setStatus(`Enviando ${totalChunks} chunks...`);

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

        const response = await fetch('/api/upload/chunk', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Erro no chunk ${chunkIndex}`);
        }

        const result = await response.json();
        const currentProgress = ((chunkIndex + 1) / totalChunks) * 100;
        setProgress(currentProgress);
        setStatus(result.message);

        // Se for o último chunk
        if (chunkIndex === totalChunks - 1) {
          setStatus('Upload completo! ✓');
          console.log('Arquivo salvo em:', result.finalPath);
        }
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      setStatus('Erro no upload ✗');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    if (!file) {
      alert('Selecione um arquivo');
      return;
    }

    await uploadFileInChunks(file);
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Upload em Chunks</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="file"
            name="file"
            required
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg
            hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {uploading ? 'Enviando...' : 'Enviar Arquivo'}
        </button>
      </form>

      {uploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{status}</p>
          <p className="text-sm font-semibold">{Math.round(progress)}%</p>
        </div>
      )}

      {!uploading && progress > 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">{status}</p>
        </div>
      )}
    </div>
  );
}