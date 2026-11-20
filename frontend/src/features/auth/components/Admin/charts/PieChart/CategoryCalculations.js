
export const calculateCategorySegments = (
  categories,
  circumference
) => {
  let cumulativePercent = 0;

  return categories.map((category) => {
    const strokeDasharray =
      `${(category.percentage / 100) * circumference} ${circumference}`;

    const strokeDashoffset =
      -((cumulativePercent / 100) * circumference);

    cumulativePercent += category.percentage;

    return {
      ...category,
      strokeDasharray,
      strokeDashoffset
    };
  });
};
