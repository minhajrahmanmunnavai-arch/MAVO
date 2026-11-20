
export const createSmoothPath = (points) => {
  if (points.length === 0) return '';

  return points.reduce((acc, point, index, arr) => {
    if (index === 0) {
      return `M ${point.x},${point.y}`;
    }

    const previous = arr[index - 1];
    const cx = (previous.x + point.x) / 2;

    return `${acc} C ${cx},${previous.y} ${cx},${point.y} ${point.x},${point.y}`;
  }, '');
};

export const createAreaPath = (points, path, height, paddingY) => {
  if (points.length === 0) return '';

  return `${path} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;
};
