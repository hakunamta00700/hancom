"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { classesApi } from "@/lib/api/classes";
import { authApi } from "@/lib/auth/api";
import type { Class, ClassMember } from "@/lib/api/classes";
import type { User } from "@/lib/auth/types";

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  
  // 새 반 생성 폼
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");

  useEffect(() => {
    loadClasses();
    loadStudents();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await classesApi.list();
      setClasses(response.results);
    } catch (err) {
      console.error("반 목록 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await authApi.getStudents();
      setStudents(response.results);
    } catch (err) {
      console.error("학생 목록 로드 실패:", err);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    
    try {
      await classesApi.create({
        name: newClassName,
        description: newClassDescription || undefined,
      });
      setNewClassName("");
      setNewClassDescription("");
      setShowCreateModal(false);
      await loadClasses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "반 생성 실패");
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("이 반을 삭제하시겠습니까?")) return;
    
    try {
      await classesApi.delete(classId);
      await loadClasses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "반 삭제 실패");
    }
  };

  const handleManageClass = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowManageModal(true);
  };

  const handleAddMember = async (studentId: string) => {
    if (!selectedClass) return;
    
    try {
      await classesApi.addMember(selectedClass.id, studentId);
      const updated = await classesApi.get(selectedClass.id);
      setSelectedClass(updated);
      await loadClasses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "학생 추가 실패");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedClass) return;
    
    try {
      await classesApi.removeMember(selectedClass.id, memberId);
      const updated = await classesApi.get(selectedClass.id);
      setSelectedClass(updated);
      await loadClasses();
    } catch (err) {
      alert(err instanceof Error ? err.message : "학생 제거 실패");
    }
  };

  return (
    <AppShell title="반/학생군 관리" role="teacher">
      <div className="card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="section-title">반/학생군 목록</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-full bg-ink px-4 py-2 text-sm text-white hover:bg-ink/90"
          >
            새 반 만들기
          </button>
        </div>

        {loading ? (
          <div className="text-center text-slate">로딩 중...</div>
        ) : classes.length === 0 ? (
          <div className="text-center text-slate">생성된 반이 없습니다.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {classes.map((classItem) => (
              <div key={classItem.id} className="rounded-3xl border border-ink/10 bg-white/70 p-6">
                <h3 className="font-display text-xl">{classItem.name}</h3>
                {classItem.description && (
                  <p className="mt-2 text-sm text-slate">{classItem.description}</p>
                )}
                <p className="mt-2 text-sm text-slate">
                  학생 수: {classItem.member_count}명
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleManageClass(classItem)}
                    className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:bg-ink/5"
                  >
                    관리
                  </button>
                  <button
                    onClick={() => handleDeleteClass(classItem.id)}
                    className="rounded-full border border-ink/20 px-4 py-2 text-sm hover:bg-coral/10"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 새 반 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-md p-6">
            <h3 className="section-title mb-4">새 반 만들기</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="text-sm text-slate">반 이름 *</label>
                <input
                  type="text"
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-slate">설명</label>
                <textarea
                  className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3"
                  rows={3}
                  value={newClassDescription}
                  onChange={(e) => setNewClassDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewClassName("");
                    setNewClassDescription("");
                  }}
                  className="flex-1 rounded-full border border-ink/20 px-4 py-2 text-sm"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-ink px-4 py-2 text-sm text-white"
                >
                  생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 반 관리 모달 */}
      {showManageModal && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-title">{selectedClass.name} 관리</h3>
              <button
                onClick={() => {
                  setShowManageModal(false);
                  setSelectedClass(null);
                }}
                className="rounded-full border border-ink/20 px-3 py-1 text-sm"
              >
                닫기
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">학생 목록 ({selectedClass.member_count}명)</h4>
                <div className="space-y-2">
                  {selectedClass.members && selectedClass.members.length > 0 ? (
                    selectedClass.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm"
                      >
                        <span>{member.student.name} ({member.student.email})</span>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="rounded-full border border-ink/20 px-2 py-1 text-xs hover:bg-coral/10"
                        >
                          제거
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate">학생이 없습니다.</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold mb-2">학생 추가</h4>
                {students.length > 0 ? (
                  <div className="space-y-2">
                    {students
                      .filter(
                        (student) =>
                          !selectedClass.members.some(
                            (member) => member.student.id === student.id
                          )
                      )
                      .map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 text-sm"
                        >
                          <span>
                            {student.name} ({student.email})
                          </span>
                          <button
                            onClick={() => handleAddMember(student.id)}
                            className="rounded-full border border-ink/20 px-2 py-1 text-xs hover:bg-ink/5"
                          >
                            추가
                          </button>
                        </div>
                      ))}
                    {students.filter(
                      (student) =>
                        !selectedClass.members.some(
                          (member) => member.student.id === student.id
                        )
                    ).length === 0 && (
                      <p className="text-sm text-slate">추가할 학생이 없습니다.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate">학생 목록을 불러올 수 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
