// When the keyboard opens, scroll the focused text field into view if the
// keyboard (or the screen edge) would otherwise cover it. Works with a
// ScrollView or FlatList — pass its ref and a function that scrolls it to an
// absolute offset, then hand the returned onScroll to the list so we know
// where it currently is.
import { useCallback, useEffect, useRef } from 'react';
import { Keyboard, NativeScrollEvent, NativeSyntheticEvent, TextInput } from 'react-native';

const MARGIN = 24;

export function useKeyboardScrollIntoView(ref: React.RefObject<any>, scrollToOffset: (offset: number) => void) {
  const offset = useRef(0);
  const scrollFn = useRef(scrollToOffset);
  scrollFn.current = scrollToOffset;

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', (event) => {
      // Let any keyboard-avoiding resize settle before measuring.
      setTimeout(() => {
        const input = TextInput.State.currentlyFocusedInput?.();
        const raw = ref.current;
        const scroller = raw?.getNativeScrollRef?.() ?? raw;
        if (!input || !scroller?.measureInWindow) return;
        scroller.measureInWindow((_x: number, top: number, _w: number, height: number) => {
          const visibleBottom = Math.min(top + height, event.endCoordinates.screenY);
          input.measureInWindow((_ix: number, inputTop: number, _iw: number, inputHeight: number) => {
            const inputBottom = inputTop + inputHeight;
            if (inputBottom + MARGIN > visibleBottom) {
              scrollFn.current(Math.max(0, offset.current + inputBottom + MARGIN - visibleBottom));
            } else if (inputTop < top) {
              scrollFn.current(Math.max(0, offset.current - (top - inputTop) - MARGIN));
            }
          });
        });
      }, 120);
    });
    return () => sub.remove();
  }, [ref]);

  return useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = e.nativeEvent.contentOffset.y;
  }, []);
}
