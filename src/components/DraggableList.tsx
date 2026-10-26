// A drag-to-reorder list: each row gets a dotted grip you press and drag; the
// row lifts, the others slide out of the way, and onReorder is called with the
// new order of keys when you let go. Written with PanResponder and Animated
// only (no native gesture library), so it ships as an ordinary update.
// Rows can be different heights; they're measured as they lay out.
import React, { useRef, useState } from 'react';
import { View, Animated, PanResponder, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

const GAP = 8;
const DEFAULT_HEIGHT = 54;

interface GripProps {
  label: string;
  onStart: () => void;
  onMove: (dy: number) => void;
  onEnd: (dy: number) => void;
}

function Grip({ label, onStart, onMove, onEnd }: GripProps) {
  const callbacks = useRef({ onStart, onMove, onEnd });
  callbacks.current = { onStart, onMove, onEnd };
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // Once the grip is held, the surrounding ScrollView doesn't get it.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => callbacks.current.onStart(),
      onPanResponderMove: (_, g) => callbacks.current.onMove(g.dy),
      onPanResponderRelease: (_, g) => callbacks.current.onEnd(g.dy),
      onPanResponderTerminate: (_, g) => callbacks.current.onEnd(g.dy),
    })
  ).current;

  return (
    <View
      {...responder.panHandlers}
      accessibilityRole="adjustable"
      accessibilityLabel={`Drag to reorder ${label}`}
      style={styles.grip}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={styles.gripDot} />
      ))}
    </View>
  );
}

interface Props<T> {
  items: T[];
  keyOf: (item: T) => string;
  labelOf: (item: T) => string;
  /** Renders one row; put `grip` wherever the handle should sit. */
  renderItem: (item: T, grip: React.ReactNode, state: { isDragging: boolean }) => React.ReactNode;
  onReorder: (orderedKeys: string[]) => void;
  /** Lets the screen turn its ScrollView off while a row is being dragged. */
  onDragStateChange?: (dragging: boolean) => void;
}

export function DraggableList<T>({ items, keyOf, labelOf, renderItem, onReorder, onDragStateChange }: Props<T>) {
  const keys = items.map(keyOf);
  const keysRef = useRef(keys);
  keysRef.current = keys;
  const heights = useRef<Record<string, number>>({});
  const shifts = useRef<Record<string, Animated.Value>>({});
  const dragY = useRef(new Animated.Value(0)).current;
  const drag = useRef({ key: '', from: 0, to: 0 });
  const [draggingKey, setDraggingKey] = useState<string | null>(null);

  const shiftOf = (key: string) => {
    if (!shifts.current[key]) shifts.current[key] = new Animated.Value(0);
    return shifts.current[key];
  };
  const heightOf = (key: string) => heights.current[key] ?? DEFAULT_HEIGHT;
  const offsetOf = (index: number) =>
    keysRef.current.slice(0, index).reduce((sum, k) => sum + heightOf(k) + GAP, 0);

  const animateShifts = (from: number, to: number) => {
    const moved = heightOf(keysRef.current[from]) + GAP;
    keysRef.current.forEach((k, j) => {
      if (j === from) return;
      let target = 0;
      if (from < to && j > from && j <= to) target = -moved;
      if (from > to && j >= to && j < from) target = moved;
      Animated.timing(shiftOf(k), { toValue: target, duration: 140, useNativeDriver: true }).start();
    });
  };

  const start = (key: string) => {
    const from = keysRef.current.indexOf(key);
    drag.current = { key, from, to: from };
    dragY.setValue(0);
    setDraggingKey(key);
    onDragStateChange?.(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const move = (dy: number) => {
    const { key, from, to } = drag.current;
    const total = offsetOf(keysRef.current.length) - GAP;
    const height = heightOf(key);
    const clamped = Math.max(-offsetOf(from), Math.min(total - offsetOf(from) - height, dy));
    dragY.setValue(clamped);
    const center = offsetOf(from) + height / 2 + clamped;
    let newTo = 0;
    keysRef.current.forEach((k, j) => {
      if (j === from) return;
      if (offsetOf(j) + heightOf(k) / 2 < center) newTo += 1;
    });
    if (newTo !== to) {
      drag.current.to = newTo;
      animateShifts(from, newTo);
      Haptics.selectionAsync();
    }
  };

  const end = () => {
    const { from, to } = drag.current;
    if (!drag.current.key) return;
    // Slide the held row into the slot it's over, then commit the new order.
    let delta = 0;
    if (to > from) {
      for (let j = from + 1; j <= to; j += 1) delta += heightOf(keysRef.current[j]) + GAP;
    } else if (to < from) {
      for (let j = to; j < from; j += 1) delta -= heightOf(keysRef.current[j]) + GAP;
    }
    Animated.timing(dragY, { toValue: delta, duration: 120, useNativeDriver: true }).start(() => {
      const next = [...keysRef.current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      keysRef.current.forEach((k) => shiftOf(k).setValue(0));
      dragY.setValue(0);
      drag.current = { key: '', from: 0, to: 0 };
      setDraggingKey(null);
      onDragStateChange?.(false);
      if (to !== from) onReorder(next);
    });
  };

  return (
    <View>
      {items.map((item, index) => {
        const key = keys[index];
        const isDragging = key === draggingKey;
        const grip =
          items.length > 1 ? (
            <Grip label={labelOf(item)} onStart={() => start(key)} onMove={move} onEnd={end} />
          ) : (
            <View style={styles.grip} />
          );
        return (
          <Animated.View
            key={key}
            onLayout={(e) => {
              heights.current[key] = e.nativeEvent.layout.height;
            }}
            style={[
              { marginBottom: index < items.length - 1 ? GAP : 0 },
              isDragging
                ? [styles.lifted, { transform: [{ translateY: dragY }, { scale: 1.02 }] }]
                : { transform: [{ translateY: shiftOf(key) }] },
            ]}
          >
            {renderItem(item, grip, { isDragging })}
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grip: {
    width: 30,
    height: 38,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
    columnGap: 4,
    rowGap: 3,
    paddingHorizontal: 8,
  },
  gripDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#B9B3A2' },
  lifted: { zIndex: 10 },
});

