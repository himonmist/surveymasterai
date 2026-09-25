import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const templates = await prisma.surveyTemplate.findMany({
    where: category && category !== "all" ? { category } : undefined,
    orderBy: { title: "asc" },
  });

  return NextResponse.json({ templates });
}
