"use server";

import { prisma } from "@/lib/prisma";
import { getRequiredUser } from "@/lib/auth-server";
import { type ActionResult, success, failure, type Category } from "@/types";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "@/lib/validations";
import type { Category as PrismaCategory } from "@/generated/prisma/client";

// Helper: Convert Prisma category to API category type
function toCategory(category: PrismaCategory): Category {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export async function getCategories(): Promise<
  ActionResult<{ categories: Category[] }>
> {
  try {
    const user = await getRequiredUser();

    const categories = await prisma.category.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
    });

    return success({ categories: categories.map(toCategory) });
  } catch (error) {
    console.error("getCategories error:", error);
    return failure("カテゴリの取得に失敗しました", "INTERNAL_ERROR");
  }
}

export async function createCategory(
  input: CreateCategoryInput
): Promise<ActionResult<{ category: Category }>> {
  try {
    const parsed = createCategorySchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { name, color } = parsed.data;

    // Check for duplicate name
    const existing = await prisma.category.findFirst({
      where: {
        userId: user.id,
        name: { equals: name.trim(), mode: "insensitive" },
      },
    });
    if (existing) {
      return failure("同じ名前のカテゴリが既に存在します", "CONFLICT");
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        color,
        userId: user.id,
      },
    });

    return success({ category: toCategory(category) });
  } catch (error) {
    console.error("createCategory error:", error);
    return failure("カテゴリの作成に失敗しました", "INTERNAL_ERROR");
  }
}

export async function updateCategory(
  input: UpdateCategoryInput
): Promise<ActionResult<{ category: Category }>> {
  try {
    const parsed = updateCategorySchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id, name, color } = parsed.data;

    // Verify category belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingCategory) {
      return failure("カテゴリが見つかりません", "NOT_FOUND");
    }

    // Check for duplicate name if name is being changed
    if (name && name.trim().toLowerCase() !== existingCategory.name.toLowerCase()) {
      const duplicate = await prisma.category.findFirst({
        where: {
          userId: user.id,
          name: { equals: name.trim(), mode: "insensitive" },
          id: { not: id },
        },
      });
      if (duplicate) {
        return failure("同じ名前のカテゴリが既に存在します", "CONFLICT");
      }
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (color !== undefined) updateData.color = color;

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return success({ category: toCategory(category) });
  } catch (error) {
    console.error("updateCategory error:", error);
    return failure("カテゴリの更新に失敗しました", "INTERNAL_ERROR");
  }
}

export async function deleteCategory(
  input: { id: string }
): Promise<ActionResult<{ id: string }>> {
  try {
    const parsed = categoryIdSchema.safeParse(input);
    if (!parsed.success) {
      return failure(parsed.error.issues[0].message, "VALIDATION_ERROR");
    }

    const user = await getRequiredUser();
    const { id } = parsed.data;

    // Verify category belongs to user
    const existingCategory = await prisma.category.findFirst({
      where: { id, userId: user.id },
    });
    if (!existingCategory) {
      return failure("カテゴリが見つかりません", "NOT_FOUND");
    }

    // Delete category (tasks will have categoryId set to null via onDelete: SetNull)
    await prisma.category.delete({ where: { id } });

    return success({ id });
  } catch (error) {
    console.error("deleteCategory error:", error);
    return failure("カテゴリの削除に失敗しました", "INTERNAL_ERROR");
  }
}
