import { NextResponse } from "next/server";
import { prisma } from "./db";
import { jsonError, type ApiOrgContext } from "./api";
import { can, type Permission } from "@surveymasterai/auth";

export async function getOwnedSurveyOrError(surveyId: string, ctx: ApiOrgContext, permission: Permission) {
  const survey = await prisma.survey.findUnique({ where: { id: surveyId } });

  if (!survey || (survey.organizationId !== ctx.organizationId && !ctx.isSuperAdmin)) {
    return jsonError("Survey not found", 404);
  }

  if (!ctx.isSuperAdmin && !can(ctx.role, permission)) {
    return jsonError("Forbidden", 403);
  }

  return survey;
}

export function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
