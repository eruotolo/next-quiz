/** Subset de NavItem que el helper necesita: solo `path` y opcionalmente `exact`.
 *  Acepta cualquier objeto compatible para no atar el test al shape completo. */
export interface NavItemLike {
    path: string;
    exact?: boolean;
}

// Dentro de un grupo, un hijo solo está activo si ningún otro hijo del
// mismo grupo tiene un match más específico. Evita el caso "Aula" + "Categoría"
// ambos resaltados al estar en /aula/categorias (prefijo común).
export function isItemActiveInGroup(
    item: NavItemLike,
    siblings: NavItemLike[],
    pathname: string,
    base: string,
): boolean {
    const href = base ? `${base}${item.path}` : item.path;
    const baseMatch = item.exact
        ? pathname === href
        : pathname === href || pathname.startsWith(href);
    if (!baseMatch) return false;
    return !siblings.some((other) => {
        if (other === item) return false;
        const otherHref = base ? `${base}${other.path}` : other.path;
        const otherMatch = other.exact
            ? pathname === otherHref
            : pathname === otherHref || pathname.startsWith(otherHref);
        return otherMatch && otherHref.length > href.length;
    });
}