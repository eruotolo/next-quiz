import { describe, expect, it } from 'vitest';
import { isItemActiveInGroup, type NavItemLike } from '../../lib/nav-active';

// El helper solo necesita `path` y opcionalmente `exact`; tipamos flojo a propósito
// para que el test no dependa de la estructura completa de `NavItem` del Sidebar.
type Child = NavItemLike;

const base = '/demo';

const lmsChildren: Child[] = [
    { path: '/aula' },
    { path: '/aula/categorias' },
    { path: '/aula/foro' },
];

describe('isItemActiveInGroup', () => {
    const aula = lmsChildren[0];
    const categoria = lmsChildren[1];
    const foro = lmsChildren[2];

    if (!aula || !categoria || !foro) {
        throw new Error('lmsChildren mal definido');
    }

    it('resalta el item exacto cuando pathname coincide', () => {
        expect(isItemActiveInGroup(aula, lmsChildren, '/demo/aula', base)).toBe(true);
        expect(isItemActiveInGroup(categoria, lmsChildren, '/demo/aula/categorias', base)).toBe(
            true,
        );
        expect(isItemActiveInGroup(foro, lmsChildren, '/demo/aula/foro', base)).toBe(true);
    });

    it('no resalta "Aula" cuando hay un hijo con prefijo más específico', () => {
        // Bug original: en /aula/categorias quedaban "Aula" y "Categoría" ambos activos.
        expect(isItemActiveInGroup(aula, lmsChildren, '/demo/aula/categorias', base)).toBe(false);
        expect(isItemActiveInGroup(aula, lmsChildren, '/demo/aula/foro', base)).toBe(false);
    });

    it('resalta el hijo más específico en rutas anidadas', () => {
        expect(isItemActiveInGroup(categoria, lmsChildren, '/demo/aula/categorias/123', base)).toBe(
            true,
        );
        expect(isItemActiveInGroup(aula, lmsChildren, '/demo/aula/categorias/123', base)).toBe(
            false,
        );
    });

    it('no resalta nada si pathname está fuera del grupo', () => {
        expect(isItemActiveInGroup(aula, lmsChildren, '/demo/exams', base)).toBe(false);
        expect(isItemActiveInGroup(categoria, lmsChildren, '/demo/exams', base)).toBe(false);
    });

    it('respeta el flag exact cuando está seteado', () => {
        const exactChildren: Child[] = [
            { path: '/aula', exact: true },
            { path: '/aula/categorias' },
        ];
        const aulaExact = exactChildren[0];
        const categoriaExact = exactChildren[1];
        if (!aulaExact || !categoriaExact) throw new Error('exactChildren mal definido');
        // Con exact:true, /aula/categorias NO matchea "Aula"
        expect(
            isItemActiveInGroup(aulaExact, exactChildren, '/demo/aula/categorias', base),
        ).toBe(false);
        // Pero sí matchea /aula exacto
        expect(isItemActiveInGroup(aulaExact, exactChildren, '/demo/aula', base)).toBe(true);
        // Y el hermano sigue funcionando
        expect(
            isItemActiveInGroup(categoriaExact, exactChildren, '/demo/aula/categorias', base),
        ).toBe(true);
    });
});