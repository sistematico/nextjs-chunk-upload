import AdvancedChunkUpload from "@/components/AdvancedChunkUpload";

export default function UploadPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
          Upload Page
        </h1>
        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          This is the upload page. You can implement your upload component here.
        </p>
        <AdvancedChunkUpload />
      </main>
    </div>
  );
}