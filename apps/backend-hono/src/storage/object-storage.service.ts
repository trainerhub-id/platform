import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";

export type UploadResult = {
	key: string;
	url: string;
};

type S3Like = {
	send(command: unknown): Promise<unknown>;
};

type SignFn = (client: S3Like, command: { input: { Key?: string } }, options: { expiresIn: number }) => Promise<string>;

export type ObjectStorageOptions = {
	region?: string | undefined;
	bucket?: string | undefined;
	accessKeyId?: string | undefined;
	secretAccessKey?: string | undefined;
	endpoint?: string | undefined;
	publicUrl?: string | undefined;
	maxFileSizeMB?: number;
	allowedMimeTypes?: string[];
	client?: S3Like;
	sign?: SignFn;
	now?: () => number;
};

const defaultAllowedMimeTypes = [
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/gif",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/vnd.ms-excel",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const extensionMap: Record<string, string> = {
	"application/pdf": ".pdf",
	"image/png": ".png",
	"image/jpeg": ".jpg",
	"image/jpg": ".jpg",
	"application/msword": ".doc",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
	"application/vnd.ms-excel": ".xls",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
};

export function sanitizeObjectFilename(filename: string): string {
	const clean = filename.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/^\.+/, "");
	return clean.length > 0 ? clean : "file";
}

export function getExtensionForMimeType(mimeType: string): string {
	return extensionMap[mimeType] ?? ".bin";
}

export function buildPesertaDocumentPath(pesertaId: string): string {
	return `storage/peserta/${pesertaId}/dokumen`;
}

export function buildPesertaTugasPath(pesertaId: string): string {
	return `storage/peserta/${pesertaId}/tugas`;
}

export function buildPesertaAiPath(pesertaId: string): string {
	return `storage/peserta/${pesertaId}/ai`;
}

export function buildPesertaSertifikatPath(pesertaId: string): string {
	return `storage/peserta/${pesertaId}/sertifikat`;
}

export function buildCertificatePath(pesertaId: string, courseId: string): string {
	return `storage/peserta/${pesertaId}/certificates/${courseId}`;
}

function createS3Client(options: ObjectStorageOptions): S3Like {
	const config: ConstructorParameters<typeof S3Client>[0] = {
		region: options.region ?? env.AWS_REGION,
	};
	if (options.accessKeyId && options.secretAccessKey) {
		config.credentials = {
			accessKeyId: options.accessKeyId,
			secretAccessKey: options.secretAccessKey,
		};
	}
	if (options.endpoint) {
		config.endpoint = options.endpoint;
		config.forcePathStyle = false;
	}
	return new S3Client(config);
}

export class ObjectStorageService {
	private readonly client: S3Like;
	private readonly bucket: string;
	private readonly publicUrl: string | undefined;
	private readonly maxFileSizeMB: number;
	private readonly allowedMimeTypes: string[];
	private readonly sign: SignFn;
	private readonly now: () => number;

	constructor(options: ObjectStorageOptions = {}) {
		this.bucket = options.bucket ?? env.AWS_S3_BUCKET;
		this.publicUrl = options.publicUrl ?? env.R2_PUBLIC_URL;
		this.maxFileSizeMB = options.maxFileSizeMB ?? env.MAX_FILE_SIZE_MB;
		this.allowedMimeTypes = options.allowedMimeTypes ?? defaultAllowedMimeTypes;
		this.client = options.client ?? createS3Client({
			...options,
			region: options.region ?? env.AWS_REGION,
			accessKeyId: options.accessKeyId ?? env.AWS_ACCESS_KEY_ID,
			secretAccessKey: options.secretAccessKey ?? env.AWS_SECRET_ACCESS_KEY,
			endpoint: options.endpoint ?? env.AWS_S3_ENDPOINT,
		});
		this.sign = options.sign ?? ((client, command, signOptions) => getSignedUrl(client as never, command as never, signOptions));
		this.now = options.now ?? Date.now;
	}

	validateBufferSize(buffer: Buffer | Uint8Array, maxSizeMB = this.maxFileSizeMB): boolean {
		return buffer.byteLength <= maxSizeMB * 1024 * 1024;
	}

	validateMimeType(mimeType: string): boolean {
		return this.allowedMimeTypes.length === 0 || this.allowedMimeTypes.includes(mimeType);
	}

	async uploadBuffer(buffer: Buffer | Uint8Array, path: string, mimeType: string): Promise<UploadResult> {
		if (!this.validateBufferSize(buffer)) throw new Error(`Buffer size exceeds ${this.maxFileSizeMB}MB limit`);
		if (!this.validateMimeType(mimeType)) throw new Error(`File type ${mimeType} is not allowed`);
		const key = `${path}/${this.now()}${getExtensionForMimeType(mimeType)}`;
		await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: mimeType }));
		return { key, url: await this.getSignedUrl(key) };
	}

	async upload(file: { originalname: string; buffer: Buffer | Uint8Array; mimetype: string; size: number }, path: string): Promise<UploadResult> {
		if (!this.validateBufferSize(file.buffer)) throw new Error(`File size exceeds ${this.maxFileSizeMB}MB limit`);
		if (!this.validateMimeType(file.mimetype)) throw new Error(`File type ${file.mimetype} is not allowed`);
		const filename = sanitizeObjectFilename(file.originalname);
		const key = `${path}/${this.now()}-${filename}`;
		await this.client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: file.buffer, ContentType: file.mimetype }));
		return { key, url: await this.getSignedUrl(key) };
	}

	async delete(key: string): Promise<void> {
		await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
	}

	async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
		return this.sign(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }) as { input: { Key?: string } }, { expiresIn });
	}

	async getPublicUrl(key: string): Promise<string> {
		if (this.publicUrl) return `${this.publicUrl.replace(/\/$/, "")}/${key}`;
		return this.getSignedUrl(key);
	}

	hasPublicUrl(): boolean {
		return !!this.publicUrl;
	}

	buildPesertaDocumentPath = buildPesertaDocumentPath;
	buildPesertaTugasPath = buildPesertaTugasPath;
	buildPesertaAiPath = buildPesertaAiPath;
	buildPesertaSertifikatPath = buildPesertaSertifikatPath;
	buildCertificatePath = buildCertificatePath;
}
