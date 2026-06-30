import {
    Document,
    Image,
    Page,
    StyleSheet,
    Svg,
    Path,
    Text,
    View,
    renderToBuffer,
} from '@react-pdf/renderer';
import QRCode from 'qrcode';

const styles = StyleSheet.create({
    page: {
        backgroundColor: '#ffffff',
        padding: 0,
        fontFamily: 'Helvetica',
    },
    border: {
        position: 'absolute',
        top: 24,
        left: 24,
        right: 24,
        bottom: 24,
        borderWidth: 2,
        borderColor: '#0f172a',
        borderStyle: 'solid',
    },
    borderAccent: {
        position: 'absolute',
        top: 32,
        left: 32,
        right: 32,
        bottom: 32,
        borderWidth: 0.5,
        borderColor: '#cbd5e1',
        borderStyle: 'solid',
    },
    content: {
        flex: 1,
        paddingHorizontal: 80,
        paddingVertical: 100,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        fontSize: 22,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        letterSpacing: 2,
    },
    logoSub: {
        fontSize: 9,
        color: '#64748b',
        marginTop: 4,
        letterSpacing: 1.5,
    },
    title: {
        fontSize: 30,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 11,
        color: '#475569',
        textAlign: 'center',
        fontFamily: 'Helvetica-Oblique',
        marginBottom: 24,
    },
    label: {
        fontSize: 11,
        color: '#475569',
        textAlign: 'center',
        marginBottom: 8,
    },
    studentName: {
        fontSize: 26,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        textAlign: 'center',
        marginBottom: 4,
    },
    studentRut: {
        fontSize: 9,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 18,
    },
    courseLabel: {
        fontSize: 11,
        color: '#475569',
        textAlign: 'center',
        marginBottom: 6,
    },
    courseTitle: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
        textAlign: 'center',
        marginBottom: 4,
    },
    courseInstitution: {
        fontSize: 10,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 18,
    },
    grade: {
        fontSize: 12,
        color: '#0f172a',
        textAlign: 'center',
        marginBottom: 24,
    },
    gradeValue: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 14,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 24,
    },
    meta: {
        fontSize: 9,
        color: '#475569',
        lineHeight: 1.5,
    },
    metaBold: {
        fontFamily: 'Helvetica-Bold',
        color: '#0f172a',
    },
    qrBlock: {
        alignItems: 'center',
    },
    qrImage: {
        width: 90,
        height: 90,
    },
    qrCaption: {
        fontSize: 7,
        color: '#94a3b8',
        marginTop: 4,
        textAlign: 'center',
    },
    seal: {
        alignItems: 'center',
    },
    sealCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sealText: {
        fontSize: 7,
        color: '#0f172a',
        textAlign: 'center',
        fontFamily: 'Helvetica-Bold',
        letterSpacing: 0.5,
    },
});

export interface CertificatePdfInput {
    studentFullName: string;
    studentRut?: string | null;
    courseTitle: string;
    institutionName: string;
    finalGrade?: number | null;
    issuedAt: Date;
    verificationCode: string;
    verificationUrl: string;
}

interface CertificatePdfProps extends CertificatePdfInput {
    qrDataUrl: string;
}

function CertificatePdfDocument({
    studentFullName,
    studentRut,
    courseTitle,
    institutionName,
    finalGrade,
    issuedAt,
    verificationCode,
    verificationUrl,
    qrDataUrl,
}: CertificatePdfProps) {
    const formattedDate = issuedAt.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
    const hasGrade = finalGrade !== null && finalGrade !== undefined;

    return (
        <Document
            title={`Certificado ${verificationCode}`}
            author={institutionName}
            subject={`Certificado de finalización: ${courseTitle}`}
        >
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.border} fixed />
                <View style={styles.borderAccent} fixed />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.logo}>AULIKA</Text>
                        <Text style={styles.logoSub}>PLATAFORMA EDUCATIVA</Text>
                    </View>

                    <View style={{ alignItems: 'center', width: '100%' }}>
                        <Text style={styles.title}>Certificado de Finalización</Text>
                        <Text style={styles.subtitle}>
                            Otorgado a quien haya completado satisfactoriamente el curso
                        </Text>

                        <Text style={styles.label}>Por la presente se certifica que</Text>
                        <Text style={styles.studentName}>{studentFullName}</Text>
                        {studentRut ? (
                            <Text style={styles.studentRut}>RUT {studentRut}</Text>
                        ) : null}

                        <Text style={styles.courseLabel}>ha completado el curso</Text>
                        <Text style={styles.courseTitle}>{courseTitle}</Text>
                        <Text style={styles.courseInstitution}>{institutionName}</Text>

                        {hasGrade ? (
                            <Text style={styles.grade}>
                                Calificación final:{' '}
                                <Text style={styles.gradeValue}>
                                    {(finalGrade as number).toFixed(1)}
                                </Text>
                            </Text>
                        ) : null}
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.seal}>
                            <View style={styles.sealCircle}>
                                <Svg width="50" height="50" viewBox="0 0 50 50">
                                    <Path
                                        d="M25 5 L29 18 L42 18 L31 26 L35 39 L25 31 L15 39 L19 26 L8 18 L21 18 Z"
                                        fill="#0f172a"
                                    />
                                </Svg>
                            </View>
                            <Text style={[styles.sealText, { marginTop: 4 }]}>Sello oficial</Text>
                        </View>

                        <View style={styles.meta}>
                            <Text>
                                Emitido el <Text style={styles.metaBold}>{formattedDate}</Text>
                            </Text>
                            <Text>
                                Código de verificación:{' '}
                                <Text style={styles.metaBold}>{verificationCode}</Text>
                            </Text>
                            <Text>
                                Verificá este certificado en:{' '}
                                <Text style={styles.metaBold}>{verificationUrl}</Text>
                            </Text>
                        </View>

                        <View style={styles.qrBlock}>
                            <Image src={qrDataUrl} style={styles.qrImage} />
                            <Text style={styles.qrCaption}>Escaneá para verificar</Text>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
}

export async function generateCertificatePdfBuffer(input: CertificatePdfInput): Promise<Buffer> {
    const qrDataUrl = await QRCode.toDataURL(input.verificationUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 240,
    });
    return renderToBuffer(<CertificatePdfDocument {...input} qrDataUrl={qrDataUrl} />);
}
