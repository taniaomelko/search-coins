import { useState, useEffect, RefObject } from "react";
import { ICoin } from "../types";

export const useVirtualScroll = (
  ref: RefObject<HTMLElement>,
  array: ICoin[],
  childHeight = 0
) => {
  const [slidingWindow, setSlidingWindow] = useState<ICoin[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(0);

  useEffect(() => {
    const currentRef = ref.current;

    if (currentRef) {
      let startIndex = 0;
      const parentHeight = currentRef.clientHeight;
      const size = Math.ceil(parentHeight / childHeight) * 2;
      let endIndex = startIndex + size;

      const updateState = () => {
        setSlidingWindow(array.slice(startIndex, endIndex));
        setStartIndex(startIndex);
        setEndIndex(endIndex);
      };

      const incrementIndex = () => {
        endIndex = endIndex < array.length - 1 ? endIndex + 1 : endIndex;
        startIndex = endIndex - size;
      };

      const decrementIndex = () => {
        startIndex = startIndex > 0 ? startIndex - 1 : startIndex;
        endIndex = startIndex + size;
      };

      const onScroll = () => {
        const scrollTop = currentRef.scrollTop;
        const isOnTop = scrollTop < childHeight;
        const isOnBottom =
          currentRef.scrollHeight - scrollTop <
          currentRef.clientHeight + childHeight;
        if (isOnBottom && endIndex < array.length) {
          incrementIndex();
          updateState();
          currentRef.scrollTop -= childHeight;
        } else if (isOnTop && startIndex > 0) {
          decrementIndex();
          updateState();
          currentRef.scrollTop += childHeight;
        }
      };

      updateState();
      currentRef.addEventListener("scroll", onScroll);
      return () => {
        currentRef.removeEventListener("scroll", onScroll);
      };
    }
  }, [array, childHeight, ref]);

  return [slidingWindow, startIndex, endIndex];
};
