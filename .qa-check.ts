import { prisma } from "./src/shared/lib/prisma";

async function main() {
	const arg = process.argv[2];
	const arg2 = process.argv[3];

	if (arg === "courses") {
		const rows = await prisma.lmsCourse.findMany({
			select: { id: true, title: true, published: true },
			orderBy: { title: "asc" },
		});
		console.log("COURSES:", JSON.stringify(rows, null, 2));
	} else if (arg === "exam") {
		const rows = await prisma.exam.findMany({
			where: { title: { contains: arg2 || "TC05" } },
			select: {
				id: true,
				title: true,
				active: true,
				timeLimit: true,
				groups: { select: { name: true } },
				_count: { select: { questions: true } },
			},
		});
		console.log("EXAM:", JSON.stringify(rows, null, 2));
	} else if (arg === "lms-off" || arg === "lms-on") {
		const val = arg === "lms-on";
		const r = await prisma.academicInstitution.update({
			where: { slug: "lms-testing" },
			data: { lmsEnabled: val },
			select: { slug: true, lmsEnabled: true },
		});
		console.log("TOGGLE:", JSON.stringify(r));
	} else {
		const rows = await prisma.academicInstitution.findMany({
			where: { slug: { in: ["lms-testing", "preu-qa-test-940213"] } },
			select: {
				slug: true,
				plan: true,
				examsEnabled: true,
				lmsEnabled: true,
				type: true,
			},
		});
		console.log("STATUS:", JSON.stringify(rows, null, 2));
	}
	await prisma.$disconnect();
}

main().catch((e) => {
	console.error("ERR:", e?.message || e);
	process.exit(1);
});
