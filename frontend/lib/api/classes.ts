/**
 * 반/학생군 API 함수
 */

import { apiClient } from "./client";
import type { User } from "./auth/types";

export interface ClassMember {
    id: string;
    class_group: string;
    student: User;
    created_at: string;
    updated_at: string;
}

export interface Class {
    id: string;
    organization: string;
    name: string;
    description: string | null;
    created_by: string;
    members: ClassMember[];
    member_count: number;
    created_at: string;
    updated_at: string;
}

export const classesApi = {
    async list(): Promise<{ results: Class[] }> {
        return apiClient.get("/api/v1/classes/");
    },

    async get(id: string): Promise<Class> {
        return apiClient.get(`/api/v1/classes/${id}/`);
    },

    async create(data: { name: string; description?: string }): Promise<Class> {
        return apiClient.post("/api/v1/classes/", data);
    },

    async update(id: string, data: { name?: string; description?: string }): Promise<Class> {
        return apiClient.patch(`/api/v1/classes/${id}/`, data);
    },

    async delete(id: string): Promise<void> {
        return apiClient.delete(`/api/v1/classes/${id}/`);
    },

    async addMember(classId: string, studentId: string): Promise<ClassMember> {
        return apiClient.post(`/api/v1/classes/${classId}/add_member/`, {
            student_id: studentId,
        });
    },

    async removeMember(classId: string, memberId: string): Promise<void> {
        return apiClient.post(`/api/v1/classes/${classId}/remove_member/`, {
            member_id: memberId,
        });
    },
};
