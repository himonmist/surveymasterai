import { prisma } from "./db";
import { fullSurveyInclude, type FullSurvey } from "./survey-service";
import { getCurrentSession } from "./session";

export type PublicSurveyError = { status: number; message: string };

export async function getPublishedSurveyBySlug(
  slug: string,
): Promise<{ survey: FullSurvey } | { error: PublicSurveyError }> {
  const survey = await prisma.survey.findUnique({ where: { slug }, include: fullSurveyInclude });

  if (!survey) return { error: { status: 404, message: "Survey not found." } };
  if (survey.status === "CLOSED" || survey.status === "ARCHIVED") {
    return { error: { status: 410, message: "This survey is no longer accepting responses." } };
  }
  if (survey.status === "PAUSED") {
    return { error: { status: 423, message: "This survey is temporarily paused." } };
  }
  if (survey.status === "DRAFT") {
    return { error: { status: 404, message: "Survey not found." } };
  }
  if (survey.closesAt && survey.closesAt < new Date()) {
    return { error: { status: 410, message: "This survey has closed." } };
  }

  if (survey.visibility === "ORG_ONLY" || survey.visibility === "INVITE_ONLY" || survey.visibility === "PRIVATE") {
    const session = await getCurrentSession();
    if (!session?.user) {
      return { error: { status: 401, message: "Sign in required to access this survey." } };
    }
    if (survey.visibility === "ORG_ONLY") {
      const membership = await prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: survey.organizationId, userId: session.user.id } },
      });
      if (!membership || !membership.isActive) {
        return { error: { status: 403, message: "This survey is only available to members of the organization." } };
      }
    }
    // INVITE_ONLY: any authenticated user may respond in this MVP; a full
    // implementation would check a per-survey invitation/recipient list.
  }

  return { survey };
}
