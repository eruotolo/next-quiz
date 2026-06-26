interface JsonLdProps {
    data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
    return (
        <script
            type="application/ld+json"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is controlled data, not user input
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}
