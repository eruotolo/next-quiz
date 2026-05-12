import { prisma } from '@/lib/prisma';
import { formatRut } from '@/lib/rut';
import { BarChart3, Users } from 'lucide-react';

export default async function ResultsPage() {
    const results = await prisma.result.findMany({
        include: {
            student: { select: { name: true, lastname: true, rut: true } },
            exam: { select: { id: true, title: true, group: { select: { name: true } } } },
        },
        orderBy: { completedAt: 'desc' },
    });

    const byExam = new Map<string, { title: string; group: string; results: typeof results }>();
    for (const r of results) {
        const key = r.examId;
        if (!byExam.has(key)) {
            byExam.set(key, { title: r.exam.title, group: r.exam.group.name, results: [] });
        }
        byExam.get(key)?.results.push(r);
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-default-900 text-2xl font-bold">Resultados</h1>
                <p className="text-default-500 text-sm">{results.length} entregas en total</p>
            </div>

            {results.length === 0 ? (
                <div className="border-default-200 flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white py-20">
                    <BarChart3 size={40} className="text-default-300 mb-3" />
                    <p className="text-default-500 font-medium">Todavía no hay resultados</p>
                    <p className="text-default-400 mt-1 text-sm">
                        Los resultados aparecerán aquí cuando los alumnos completen exámenes.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Array.from(byExam.entries()).map(([examId, data]) => (
                        <div
                            key={examId}
                            className="border-default-100 overflow-hidden rounded-2xl border bg-white shadow-sm"
                        >
                            <div className="border-default-100 bg-default-50 border-b px-6 py-4">
                                <h2 className="text-default-900 font-semibold">{data.title}</h2>
                                <p className="text-default-500 mt-0.5 flex items-center gap-1 text-sm">
                                    <Users size={13} />
                                    {data.group} · {data.results.length} alumno
                                    {data.results.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-default-100 border-b">
                                        <tr>
                                            <th className="text-default-500 px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                                Alumno
                                            </th>
                                            <th className="text-default-500 px-6 py-3 text-left text-xs font-semibold tracking-wide uppercase">
                                                RUT
                                            </th>
                                            <th className="text-default-500 px-6 py-3 text-center text-xs font-semibold tracking-wide uppercase">
                                                Puntaje
                                            </th>
                                            <th className="text-default-500 px-6 py-3 text-center text-xs font-semibold tracking-wide uppercase">
                                                %
                                            </th>
                                            <th className="text-default-500 px-6 py-3 text-right text-xs font-semibold tracking-wide uppercase">
                                                Entregado
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-default-50 divide-y">
                                        {data.results.map((r) => {
                                            const pct =
                                                r.maxScore > 0
                                                    ? Math.round((r.score / r.maxScore) * 100)
                                                    : 0;
                                            return (
                                                <tr
                                                    key={r.id}
                                                    className="hover:bg-default-50 transition-colors"
                                                >
                                                    <td className="text-default-900 px-6 py-4 font-medium">
                                                        {r.student.name} {r.student.lastname}
                                                    </td>
                                                    <td className="text-default-600 px-6 py-4 font-mono text-sm">
                                                        {formatRut(r.student.rut)}
                                                    </td>
                                                    <td className="text-default-900 px-6 py-4 text-center text-sm font-semibold">
                                                        {r.score}/{r.maxScore}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span
                                                            className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                                pct >= 70
                                                                    ? 'bg-success-50 text-success-700'
                                                                    : pct >= 50
                                                                      ? 'bg-warning-50 text-warning-700'
                                                                      : 'bg-danger-50 text-danger-700'
                                                            }`}
                                                        >
                                                            {pct}%
                                                        </span>
                                                    </td>
                                                    <td className="text-default-500 px-6 py-4 text-right text-sm">
                                                        {new Date(r.completedAt).toLocaleDateString(
                                                            'es-CL',
                                                            {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            },
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
