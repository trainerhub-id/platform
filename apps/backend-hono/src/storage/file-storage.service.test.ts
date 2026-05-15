import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { FileStorageService, resolveSafeOutputPath, sanitizeFilename } from "./file-storage.service";

describe("file storage helpers", () => {
	it("sanitizes unsafe filenames", () => {
		expect(sanitizeFilename('../evil\r\n"name.docx')).toBe("evil___name.docx");
		expect(sanitizeFilename("Bukti 1 - Program.docx")).toBe("Bukti 1 - Program.docx");
	});

	it("resolves output path inside base directory", () => {
		const resolved = resolveSafeOutputPath("/tmp/trainerhub-output", "../evil.docx");
		expect(resolved).toBe("/tmp/trainerhub-output/evil.docx");
	});

	it("blocks reading files outside output directory", async () => {
		const dir = await mkdtemp(join(tmpdir(), "trainerhub-storage-"));
		try {
			const storage = new FileStorageService(dir);
			await expect(storage.readBuffer("/etc/passwd")).rejects.toThrow(/outside output directory/i);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});
});
