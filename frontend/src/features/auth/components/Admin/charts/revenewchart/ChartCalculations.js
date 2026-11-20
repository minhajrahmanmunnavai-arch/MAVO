
export const calculateChartData = (activeData, width, height, paddingX, paddingY) => {
  const maxValue = Math.max(0, ...activeData.current, ...activeData.previous);
  const maxVal = maxValue > 0 ? maxValue * 1.15 : 1;

  const pointsCurrent = activeData.current.map((val, idx) => {
    const x =
      paddingX +
      (idx / (activeData.labels.length - 1 || 1)) *
        (width - paddingX * 2);

    const y =
      height -
      paddingY -
      (val / maxVal) * (height - paddingY * 2);

    return {
      x,
      y,
      val,
      label: activeData.labels[idx]
    };
  });

  const pointsPrev = activeData.previous.map((val, idx) => {
    const x =
      paddingX +
      (idx / (activeData.labels.length - 1 || 1)) *
        (width - paddingX * 2);

    const y =
      height -
      paddingY -
      (val / maxVal) * (height - paddingY * 2);

    return {
      x,
      y,
      val
    };
  });

  return {
    maxVal,
    pointsCurrent,
    pointsPrev
  };
};
