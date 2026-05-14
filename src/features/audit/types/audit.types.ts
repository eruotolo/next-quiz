export interface AuditLogRow {
    id: string;
    action: string;
    entity: string | null;
    entityId: string | null;
    actorId: string | null;
    actorEmail: string | null;
    actorRole: string | null;
    academicInstitutionId: string | null;
    status: string;
    ip: string | null;
    userAgent: string | null;
    metadata: unknown;
    createdAt: Date;
    actor: { name: string; lastname: string; email: string } | null;
    institution: { name: string; slug: string } | null;
}

export interface AuditLogsResult {
    items: AuditLogRow[];
    total: number;
    page: number;
    perPage: number;
}

export interface InstitutionOption {
    id: string;
    name: string;
}
