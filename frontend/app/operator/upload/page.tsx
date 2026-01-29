"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { sourceDocumentsApi } from "@/lib/api/source-documents";

interface FileWithPreview {
  file: File;
  id: string;
  preview?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("");
  const [copyrightInfo, setCopyrightInfo] = useState("");
  const [examYear, setExamYear] = useState("");
  const [examMonth, setExamMonth] = useState("");
  const [examRound, setExamRound] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: FileWithPreview[] = selectedFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
    }));
    setFiles([...files, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: FileWithPreview[] = droppedFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
    }));
    setFiles([...files, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (files.length === 0) {
      setError("최소 하나의 파일을 선택해주세요.");
      return;
    }

    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      // 각 파일을 개별적으로 업로드 (다중 파일 지원)
      for (const fileItem of files) {
        await sourceDocumentsApi.create({
          title: files.length === 1 ? title : `${title} - ${fileItem.file.name}`,
          file: fileItem.file,
          source: source || undefined,
          copyright_info: copyrightInfo || undefined,
          exam_year: examYear ? parseInt(examYear) : undefined,
          exam_month: examMonth ? parseInt(examMonth) : undefined,
          exam_round: examRound ? parseInt(examRound) : undefined,
        });
      }

      // 업로드 완료 후 추출 작업 페이지로 이동
      router.push("/operator/ingestions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <AppShell title="파일 업로드" role="operator">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <div
            className="rounded-3xl border border-dashed border-ink/30 bg-white/60 p-10 text-center cursor-pointer hover:border-ink/50 transition"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <p className="font-display text-xl">파일을 드래그하거나 클릭하여 업로드</p>
            <p className="mt-2 text-sm text-slate">PDF, PNG, JPG (최대 50MB)</p>
            <button
              type="button"
              className="mt-6 rounded-full bg-ink px-5 py-2 text-sm text-white"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              파일 선택
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-ink">{fileItem.file.name}</p>
                    <p className="text-xs text-slate">{formatFileSize(fileItem.file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(fileItem.id)}
                    className="text-xs text-coral hover:underline"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <form className="card p-6" onSubmit={handleSubmit}>
          <h2 className="section-title">소스 문서 정보</h2>
          {error && (
            <div className="mt-4 rounded-2xl bg-coral/10 border border-coral/30 px-4 py-3 text-sm text-coral">
              {error}
            </div>
          )}
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-slate">제목 *</label>
              <input
                className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-sm text-slate">출처</label>
              <input
                className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-slate">출제 연도</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                  placeholder="2024"
                  type="number"
                  value={examYear}
                  onChange={(e) => setExamYear(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-sm text-slate">월</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                  placeholder="3"
                  type="number"
                  min="1"
                  max="12"
                  value={examMonth}
                  onChange={(e) => setExamMonth(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-sm text-slate">회차</label>
                <input
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                  placeholder="1"
                  type="number"
                  min="1"
                  value={examRound}
                  onChange={(e) => setExamRound(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate">저작권 정보</label>
              <textarea
                className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                rows={4}
                value={copyrightInfo}
                onChange={(e) => setCopyrightInfo(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-full border border-ink/20 px-4 py-2 text-sm"
                disabled={loading}
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading || files.length === 0}
                className="rounded-full bg-ink px-4 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "업로드 중..." : "업로드 및 추출 시작"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
