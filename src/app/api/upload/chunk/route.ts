import { readFile, writeFile, appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { rmSync, existsSync } from "node:fs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const chunk = formData.get("chunk") as File;
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const totalChunks = parseInt(formData.get("totalChunks") as string);
    const fileName = formData.get("fileName") as string;
    const fileId = formData.get("fileId") as string;

    if (!chunk || !fileName || !fileId) {
      return Response.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Diretório temporário para chunks
    const tempDir = path.join(process.cwd(), "temp", fileId);
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    // Salva o chunk
    const chunkPath = path.join(tempDir, `chunk-${chunkIndex}`);
    const bytes = await chunk.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(chunkPath, buffer);

    // Se for o último chunk, monta o arquivo final
    if (chunkIndex === totalChunks - 1) {
      const uploadDir = path.join(process.cwd(), "public", "uploads");

      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const finalPath = path.join(uploadDir, fileName);

      // Combina todos os chunks
      for (let i = 0; i < totalChunks; i++) {
        const chunkFile = path.join(tempDir, `chunk-${i}`);
        const chunkBuffer = await readFile(chunkFile);

        if (i === 0) {
          await writeFile(finalPath, chunkBuffer);
        } else {
          await appendFile(finalPath, chunkBuffer);
        }
      }

      // Limpa os chunks temporários
      rmSync(tempDir, { recursive: true, force: true });

      return Response.json({
        success: true,
        message: "Upload completo",
        fileName,
        finalPath: `/uploads/${fileName}`,
      });
    }

    return Response.json({
      success: true,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} recebido`,
    });
  } catch (error) {
    console.error("Erro no upload:", error);
    return Response.json({ error: "Erro ao processar chunk" }, { status: 500 });
  }
}
