import * as XLSX from 'xlsx';

export function generateExcelTemplate(): void {
    const headers = [
        'pregunta',
        'tipo',
        'puntos',
        'opcion1',
        'correcta1',
        'opcion2',
        'correcta2',
        'opcion3',
        'correcta3',
        'opcion4',
        'correcta4',
        'opcion5',
        'correcta5',
        'opcion6',
        'correcta6',
    ];

    const exampleRows = [
        [
            '¿Capital de Chile?',
            'unica',
            '1',
            'Santiago',
            'x',
            'Valparaíso',
            '',
            'Concepción',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
        ],
        [
            '¿Cuáles de los siguientes son planetas del sistema solar?',
            'multiple',
            '2',
            'Marte',
            'x',
            'Júpiter',
            'x',
            'La Luna',
            '',
            'Plutón',
            '',
            '',
            '',
            '',
            '',
        ],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);

    // Set column widths for readability
    ws['!cols'] = headers.map((h, i) => ({
        wch: i === 0 ? 50 : h.startsWith('correcta') ? 10 : 20,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Preguntas');
    XLSX.writeFile(wb, 'plantilla-preguntas.xlsx');
}

export function generateMarkdownTemplate(): void {
    const content = `## ¿Capital de Chile? [1 pts] [unica]
- [x] Santiago
- [ ] Valparaíso
- [ ] Concepción
- [ ] Antofagasta

## ¿Cuáles de los siguientes son planetas del sistema solar? [2 pts] [multiple]
- [x] Marte
- [x] Júpiter
- [ ] La Luna
- [ ] Plutón

## ¿En qué año se fundó la ciudad de Santiago? [1 pts] [unica]
- [ ] 1441
- [x] 1541
- [ ] 1641
- [ ] 1741
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-preguntas.md';
    a.click();
    URL.revokeObjectURL(url);
}
