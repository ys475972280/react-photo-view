import { animationType } from './types';
import { maxTouchTime, defaultAnimationConfig } from './variables';

/**
 * 是否为移动端设备
 */
export const isMobile: boolean = window.navigator.userAgent.includes('Mobile');

/**
 * 获取图片合适的大小
 * @param naturalWidth 图片真实宽度
 * @param naturalHeight 图片真实高度
 * @return 图片合适的大小
 */
export const getSuitableImageSize = (
  naturalWidth: number,
  naturalHeight: number,
): {
  width: number;
  height: number;
} => {
  let width = 0;
  let height = 0;
  const { innerWidth, innerHeight } = window;
  if (naturalWidth < innerWidth && naturalHeight < innerHeight) {
    width = naturalWidth;
    height = naturalHeight;
  } else if (naturalWidth < innerWidth && naturalHeight >= innerHeight) {
    width = (naturalWidth / naturalHeight) * innerHeight;
    height = innerHeight;
  } else if (naturalWidth >= innerWidth && naturalHeight < innerHeight) {
    width = innerWidth;
    height = (naturalHeight / naturalWidth) * innerWidth;
  } else if (
    naturalWidth >= innerWidth &&
    naturalHeight >= innerHeight &&
    naturalWidth / naturalHeight > innerWidth / innerHeight
  ) {
    width = innerWidth;
    height = (naturalHeight / naturalWidth) * innerWidth;
  } else {
    width = (naturalWidth / naturalHeight) * innerHeight;
    height = innerHeight;
  }
  return {
    width: Math.floor(width),
    height: Math.floor(height),
  };
};

export const getPositionOnScale = ({
  x,
  y,
  pageX,
  pageY,
  fromScale,
  toScale,
}: {
  x: number;
  y: number;
  pageX: number;
  pageY: number;
  fromScale: number;
  toScale: number;
}): {
  x: number;
  y: number;
  scale: number;
} => {
  const { innerWidth, innerHeight } = window;
  let endScale = toScale;
  let nextX = x;
  let nextY = y;
  // 缩放限制
  if (toScale < 0.5) {
    endScale = 0.5;
  } else if (toScale > 5) {
    endScale = 5;
  } else {
    const centerPageX = innerWidth / 2;
    const centerPageY = innerHeight / 2;
    // 坐标偏移
    const lastPositionX = centerPageX + x;
    const lastPositionY = centerPageY + y;

    // 放大偏移量
    const offsetScale = endScale - fromScale;

    if (offsetScale > 0) {
      const scale = Math.abs(endScale / fromScale - 1);
      nextX = pageX - (pageX - lastPositionX) * Math.pow(2, scale) - centerPageX;
      nextY = pageY - (pageY - lastPositionY) * Math.pow(2, scale) - centerPageY;
    } else {
      nextX = pageX - (pageX - lastPositionX) / (1 - offsetScale) - centerPageX;
      nextY = pageY - (pageY - lastPositionY) / (1 - offsetScale) - centerPageY;
    }
  }
  return {
    x: nextX,
    y: nextY,
    scale: endScale,
  };
};

export const slideToPosition = ({
  x,
  y,
  lastX,
  lastY,
  touchedTime,
}: {
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  touchedTime: number;
}): {
  endX: number;
  endY: number;
} & animationType => {
  const moveTime = Date.now() - touchedTime;
  const speedX = (x - lastX) / moveTime;
  const speedY = (y - lastY) / moveTime;
  const maxSpeed = Math.max(speedX, speedY);
  const slideTime = moveTime < maxTouchTime ? Math.abs(maxSpeed) * 10 + 400 : 0;
  return {
    endX: Math.floor(x + speedX * slideTime),
    endY: Math.floor(y + speedY * slideTime),
    animation: {
      stiffness: 170,
      damping: 32,
    },
  };
};

/**
 * 跳转到合适的图片偏移量
 */
export const jumpToSuitableOffset = ({
  x,
  y,
  lastX,
  lastY,
  width,
  height,
  scale,
  touchedTime,
  hasMove,
}: {
  x: number;
  y: number;
  lastX: number;
  lastY: number;
  width: number;
  height: number;
  scale: number;
  touchedTime: number;
  hasMove: boolean;
}): {
  x: number;
  y: number;
} & animationType => {
  // 没有移动图片
  if (!hasMove) {
    return {
      x,
      y,
      animation: defaultAnimationConfig,
    };
  }

  const { innerWidth, innerHeight } = window;
  // 图片超出的长度
  const outOffsetX = (width * scale - innerWidth) / 2;
  const outOffsetY = (height * scale - innerHeight) / 2;

  // 滑动到结果的位置
  const { endX, endY, animation } = slideToPosition({ x, y, lastX, lastY, touchedTime });

  let currentX = endX;
  let currentY = endY;

  if (width * scale <= innerWidth) {
    currentX = 0;
  } else if (endX > 0 && outOffsetX - endX <= 0) {
    currentX = outOffsetX;
  } else if (endX < 0 && outOffsetX + endX <= 0) {
    currentX = -outOffsetX;
  }
  if (height * scale <= innerHeight) {
    currentY = 0;
  } else if (endY > 0 && outOffsetY - endY <= 0) {
    currentY = outOffsetY;
  } else if (endY < 0 && outOffsetY + endY <= 0) {
    currentY = -outOffsetY;
  }

  const isSlide = currentX === endX || currentY === endY;

  return {
    x: currentX,
    y: currentY,
    animation: isSlide ? defaultAnimationConfig : animation,
  };
};
